-- Ejecutar una vez en Supabase SQL Editor antes de publicar esta versión.
-- Conserva los registros; vincula empleados existentes con Authentication por correo.
begin;
create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;
alter table public.empleados add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
create unique index if not exists empleados_auth_user_unique on public.empleados(auth_user_id);
create unique index if not exists empleados_email_normalizado on public.empleados(lower(trim(email)));
update public.empleados e set auth_user_id = u.id from auth.users u
where e.auth_user_id is null and lower(trim(e.email)) = lower(trim(u.email)) and u.email_confirmed_at is not null;
do $$ begin
  if not exists(select 1 from public.empleados where rol::text = 'Administrador' and estado::text = 'Activo' and auth_user_id is not null) then
    raise exception 'Primero debe existir un Administrador activo con el mismo correo confirmado en Authentication.';
  end if;
end $$;

create or replace function app_private.rol_actual() returns text
language sql stable security definer set search_path = '' as $$
  select e.rol::text from public.empleados e where e.auth_user_id = (select auth.uid()) and e.estado::text = 'Activo'
$$;
revoke all on function app_private.rol_actual() from public;
grant execute on function app_private.rol_actual() to authenticated;

create table if not exists public.configuracion_sistema (
  id integer primary key default 1 check (id = 1),
  urgencia_predeterminada text not null default 'media' check (urgencia_predeterminada in ('baja','media','alta')),
  max_archivo_mb integer not null default 10 check (max_archivo_mb between 1 and 10),
  exigir_anexo_reclamo boolean not null default false
);
insert into public.configuracion_sistema(id) values(1) on conflict do nothing;
create table if not exists public.auditoria_eventos (
  id bigint generated always as identity primary key,
  fecha timestamptz not null default now(),
  actor_id uuid,
  actor_nombre text not null,
  actor_rol text,
  tabla text not null,
  registro_id text,
  accion text not null,
  antes jsonb,
  despues jsonb,
  campos text[] not null default '{}'
);
create index if not exists auditoria_fecha_id on public.auditoria_eventos(fecha desc, id desc);
create index if not exists auditoria_actor on public.auditoria_eventos(actor_id);

-- Políticas reemplazadas para evitar que una política permisiva anterior dé acceso anónimo.
do $$ declare t text; pol record; seq record; begin
  foreach t in array array['empleados','personas','predios','vinculos_servicio','pqrs','configuracion_sistema','auditoria_eventos'] loop
    execute format('alter table public.%I enable row level security',t);
    for pol in select policyname from pg_policies where schemaname='public' and tablename=t loop
      execute format('drop policy %I on public.%I',pol.policyname,t);
    end loop;
    execute format('revoke all on public.%I from anon, authenticated',t);
    if t in ('empleados','personas','predios','vinculos_servicio','pqrs') then
      for seq in select pg_get_serial_sequence(format('public.%I', t), column_name) as nombre from information_schema.columns where table_schema='public' and table_name=t loop
        if seq.nombre is not null then execute format('grant usage on sequence %s to authenticated',seq.nombre); end if;
      end loop;
    end if;
  end loop;
end $$;
grant select on public.empleados, public.configuracion_sistema, public.auditoria_eventos to authenticated;
grant insert, update on public.empleados to authenticated;
grant update on public.configuracion_sistema to authenticated;
grant select, insert, update on public.personas, public.predios, public.vinculos_servicio, public.pqrs to authenticated;
create policy empleados_lectura on public.empleados for select to authenticated using
  (auth_user_id = (select auth.uid()) or (select app_private.rol_actual()) = 'Administrador');
create policy empleados_alta on public.empleados for insert to authenticated with check
  ((select app_private.rol_actual()) = 'Administrador');
create policy empleados_edicion on public.empleados for update to authenticated using
  ((select app_private.rol_actual()) = 'Administrador' or (auth_user_id = (select auth.uid()) and (select app_private.rol_actual()) in ('Comercial','Lider')))
  with check ((select app_private.rol_actual()) = 'Administrador' or auth_user_id = (select auth.uid()));
