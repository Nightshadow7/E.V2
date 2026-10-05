export const TIPOS_PQRS = ['Petición', 'Queja', 'Reclamo', 'Felicitación', 'Desvinculación'];
export const FASES_PQRS = ['1. Recepción', '2. Visita de Verificación', '3. Cargue Documental', '4. Radicado Ventanilla', '5. Respuesta Final'];
export const normalizarTexto = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function tipoCanonico(value) {
  const texto = normalizarTexto(value);
  return TIPOS_PQRS.find(tipo => texto.includes(normalizarTexto(tipo))) || value || 'Sin clasificar';
}
const uno = value => Array.isArray(value) ? value[0] : value;
export function normalizarPQR(pqr) {
  const vinculo = uno(pqr.vinculos_servicio);
  return { ...pqr, tipo_solicitud: tipoCanonico(pqr.tipo_solicitud), datos_especificos: pqr.datos_especificos && typeof pqr.datos_especificos === 'object' && !Array.isArray(pqr.datos_especificos) ? pqr.datos_especificos : {}, vinculos_servicio: { ...vinculo, personas: uno(vinculo?.personas), predios: uno(vinculo?.predios) } };
}
export function filtrarPQR(pqr, { busqueda = '', tipo = 'Todos', urgencia = 'Todas', fase = 'Todas' }) {
  if (tipo !== 'Todos' && pqr.tipo_solicitud !== tipo) return false;
  if (urgencia !== 'Todas' && (pqr.datos_especificos.urgencia || 'media') !== urgencia) return false;
  if (fase !== 'Todas' && pqr.fase_actual !== fase) return false;
  const q = normalizarTexto(busqueda).replace(/^#?pqr-/, '');
  return [pqr.id_pqr, pqr.tipo_solicitud, pqr.fase_actual, pqr.datos_especificos.asunto, pqr.vinculos_servicio.personas?.nombres_razon_social, pqr.vinculos_servicio.personas?.numero_documento, pqr.vinculos_servicio.predios?.codigo_acuasan].some(value => normalizarTexto(value).includes(q));
}
