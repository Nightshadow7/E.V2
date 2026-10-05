import { supabase } from '../supabaseClient';
import { ROLES } from './roles';

export async function cargarEmpleadoAutenticado() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;
  const { data, error } = await supabase.from('empleados')
    .select('id_empleado,auth_user_id,nombres,email,rol,estado')
    .eq('auth_user_id', user.id).single();
  if (error) throw new Error('No se pudo validar tu perfil. Verifica la vinculación de Authentication con empleados y la migración de seguridad.', { cause: error });
  if (data.estado !== 'Activo' || !ROLES.includes(data.rol)) throw new Error('Tu cuenta está inactiva o no tiene un rol autorizado.');
  // Es una copia para borradores y formularios; nunca autoriza el acceso.
  localStorage.setItem('ecoUser', JSON.stringify(data));
  return data;
}