create policy configuracion_lectura on public.configuracion_sistema for select to authenticated using
  ((select app_private.rol_actual()) in ('Comercial','Lider','Administrador'));
create policy configuracion_edicion on public.configuracion_sistema for update to authenticated using
  ((select app_private.rol_actual()) = 'Administrador') with check ((select app_private.rol_actual()) = 'Administrador');
create policy auditoria_lectura on public.auditoria_eventos for select to authenticated using
  ((select app_private.rol_actual()) in ('Lider','Administrador'));
do $$ declare t text; begin
  foreach t in array array['personas','predios','vinculos_servicio','pqrs'] loop
    execute format('create policy equipo_lectura on public.%I for select to authenticated using ((select app_private.rol_actual()) in (''Comercial'',''Lider'',''Administrador''))', t);
    execute format('create policy equipo_alta on public.%I for insert to authenticated with check ((select app_private.rol_actual()) in (''Comercial'',''Lider'',''Administrador''))', t);
    execute format('create policy equipo_edicion on public.%I for update to authenticated using ((select app_private.rol_actual()) in (''Comercial'',''Lider'',''Administrador'')) with check ((select app_private.rol_actual()) in (''Comercial'',''Lider'',''Administrador''))', t);
  end loop;
  if to_regclass('public.vista_barrios') is not null then
    execute 'alter view public.vista_barrios set (security_invoker = true)';
    execute 'revoke all on public.vista_barrios from anon';
    execute 'grant select on public.vista_barrios to authenticated';
  end if;
end $$;

-- RLS controla filas; este trigger protege las columnas de permisos y el correo confirmado.
create or replace function app_private.proteger_empleado() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.rol is null or new.rol::text not in ('Comercial','Lider','Administrador') then raise exception 'Rol no permitido'; end if;
  if tg_op = 'INSERT' then
    if new.auth_user_id is null then
      select id into new.auth_user_id from auth.users where lower(trim(email)) = lower(trim(new.email)) and email_confirmed_at is not null;
    end if;
  elsif auth.uid() is not null then
    if old.auth_user_id is distinct from new.auth_user_id and not (old.auth_user_id is null and pg_trigger_depth() > 1) then raise exception 'La vinculación de identidad no se puede editar desde el navegador'; end if;
    if app_private.rol_actual() is distinct from 'Administrador' and
      ((to_jsonb(new) - 'nombres' - 'email' - 'auth_user_id') is distinct from (to_jsonb(old) - 'nombres' - 'email' - 'auth_user_id')) then
      raise exception 'Solo puedes modificar tu nombre y correo confirmado';
    end if;
    if old.rol::text = 'Administrador' and (new.rol::text <> 'Administrador' or new.estado::text <> 'Activo') then
      raise exception 'No se puede desactivar o degradar un Administrador desde la aplicación';
    end if;
  end if;
  if new.auth_user_id is not null and not exists (
    select 1 from auth.users where id = new.auth_user_id and lower(trim(email)) = lower(trim(new.email)) and email_confirmed_at is not null
  ) then raise exception 'Cambia el correo desde Mi Perfil y confirma el correo en Authentication'; end if;
  return new;
end $$;
drop trigger if exists proteger_empleado on public.empleados;
create trigger proteger_empleado before insert or update on public.empleados for each row execute function app_private.proteger_empleado();

-- Copia solo campos de negocio. Nunca almacenar claves, tokens ni datos de autenticación.
create or replace function app_private.sin_secretos(dato jsonb) returns jsonb
language plpgsql immutable set search_path = '' as $$
declare resultado jsonb; k text; v jsonb; begin
  if jsonb_typeof(dato) = 'object' then
    resultado := '{}'::jsonb;
    for k,v in select * from jsonb_each(dato) loop
      if k !~* '(password|clave|token|secret|credential|authorization|base64)' then
        resultado := resultado || jsonb_build_object(k, app_private.sin_secretos(v));
      end if;
    end loop;
    return resultado;
  elsif jsonb_typeof(dato) = 'array' then
    select coalesce(jsonb_agg(app_private.sin_secretos(value)), '[]'::jsonb) into resultado from jsonb_array_elements(dato);
    return resultado;
  end if;
  return dato;
