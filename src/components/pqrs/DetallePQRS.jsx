import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { FASES_PQRS } from '../../lib/pqrs';

export function DetallePQRS({ pqr, onClose, onSaved }) {
  const dialog = useRef(null);
  const [fase, setFase] = useState(pqr.fase_actual || '1. Recepción');
  const [respuesta, setRespuesta] = useState(pqr.datos_especificos.respuesta || '');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [anexo, setAnexo] = useState('');
  const [errorAnexo, setErrorAnexo] = useState('');
  const [cargandoAnexo, setCargandoAnexo] = useState(false);
  useEffect(() => { const element = dialog.current; element.showModal(); return () => element.close(); }, []);
  useEffect(() => {
    let active = true;
    async function cargar() {
      if (!pqr.datos_especificos.documento_soporte_path) return;
      setCargandoAnexo(true);
      try {
        const { data, error } = await supabase.storage.from('pqrs-anexos').createSignedUrl(pqr.datos_especificos.documento_soporte_path, 3600);
        if (error) throw error;
        if (active) setAnexo(data.signedUrl);
      } catch (err) { if (active) setErrorAnexo(`No se pudo abrir el anexo: ${err.message}`); }
      finally { if (active) setCargandoAnexo(false); }
    }
    cargar(); return () => { active = false; };
  }, [pqr]);
  const guardar = async event => {
    event.preventDefault();
    if (ocupado) return;
    if (fase === '5. Respuesta Final' && !respuesta.trim()) { setError('Escribe una respuesta antes de finalizar.'); return; }
    setOcupado(true); setError('');
    try {
      const { error } = await supabase.from('pqrs').update({ fase_actual: fase, datos_especificos: { ...pqr.datos_especificos, respuesta: respuesta.trim() } }).eq('id_pqr', pqr.id_pqr).eq('fase_actual', pqr.fase_actual).eq('datos_especificos', JSON.stringify(pqr.datos_especificos)).select('id_pqr').single();
      if (error) throw new Error('No se pudo guardar. Actualiza la bandeja si otro usuario modificó el trámite.', { cause: error });
      await onSaved();
    } catch (err) { setError(err.message); } finally { setOcupado(false); }
  };
  const urlAnterior = /^https?:\/\//.test(pqr.datos_especificos.documento_soporte_url || '') ? pqr.datos_especificos.documento_soporte_url : '';
  return <dialog ref={dialog} aria-labelledby="detalle-titulo" onCancel={e => { e.preventDefault(); if (!ocupado) onClose(); }} className="m-auto w-[min(95vw,48rem)] max-h-[90vh] rounded-xl border p-6 text-gray-900 backdrop:bg-black/50">
    <header className="flex justify-between items-start gap-4"><div><h2 id="detalle-titulo" className="text-xl font-bold">{pqr.tipo_solicitud} · #{pqr.id_pqr}</h2><p>{pqr.vinculos_servicio.personas?.nombres_razon_social || 'Nombre no disponible'}</p></div><button type="button" disabled={ocupado} onClick={onClose} className="border rounded px-3 py-1">Cerrar</button></header>
    <section className="my-5 space-y-3"><h3 className="font-bold">{pqr.datos_especificos.asunto || 'Sin asunto registrado'}</h3><p className="whitespace-pre-wrap">{pqr.datos_especificos.descripcion || 'Este registro no tiene descripción.'}</p><dl>{Object.entries(pqr.datos_especificos).filter(([key]) => !['asunto','descripcion','respuesta','documento_soporte_path','documento_soporte_url','documento_soporte_nombre'].includes(key)).map(([key,value]) => <div key={key} className="py-1"><dt className="font-medium">{key.replaceAll('_',' ')}</dt><dd className="whitespace-pre-wrap break-words">{typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')}</dd></div>)}</dl></section>
    {cargandoAnexo && <p role="status">Preparando enlace seguro al anexo…</p>}
    {errorAnexo && <p role="alert" className="text-red-700">{errorAnexo}</p>}
    {(anexo || urlAnterior) && <a href={anexo || urlAnterior} target="_blank" rel="noreferrer" className="underline text-blue-700">Abrir anexo: {pqr.datos_especificos.documento_soporte_nombre || 'Documento'}</a>}
    <form onSubmit={guardar} className="mt-5"><fieldset disabled={ocupado} className="min-w-0 space-y-4">
      <label className="block">Fase actual<select className="block w-full border p-2 rounded mt-1" value={fase} onChange={e => setFase(e.target.value)} required>{!FASES_PQRS.includes(fase) && <option value={fase}>{fase}</option>}{FASES_PQRS.map(f => <option key={f}>{f}</option>)}</select></label>
      <label className="block">Respuesta / seguimiento<textarea rows={4} maxLength={4000} className="block w-full border rounded p-3 mt-1 min-h-28" value={respuesta} onChange={e => setRespuesta(e.target.value)} required={fase === '5. Respuesta Final'} placeholder="Escribe aquí el seguimiento o la respuesta. Este campo es editable." /></label>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg">{ocupado ? 'Guardando…' : 'Guardar seguimiento'}</button>
    </fieldset></form>
  </dialog>;
}
