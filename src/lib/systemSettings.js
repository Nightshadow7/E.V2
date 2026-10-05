import { supabase } from '../supabaseClient';
export const DEFAULT_SETTINGS = { id: 1, urgencia_predeterminada: 'media', max_archivo_mb: 10, exigir_anexo_reclamo: false };
export async function cargarConfiguracion() {
  const { data, error } = await supabase.from('configuracion_sistema').select('*').eq('id', 1).single();
  if (error) throw new Error('No se pudo cargar la configuración. Verifica la conexión y la migración de Supabase.', { cause: error });
  return data;
}