end $$;
create or replace function app_private.auditar_cambio() returns trigger
language plpgsql security definer set search_path = '' as $$
declare a jsonb; d jsonb; cambios text[]; nombre text; rol text; registro jsonb; begin
  if tg_op <> 'INSERT' then a := app_private.sin_secretos(to_jsonb(old)); end if;
  if tg_op <> 'DELETE' then d := app_private.sin_secretos(to_jsonb(new)); end if;
  if tg_op = 'UPDATE' and a is not distinct from d then return new; end if;
  select array_agg(k order by k) into cambios from (select jsonb_object_keys(coalesce(a,'{}') || coalesce(d,'{}')) k) keys
    where a->k is distinct from d->k;
  select e.nombres, e.rol::text into nombre, rol from public.empleados e where e.auth_user_id = auth.uid();
  registro := coalesce(d,a);
  insert into public.auditoria_eventos(actor_id,actor_nombre,actor_rol,tabla,registro_id,accion,antes,despues,campos)
  values(auth.uid(),coalesce(nombre,'Base de datos / servicio'),rol,tg_table_schema || '.' || tg_table_name,
    coalesce(registro->>'id_pqr',registro->>'id_vinculo',registro->>'id_persona',registro->>'id_predio',registro->>'id_empleado',registro->>'id'),
    case when tg_table_schema = 'storage' and tg_op = 'INSERT' then 'ARCHIVO_CARGADO' else tg_op end,a,d,coalesce(cambios,'{}'));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
-- Audita todas las tablas públicas existentes, incluso cambios realizados fuera de la app.
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname='public' and tablename <> 'auditoria_eventos' loop
    execute format('drop trigger if exists eco_auditoria on public.%I',t.tablename);
    execute format('create trigger eco_auditoria after insert or update or delete on public.%I for each row execute function app_private.auditar_cambio()',t.tablename);
  end loop;
end $$;

create or replace function app_private.sincronizar_identidad() returns trigger
language plpgsql security definer set search_path = '' as $$
declare nombre text; rol text; cambios text[] := '{}'; begin
  if new.email_confirmed_at is not null then
    update public.empleados set auth_user_id = new.id, email = new.email
    where (auth_user_id = new.id or (auth_user_id is null and lower(trim(email)) = lower(trim(new.email))))
      and (auth_user_id is distinct from new.id or email is distinct from new.email);
  end if;
  if tg_op = 'UPDATE' then
    if old.encrypted_password is distinct from new.encrypted_password then cambios := array_append(cambios,'contraseña'); end if;
    if old.email is distinct from new.email then cambios := array_append(cambios,'correo'); end if;
    if cardinality(cambios) > 0 then
      select e.nombres,e.rol::text into nombre,rol from public.empleados e where e.auth_user_id = new.id;
      insert into public.auditoria_eventos(actor_id,actor_nombre,actor_rol,tabla,registro_id,accion,campos)
      values(auth.uid(),coalesce((select e.nombres from public.empleados e where e.auth_user_id=auth.uid()),'Authentication / servicio'),
        (select e.rol::text from public.empleados e where e.auth_user_id=auth.uid()),'auth.users',new.id::text,'CUENTA_ACTUALIZADA',cambios);
    end if;
  end if;
  return new;
end $$;
drop trigger if exists eco_identidad on auth.users;
create trigger eco_identidad after insert or update on auth.users for each row execute function app_private.sincronizar_identidad();

