import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { puedeVerTrazabilidad } from '../lib/roles';

const TAMANIO = 50;
const valor = data => data == null ? '—' : typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
export function Trazabilidad({ user }) {
  const permitido = puedeVerTrazabilidad(user);
  const [eventos, setEventos] = useState([]);
  const [filtros, setFiltros] = useState({ accion: '', desde: '', hasta: '' });
  const [aplicados, setAplicados] = useState(filtros);
  const [pagina, setPagina] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [version, setVersion] = useState(0);
  const cargar = useCallback(async (signal) => {
    if (!permitido) return;
    setLoading(true); setError('');
    try {
      let query = supabase.from('auditoria_eventos').select('*', { count: 'exact' }).order('fecha', { ascending: false }).order('id', { ascending: false }).range(pagina * TAMANIO, (pagina + 1) * TAMANIO - 1);
      if (aplicados.accion) query = query.eq('accion', aplicados.accion);
      if (aplicados.desde) query = query.gte('fecha', `${aplicados.desde}T00:00:00-05:00`);
      if (aplicados.hasta) query = query.lte('fecha', `${aplicados.hasta}T23:59:59.999999-05:00`);
      const { data, error, count } = await query.abortSignal(signal);
      if (signal.aborted) return;
      if (error) throw error;
      setEventos(data || []); setTotal(count || 0);
    } catch (err) { if (!signal.aborted) setError(`No se pudo consultar trazabilidad. Comprueba la migración y los permisos: ${err.message}`); }
    finally { if (!signal.aborted) setLoading(false); }
  }, [permitido, pagina, aplicados]);
  useEffect(() => { const controller = new AbortController(); const iniciar = async () => { await cargar(controller.signal); }; iniciar(); return () => controller.abort(); }, [cargar, version]);
  if (!permitido) return <div role="alert" className="bg-amber-50 p-6 rounded-xl">Acceso restringido. Solo Lider y Administrador pueden consultar trazabilidad.</div>;
  return <div className="space-y-5">
    <div><h2 className="text-2xl font-bold">Trazabilidad de cambios</h2><p className="text-gray-600 mt-1">Historial de cambios guardados en la base de datos y cargas de archivos desde la activación de la auditoría. Las contraseñas nunca se muestran ni se almacenan en este historial.</p></div>
    <form className="flex flex-wrap items-end gap-3 bg-white p-4 rounded-xl border" onSubmit={e => { e.preventDefault(); setPagina(0); setAplicados({ ...filtros }); setSeleccionado(null); }}>
      <label>Acción<select className="block border rounded p-2" value={filtros.accion} onChange={e => setFiltros({ ...filtros, accion: e.target.value })}><option value="">Todas</option>{['INSERT','UPDATE','DELETE','ARCHIVO_CARGADO','CUENTA_ACTUALIZADA'].map(a => <option key={a}>{a}</option>)}</select></label>
      <label>Desde<input type="date" className="block border rounded p-2" value={filtros.desde} max={filtros.hasta || undefined} onChange={e => setFiltros({ ...filtros, desde: e.target.value })} /></label>
      <label>Hasta<input type="date" className="block border rounded p-2" value={filtros.hasta} min={filtros.desde || undefined} onChange={e => setFiltros({ ...filtros, hasta: e.target.value })} /></label>
      <button type="submit" className="bg-emerald-600 text-white rounded px-4 py-2">Aplicar filtros</button>
      <button type="button" className="border rounded px-4 py-2" onClick={() => setVersion(v => v + 1)} disabled={loading}>Actualizar</button>
    </form>
    {error && <p role="alert" className="bg-red-50 p-4 text-red-700">{error}</p>}
    {loading ? <p role="status">Cargando historial…</p> : !error && <>
      <div className="overflow-x-auto bg-white rounded-xl border"><table className="w-full text-left text-sm"><thead className="bg-gray-50"><tr>{['Fecha (Colombia)','Responsable','Acción','Tabla / registro','Cambios'].map(t => <th key={t} className="p-3">{t}</th>)}</tr></thead><tbody>
        {eventos.map(evento => <tr key={evento.id} className="border-t"><td className="p-3">{new Date(evento.fecha).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</td><td className="p-3">{evento.actor_nombre}<span className="block text-gray-500">{evento.actor_rol || 'Servicio'}</span></td><td className="p-3">{evento.accion}</td><td className="p-3">{evento.tabla}<span className="block text-xs break-all">{evento.registro_id}</span></td><td className="p-3"><button onClick={() => setSeleccionado(evento)} className="text-emerald-700 underline">Ver cambios #{evento.id}</button></td></tr>)}
        {!eventos.length && <tr><td colSpan={5} className="p-6 text-center text-gray-500">No hay eventos para estos filtros.</td></tr>}
      </tbody></table></div>
      <div className="flex items-center gap-4"><button className="border rounded px-3 py-2" disabled={pagina === 0} onClick={() => setPagina(p => p - 1)}>Anterior</button><span>Página {pagina + 1} · {total} eventos</span><button className="border rounded px-3 py-2" disabled={(pagina + 1) * TAMANIO >= total} onClick={() => setPagina(p => p + 1)}>Siguiente</button></div>
    </>}
    {seleccionado && <section className="bg-white border rounded-xl p-5"><div className="flex justify-between"><h3 className="font-bold">Cambios #{seleccionado.id}</h3><button onClick={() => setSeleccionado(null)} className="underline">Cerrar detalle</button></div><p className="my-3">{seleccionado.actor_nombre} · {seleccionado.accion}</p><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Campo</th><th className="p-2">Antes</th><th className="p-2">Después</th></tr></thead><tbody>{seleccionado.campos.map(campo => <tr key={campo} className="border-t"><td className="p-2 align-top">{campo}</td><td className="p-2 align-top"><pre className="whitespace-pre-wrap break-all">{valor(seleccionado.antes?.[campo])}</pre></td><td className="p-2 align-top"><pre className="whitespace-pre-wrap break-all">{valor(seleccionado.despues?.[campo])}</pre></td></tr>)}</tbody></table></div></section>}
  </div>;
}
