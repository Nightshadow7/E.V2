import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { cargarConfiguracion } from '../../lib/systemSettings';
import { esAdministrador } from '../../lib/roles';

export function VariablesSistema({ user }) {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const cargar = useCallback(async () => {
    setError('');
    try { setConfig(await cargarConfiguracion()); } catch (err) { setError(err.message); }
  }, []);
  useEffect(() => { const iniciar = async () => { await cargar(); }; iniciar(); }, [cargar]);
  const guardar = async event => {
    event.preventDefault();
    if (!esAdministrador(user) || ocupado) return;
    setOcupado(true); setError(''); setMensaje('');
    try {
      const { error } = await supabase.from('configuracion_sistema').update({ urgencia_predeterminada: config.urgencia_predeterminada, max_archivo_mb: Number(config.max_archivo_mb), exigir_anexo_reclamo: config.exigir_anexo_reclamo }).eq('id', 1).select('id').single();
      if (error) throw error;
      setMensaje('Configuración guardada. Se aplicará a las nuevas solicitudes.');
    } catch (err) { setError(err.message); } finally { setOcupado(false); }
  };
  return <section className="p-6 space-y-4"><h3 className="text-xl font-bold">Reglas de radicación PQRS</h3>
    <p className="text-gray-600">Estos ajustes son compartidos por todo el equipo. Solo Administrador puede modificarlos; los cambios quedan en trazabilidad.</p>
    {error && <div role="alert" className="text-red-700">{error} <button onClick={cargar} className="underline">Reintentar</button></div>}
    {mensaje && <p role="status" className="text-emerald-700">{mensaje}</p>}
    {!config && !error && <p role="status">Cargando configuración…</p>}
    {config && <form onSubmit={guardar}><fieldset disabled={!esAdministrador(user) || ocupado} className="flex flex-col gap-5">
      <label>Urgencia inicial<select className="block p-2 border rounded mt-1" value={config.urgencia_predeterminada} onChange={e => setConfig({ ...config, urgencia_predeterminada: e.target.value })}>{['baja','media','alta'].map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Tamaño máximo del anexo (1 a 10 MB)<input type="number" min={1} max={10} required className="block p-2 border rounded mt-1" value={config.max_archivo_mb} onChange={e => setConfig({ ...config, max_archivo_mb: e.target.value })} /></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={config.exigir_anexo_reclamo} onChange={e => setConfig({ ...config, exigir_anexo_reclamo: e.target.checked })} />Exigir un anexo al radicar reclamos</label>
      {esAdministrador(user) && <button type="submit" className="self-start bg-emerald-600 text-white px-4 py-2 rounded-lg">{ocupado ? 'Guardando…' : 'Guardar configuración'}</button>}
    </fieldset></form>}
  </section>;
}
