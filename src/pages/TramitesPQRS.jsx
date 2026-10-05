import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { TIPOS_PQRS, FASES_PQRS, normalizarPQR, filtrarPQR } from '../lib/pqrs';
import { DetallePQRS } from '../components/pqrs/DetallePQRS';

export const TramitesPQRS = () => {
  const [params, setParams] = useSearchParams();
  const [radicados, setRadicados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [filtros, setFiltros] = useState({ tipo: 'Todos', urgencia: 'Todas', fase: 'Todas' });
  const busqueda = params.get('q') || '';
  const cargar = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const acumulados = [];
      for (let inicio = 0; ; inicio += 500) {
        const { data, error } = await supabase.from('pqrs').select('id_pqr,tipo_solicitud,fase_actual,fecha_creacion,datos_especificos,vinculos_servicio(personas(nombres_razon_social,numero_documento),predios(codigo_acuasan,direccion_fisica))').order('fecha_creacion', { ascending: false }).order('id_pqr', { ascending: false }).range(inicio, inicio + 499);
        if (error) throw error;
        acumulados.push(...(data || []));
        if (!data || data.length < 500) break;
      }
      setRadicados(acumulados.map(normalizarPQR));
    } catch (err) { setError(`No se pudieron cargar las solicitudes: ${err.message}`); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const iniciar = async () => { await cargar(); }; iniciar(); }, [cargar]);
  const cambiarBusqueda = q => setParams(prev => { const next = new URLSearchParams(prev); if (q) next.set('q', q); else next.delete('q'); return next; }, { replace: true });
  const filtrados = radicados.filter(p => filtrarPQR(p, { ...filtros, busqueda }));
  const categorias = [...TIPOS_PQRS, ...new Set(radicados.map(p => p.tipo_solicitud).filter(t => !TIPOS_PQRS.includes(t)))].filter(t => filtros.tipo === 'Todos' || filtros.tipo === t);
  const control = 'border rounded-lg p-2 bg-white min-w-0';
  return <div className="space-y-5 min-w-0">
    <header className="flex flex-wrap gap-4 justify-between items-center"><div><h2 className="text-2xl font-bold">Trámites PQRS por categoría</h2><p className="text-gray-600">Cada tipo tiene su sección, sus solicitudes y su formulario.</p></div><Link to="/pqrs/nuevo" className="px-4 py-2 rounded-lg bg-emerald-600 text-white">Nuevo trámite</Link></header>
    <div className="bg-white border rounded-xl p-4 flex flex-wrap gap-3 items-end">
      <label className="flex-1 min-w-40">Buscar<input className={`${control} block w-full`} value={busqueda} onChange={e => cambiarBusqueda(e.target.value)} placeholder="Radicado, cliente, cédula o asunto" /></label>
      <label>Tipo<select className={`${control} block`} value={filtros.tipo} onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}>{['Todos', ...TIPOS_PQRS].map(t => <option key={t}>{t}</option>)}</select></label>
      <label>Fase<select className={`${control} block max-w-60`} value={filtros.fase} onChange={e => setFiltros({ ...filtros, fase: e.target.value })}>{['Todas', ...FASES_PQRS].map(f => <option key={f}>{f}</option>)}</select></label>
      <label>Urgencia<select className={`${control} block`} value={filtros.urgencia} onChange={e => setFiltros({ ...filtros, urgencia: e.target.value })}>{['Todas','baja','media','alta'].map(u => <option key={u}>{u}</option>)}</select></label>
      <button onClick={() => { cambiarBusqueda(''); setFiltros({ tipo: 'Todos', fase: 'Todas', urgencia: 'Todas' }); }} className="underline py-2">Limpiar filtros</button><button onClick={cargar} disabled={loading} className="border rounded px-3 py-2">Actualizar</button>
    </div>
    {error && <p role="alert" className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</p>}
    {loading ? <p role="status">Cargando trámites…</p> : !error && <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {categorias.map(tipo => { const solicitudes = filtrados.filter(p => p.tipo_solicitud === tipo); return <section key={tipo} aria-label={`Solicitudes de ${tipo}`} className="bg-white border border-gray-200 rounded-xl overflow-hidden min-w-0">
        <header className="p-4 bg-emerald-50 border-b flex flex-wrap gap-2 justify-between items-center"><h3 className="font-bold text-lg text-emerald-900">{tipo} <span className="text-sm">({solicitudes.length})</span></h3>{TIPOS_PQRS.includes(tipo) && <Link className="text-emerald-800 underline text-sm" to={`/pqrs/nuevo?tipo=${encodeURIComponent(tipo)}`}>Crear {tipo.toLowerCase()}</Link>}</header>
        <div className="p-4 space-y-3">{!solicitudes.length && <p className="text-gray-500 py-4">No hay solicitudes de {tipo.toLowerCase()} para estos filtros.</p>}
          {solicitudes.map(pqr => <article key={pqr.id_pqr} className="border rounded-lg p-4 space-y-2"><div className="flex justify-between gap-3"><strong className="break-words">{pqr.vinculos_servicio.personas?.nombres_razon_social || 'Nombre no disponible'}</strong><span className="text-xs text-gray-500 break-all">#PQR-{pqr.id_pqr}</span></div><p>{pqr.datos_especificos.asunto || 'Sin asunto registrado'}</p><p className="text-xs text-gray-600">{pqr.fase_actual || 'Sin fase'} · Urgencia {pqr.datos_especificos.urgencia || 'media'}</p><p className="text-xs text-gray-500">{pqr.vinculos_servicio.predios?.direccion_fisica || 'Sin dirección'} · Acuasan {pqr.vinculos_servicio.predios?.codigo_acuasan || '—'}</p><button onClick={() => setDetalle(pqr)} className="text-emerald-700 font-medium underline">Ver detalles #{pqr.id_pqr}</button></article>)}
        </div>
      </section>; })}
    </div>}
    {detalle && <DetallePQRS pqr={detalle} onClose={() => setDetalle(null)} onSaved={async () => { setDetalle(null); await cargar(); }} />}
  </div>;
};