-- Anexos privados: el servicio de Storage registra la carga antes de radicar la PQRS.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('pqrs-anexos','pqrs-anexos',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists eco_anexos_lectura on storage.objects;
drop policy if exists eco_anexos_carga on storage.objects;
drop policy if exists eco_anexos_anon on storage.objects;
create policy eco_anexos_anon on storage.objects as restrictive for all to anon using (bucket_id <> 'pqrs-anexos') with check (bucket_id <> 'pqrs-anexos');
drop policy if exists eco_anexos_limite_lectura on storage.objects;
create policy eco_anexos_limite_lectura on storage.objects as restrictive for select to authenticated using (bucket_id <> 'pqrs-anexos' or (select app_private.rol_actual()) in ('Comercial','Lider','Administrador'));
drop policy if exists eco_anexos_limite_carga on storage.objects;
create policy eco_anexos_limite_carga on storage.objects as restrictive for insert to authenticated with check (bucket_id <> 'pqrs-anexos' or ((storage.foldername(name))[1] = (select auth.uid())::text and (select app_private.rol_actual()) in ('Comercial','Lider','Administrador')));
drop policy if exists eco_anexos_sin_edicion on storage.objects;
create policy eco_anexos_sin_edicion on storage.objects as restrictive for update to authenticated using (bucket_id <> 'pqrs-anexos') with check (bucket_id <> 'pqrs-anexos');
drop policy if exists eco_anexos_sin_borrado on storage.objects;
create policy eco_anexos_sin_borrado on storage.objects as restrictive for delete to authenticated using (bucket_id <> 'pqrs-anexos');
create policy eco_anexos_lectura on storage.objects for select to authenticated using
  (bucket_id='pqrs-anexos' and (select app_private.rol_actual()) in ('Comercial','Lider','Administrador'));
create policy eco_anexos_carga on storage.objects for insert to authenticated with check
  (bucket_id='pqrs-anexos' and (storage.foldername(name))[1] = (select auth.uid())::text and (select app_private.rol_actual()) in ('Comercial','Lider','Administrador'));
drop trigger if exists eco_auditoria_archivos on storage.objects;
create trigger eco_auditoria_archivos after insert or update or delete on storage.objects for each row execute function app_private.auditar_cambio();

-- Los valores del sistema también se hacen cumplir en el servidor al crear solicitudes.
create or replace function app_private.validar_pqrs() returns trigger
language plpgsql security definer set search_path = '' as $$
declare cfg public.configuracion_sistema; begin
  select * into cfg from public.configuracion_sistema where id=1;
  if new.tipo_solicitud::text not in ('Petición','Queja','Reclamo','Felicitación','Desvinculación') then raise exception 'Tipo de solicitud no permitido'; end if;
  if nullif(trim(new.datos_especificos->>'asunto'),'') is null or nullif(trim(new.datos_especificos->>'descripcion'),'') is null then raise exception 'Asunto y descripción obligatorios'; end if;
  if length(new.datos_especificos->>'descripcion') > 2000 then raise exception 'La descripción supera 2000 caracteres'; end if;
  if cfg.exigir_anexo_reclamo and new.tipo_solicitud::text='Reclamo' and coalesce(new.datos_especificos->>'documento_soporte_path','')='' and coalesce(new.datos_especificos->>'documento_soporte_url','')='' then raise exception 'Se requiere anexo para reclamos'; end if;
  if coalesce(new.datos_especificos->>'documento_soporte_path','')<>'' and not exists(select 1 from storage.objects o where o.bucket_id='pqrs-anexos' and o.name=new.datos_especificos->>'documento_soporte_path' and (storage.foldername(o.name))[1]=auth.uid()::text and coalesce((o.metadata->>'size')::bigint,0)<=cfg.max_archivo_mb*1048576) then raise exception 'Anexo inexistente, de otro usuario o demasiado grande'; end if;
  return new;
end $$;
drop trigger if exists eco_validar_pqrs on public.pqrs;
create trigger eco_validar_pqrs before insert on public.pqrs for each row execute function app_private.validar_pqrs();
revoke all on all functions in schema app_private from public;
grant execute on function app_private.rol_actual() to authenticated;
commit;
