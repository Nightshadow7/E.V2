import { TIPOS_PQRS } from '../../lib/pqrs';

const DESCRIPCIONES = {
  'Petición': 'Solicitud de información o de un servicio.',
  'Queja': 'Inconformidad con la atención o la prestación del servicio.',
  'Reclamo': 'Solicitud de revisión de cobros o facturación.',
  'Felicitación': 'Reconocimiento a una persona, área o servicio.',
  'Desvinculación': 'Solicitud de retiro del servicio.'
};
const control = 'block w-full min-w-0 mt-1 px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg disabled:bg-gray-100';
export const FormularioDetallePQRS = ({ formData, setFormData, isClienteSeleccionado }) => {
  const extra = (campo, valor) => setFormData(prev => ({ ...prev, datos_extra: { ...prev.datos_extra, [campo]: valor } }));
  const cambiar = (campo, valor) => setFormData(prev => ({ ...prev, [campo]: valor }));
  return <section className="bg-white min-w-0 rounded-2xl border border-gray-200 p-5 space-y-5">
    <div><h2 className="text-lg font-bold text-gray-900">2. Detalles de la Solicitud</h2><p className="text-gray-600">Elige el tipo de trámite. Cada categoría tiene su propio formulario.</p></div>
    <fieldset className="min-w-0"><legend className="font-bold mb-2">Tipo de solicitud</legend><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {TIPOS_PQRS.map(tipo => <label key={tipo} className={`flex items-start gap-2 p-3 rounded-lg border-2 cursor-pointer ${formData.tipo_solicitud === tipo ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200'}`}><input type="radio" name="tipo_solicitud" value={tipo} checked={formData.tipo_solicitud === tipo} onChange={() => setFormData(prev => ({ ...prev, tipo_solicitud: tipo, datos_extra: {} }))} className="mt-1" /><span><strong className="block">{tipo}</strong><span className="text-sm text-gray-600">{DESCRIPCIONES[tipo]}</span></span></label>)}
    </div></fieldset>
    {!isClienteSeleccionado && <p role="status" className="p-3 rounded-lg bg-blue-50 text-blue-800">Selecciona un suscriptor en el paso 1 para completar los datos. No hay ninguna carga pendiente.</p>}
    <fieldset disabled={!isClienteSeleccionado} className="min-w-0 space-y-5">
      <legend className="font-bold text-emerald-800 mb-3">Formulario de {formData.tipo_solicitud}</legend>
      <label className="block font-medium">Asunto Resumido<input className={control} required maxLength={200} value={formData.asunto} onChange={e => cambiar('asunto', e.target.value)} placeholder={`Asunto de ${formData.tipo_solicitud.toLowerCase()}`} /></label>
      {formData.tipo_solicitud === 'Petición' && <label className="block">Información o servicio solicitado<input className={control} value={formData.datos_extra?.servicio_solicitado || ''} onChange={e => extra('servicio_solicitado', e.target.value)} placeholder="Ej. Información sobre recolección" /></label>}
      {formData.tipo_solicitud === 'Queja' && <div className="grid sm:grid-cols-2 gap-4"><label>Área Implicada (opcional)<select className={control} value={formData.datos_extra?.area_implicada || ''} onChange={e => extra('area_implicada', e.target.value)}><option value="">Sin especificar</option>{['Recolección','Acueducto','Atención al Cliente','Facturación'].map(area => <option key={area}>{area}</option>)}</select></label><label>Empleado implicado (opcional)<input className={control} value={formData.datos_extra?.empleado_implicado || ''} onChange={e => extra('empleado_implicado', e.target.value)} /></label></div>}
      {formData.tipo_solicitud === 'Reclamo' && <div className="grid sm:grid-cols-2 gap-4"><label>Número de Factura<input className={control} value={formData.datos_extra?.numero_factura || ''} onChange={e => extra('numero_factura', e.target.value)} /></label><label>Mes de facturación<input type="month" className={control} value={formData.datos_extra?.mes_facturado || ''} onChange={e => extra('mes_facturado', e.target.value)} /></label></div>}
      {formData.tipo_solicitud === 'Felicitación' && <label className="block">Área o Empleado Reconocido (opcional)<input className={control} value={formData.datos_extra?.reconocido || ''} onChange={e => extra('reconocido', e.target.value)} placeholder="Persona o equipo al que deseas felicitar" /></label>}
      {formData.tipo_solicitud === 'Desvinculación' && <label className="block">Motivo de Desvinculación<select className={control} required value={formData.datos_extra?.motivo_desvinculacion || ''} onChange={e => extra('motivo_desvinculacion', e.target.value)}><option value="">Selecciona un motivo</option>{['Cambio de Domicilio / Venta','Insatisfacción con el Servicio','Cambio de Proveedor','Inmueble Desocupado / Demolido'].map(m => <option key={m}>{m}</option>)}</select></label>}
      <label className="block font-medium">Descripción Detallada<textarea className={`${control} min-h-32`} required maxLength={2000} rows={5} value={formData.descripcion} onChange={e => cambiar('descripcion', e.target.value)} placeholder="Escribe los hechos o la solicitud aquí. Este espacio es para escribir, no es un indicador de carga." /><span className="text-sm text-gray-500">{formData.descripcion.length}/2000 caracteres</span></label>
      <fieldset className="min-w-0"><legend className="font-medium mb-2">Urgencia operativa</legend><div className="flex flex-wrap gap-4">{['baja','media','alta'].map(u => <label key={u} className="flex items-center gap-2"><input type="radio" name="urgencia" value={u} checked={formData.urgencia === u} onChange={() => cambiar('urgencia', u)} />{u}</label>)}</div></fieldset>
    </fieldset>
  </section>;
};
