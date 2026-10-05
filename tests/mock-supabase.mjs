export const userFixture = { id_empleado: 'emp-1', auth_user_id: '00000000-0000-0000-0000-000000000001', nombres: 'Operador de prueba', email: 'operador@example.test', rol: 'Administrador', estado: 'Activo' };
export function instalarMocks(supabase) {
  const calls = [];
  const user = { ...userFixture };
  const database = {
    empleados: [user],
    configuracion_sistema: [{ id: 1, urgencia_predeterminada: 'media', max_archivo_mb: 10, exigir_anexo_reclamo: false }],
    vinculos_servicio: [{ id_vinculo: 'v-1', estado_servicio: 'Activo', personas: { nombres_razon_social: 'Suscriptor de prueba', numero_documento: 'TEST-001', tipo_documento: 'CC' }, predios: { direccion_fisica: 'Dirección de prueba', codigo_acuasan: 'TEST-01' } }],
    auditoria_eventos: [{ id: 1, fecha: '2026-10-05T14:00:00Z', actor_id: user.auth_user_id, actor_nombre: user.nombres, actor_rol: 'Administrador', tabla: 'public.personas', registro_id: 'p-1', accion: 'UPDATE', antes: { nombres_razon_social: 'Anterior' }, despues: { nombres_razon_social: 'Actualizado' }, campos: ['nombres_razon_social'] }],
    pqrs: ['Petición','Queja','Reclamo','Felicitación','Desvinculación'].map((tipo,i) => ({ id_pqr: `pqr-${i+1}`, tipo_solicitud: tipo, fase_actual: '1. Recepción', fecha_creacion: '2026-10-05T14:00:00Z', datos_especificos: { asunto: `Asunto de ${tipo}`, descripcion: `Descripción de ${tipo}`, urgencia: 'media' }, vinculos_servicio: { personas: { nombres_razon_social: 'Suscriptor de prueba', numero_documento: 'TEST-001' }, predios: { direccion_fisica: 'Dirección de prueba', codigo_acuasan: 'TEST-01' } } }))
  };
  const state = { user, calls, database, session: true, authError: null, tableError: null };
  supabase.auth.getUser = async () => ({ data: { user: state.session ? { id: user.auth_user_id, email: user.email } : null }, error: null });
  supabase.auth.onAuthStateChange = () => ({ data: { subscription: { unsubscribe() {} } } });
  supabase.auth.signOut = async () => { state.session = false; return { error: null }; };
  supabase.auth.signInWithPassword = async values => { calls.push({ action: 'login', values }); state.session = !state.authError; return { error: state.authError }; };
  supabase.auth.updateUser = async values => { calls.push({ action: 'updateUser', values }); return { data: { user: { id: user.auth_user_id, email: user.email } }, error: state.authError }; };
  supabase.storage.from = () => ({ upload: async (path,file) => { calls.push({ action: 'upload', path, size: file.size }); return { data: { path }, error: null }; }, createSignedUrl: async () => ({ data: { signedUrl: 'https://example.test/anexo.pdf' }, error: null }) });
  supabase.from = table => {
    let action = 'select', payload, single = false, start = 0, end = Infinity;
    const filters = [];
    const query = {
      select() { return query; }, order() { return query; }, abortSignal() { return query; },
      range(a,b) { start=a; end=b; return query; }, limit(n) { end=n-1; return query; },
      eq(key,value) { filters.push(row => key.includes('.') || (typeof row[key] === 'object' ? JSON.stringify(row[key]) === value : row[key] === value)); return query; },
      neq(key,value) { filters.push(row => row[key] !== value); return query; },
      gte() { return query; }, lte() { return query; },
      update(value) { action='update'; payload=value; return query; },
      insert(value) { action='insert'; payload=value; return query; },
      single() { single=true; return query; },
      then(resolve,reject) {
        calls.push({ table, action, payload });
        if (state.tableError) return Promise.resolve({ data: null, error: state.tableError }).then(resolve,reject);
        let rows=(database[table] || []).filter(row=>filters.every(f=>f(row)));
        if (action==='update') rows.forEach(row=>Object.assign(row,payload));
        if (action==='insert') { const row={...payload,id_pqr:'nuevo'}; (database[table] ||= []).push(row); rows=[row]; }
        return Promise.resolve({ data: single ? rows[0] : rows.slice(start,end+1), count: rows.length, error: null }).then(resolve,reject);
      }
    };
    return query;
  };
  return state;
}
