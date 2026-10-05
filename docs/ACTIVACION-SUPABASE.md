# Activación de autenticación, trazabilidad y reglas PQRS

El código está preparado y probado localmente. La migración **no se ha ejecutado en el Supabase remoto**: la aplicación dispone de una clave pública, que no permite administrar el esquema SQL. Las consultas de comprobación confirmaron que todavía no existen `empleados.auth_user_id`, `auditoria_eventos` ni `configuracion_sistema`.

## Activación

1. En el proyecto Supabase de EcoSanGil, abre **SQL Editor → New query**.
2. Ejecuta completo `supabase/migrations/202610050001_auth_auditoria_configuracion.sql`. Es una transacción: si encuentra un problema, revierte sus cambios. Antes de retirar los permisos anteriores comprueba que existe al menos un Administrador activo cuyo correo coincide con una cuenta confirmada en Authentication.
3. Comprueba el resultado con esta consulta (no contiene contraseñas):

   ```sql
   select nombres, email, rol, estado, auth_user_id is not null as cuenta_vinculada
   from public.empleados order by rol, nombres;
   ```

   Para diagnosticar cada usuario antes de intentar entrar, ejecuta además:

   ```sql
   select
     e.nombres,
     e.email as correo_empleados,
     e.rol,
     e.estado,
     e.auth_user_id,
     u.id as auth_id,
     u.email as correo_auth,
     (u.email_confirmed_at is not null) as correo_confirmado,
     case
       when e.estado <> 'Activo' then 'DESACTIVADO'
       when e.rol not in ('Comercial','Lider','Administrador') then 'ROL_INVALIDO'
       when u.id is null then 'FALTA_CREAR_O_VINCULAR_AUTH'
       when u.email_confirmed_at is null then 'FALTA_CONFIRMAR_CORREO'
       when lower(trim(e.email)) <> lower(trim(u.email)) then 'CORREOS_NO_COINCIDEN'
       else 'LISTO'
     end as resultado
   from public.empleados e
   left join auth.users u on u.id = e.auth_user_id
   order by resultado, e.nombres;
   ```

   Debes corregir todos los resultados distintos de `LISTO`.

4. Para una cuenta sin vínculo, confirma que exista en **Authentication → Users**, con el mismo correo confirmado que en `empleados`. La migración se puede repetir tras corregir las cuentas. Nunca copies contraseñas a la tabla de empleados.
5. En **Authentication → URL Configuration**, configura Site URL y las URL de retorno permitidas para el dominio real de la aplicación. Mantén activada la confirmación de cambios de correo.
6. Publica el frontend actualizado y entra con correo y contraseña de Authentication. Las sesiones antiguas que solo tenían `ecoUser` no autorizan el acceso.

El cambio de contraseña usa Supabase Auth y exige la contraseña actual en el formulario. El cambio de correo queda pendiente hasta que se completen las confirmaciones configuradas; entonces un trigger sincroniza `empleados.email`.

## Permisos

| Acción | Comercial | Lider | Administrador |
|---|---|---|---|
| Gestionar usuarios, predios y PQRS | Sí | Sí | Sí |
| Cambiar nombre, correo y clave propios | Sí | Sí | Sí |
| Consultar trazabilidad | No | Sí | Sí |
| Consultar reglas del sistema | Sí | Sí | Sí |
| Modificar reglas del sistema | No | No | Sí |
| Gestionar perfiles del equipo y roles | No | No | Sí |
| Editar o borrar el historial | No | No | No |

Los roles se obtienen del perfil asociado al usuario autenticado. La interfaz y las políticas de Supabase aplican la restricción; cambiar localStorage no concede permisos. La gestión del equipo crea perfiles de empleados: las cuentas de acceso se gestionan en Authentication. El correo de una cuenta ya vinculada se cambia desde Mi cuenta.

## Qué registra la trazabilidad

- Inserciones, actualizaciones y eliminaciones de las tablas públicas existentes al aplicar la migración, salvo la propia auditoría.
- Autor autenticado, rol, fecha, registro, campos afectados y valores antes/después. Cambios hechos por un servicio o SQL Editor sin identidad de aplicación aparecen como servicio; no se inventa un empleado responsable.
- Cargas y cambios en Storage. Los anexos nuevos se guardan en el bucket privado `pqrs-anexos`, con acceso mediante enlace temporal. Los enlaces antiguos a Drive se conservan.
- Cambios efectivos de correo y contraseña, **sin registrar contraseñas, hashes ni tokens**.
- Las operaciones fallidas se revierten junto con su evento. Si se carga un archivo y falla después la radicación, la carga sigue registrada; el formulario reutiliza esa carga al reintentar.

El historial empieza cuando se ejecuta la migración; no reconstruye cambios anteriores ni audita modificaciones de archivos antiguos realizadas directamente en Drive. Los borradores son locales al navegador y no son cambios guardados en la base de datos. Para tablas nuevas, incorpora el trigger `app_private.auditar_cambio()` en su migración. El historial recoge cambios de filas, no cambios de estructura SQL.

## Configuración útil

Administrador puede definir urgencia inicial, tamaño de anexo de 1 a 10 MB y obligación de adjuntar soporte a reclamos. El formulario aplica esas reglas y el servidor valida las nuevas PQRS. PDF, JPG, PNG y WebP son los formatos admitidos. Los anexos privados existentes no se borran al reducir el límite.

## Verificación local

- `npm run lint`
- `npm test`: renderizado, interacciones con respuestas simuladas, acceso por rol, cambio de cuenta y ejecución real del SQL en PostgreSQL/WASM con esquema de prueba.
- `npm run build`
- Vista de prueba: `npm run dev -- --host 127.0.0.1 --port 4175`, después `/tests/preview.html`. Usa datos ficticios y no escribe en Supabase.

La prueba local de SQL no sustituye verificar el esquema y permisos del proyecto remoto tras la activación. No se cambiaron claves, correos ni registros reales durante las pruebas. La vista de prueba y las dependencias de prueba no forman parte del build publicado.

Referencias de implementación: [cambio de cuenta en Supabase Auth](https://supabase.com/docs/reference/javascript/auth-updateuser), [contraseña actual y acceso con contraseña](https://supabase.com/docs/guides/auth/passwords), [políticas RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
