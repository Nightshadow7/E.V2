import { useState } from 'react';
import { Search, Loader2, UserCheck, MapPin, Droplet, RefreshCw, CheckCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export const BuscadorClientePQRS = ({ clienteEncontrado, onClienteSeleccionado, onLimpiarCliente }) => {
  const [filtroBusqueda, setFiltroBusqueda] = useState('cedula');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [isBuscando, setIsBuscando] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  const handleBuscar = async () => {
    if (!terminoBusqueda.trim()) return;

    setIsBuscando(true);
    setResultados([]);
    setBusquedaRealizada(false);

    try {
      const columnasSelect = `
        id_vinculo,
        estado_servicio,
        personas!inner ( nombres_razon_social, numero_documento, tipo_documento ),
        predios!inner ( direccion_fisica, barrio, bloque, codigo_acuasan, codigo_essa, estrato, uso_aseo )
      `;

      let query = supabase.from('vinculos_servicio').select(columnasSelect);

      // BÚSQUEDA EXACTA (.eq en lugar de .ilike)
      const termino = terminoBusqueda.trim();
      if (filtroBusqueda === 'cedula') {
        query = query.eq('personas.numero_documento', termino);
      } else if (filtroBusqueda === 'acuasan') {
        query = query.eq('predios.codigo_acuasan', termino);
      } else if (filtroBusqueda === 'essa') {
        query = query.eq('predios.codigo_essa', termino);
      }

      const { data, error } = await query;

      if (error) throw error;

      setResultados((data || []).map(item => ({ ...item, personas: Array.isArray(item.personas) ? item.personas[0] : item.personas, predios: Array.isArray(item.predios) ? item.predios[0] : item.predios })));
      setBusquedaRealizada(true);
    } catch (error) {
      console.error("Error buscando:", error);
      alert("Ocurrió un error en la búsqueda. Revisa la consola.");
    } finally {
      setIsBuscando(false);
    }
  };

  // Si ya hay un cliente seleccionado, mostramos su tarjeta directamente
  if (clienteEncontrado) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">1. Identificación del Suscriptor</h2>
            <p className="text-sm text-emerald-600 font-bold">Cliente Seleccionado</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col gap-4 relative animate-in fade-in zoom-in duration-300">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-lg font-bold shadow-sm">
                {(clienteEncontrado.personas?.nombres_razon_social || 'Usuario').substring(0,2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">{clienteEncontrado.personas?.nombres_razon_social}</h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  {clienteEncontrado.personas?.tipo_documento} {clienteEncontrado.personas?.numero_documento} •
                  <span className="font-bold text-blue-600 ml-1">Acuasan: {clienteEncontrado.predios?.codigo_acuasan || 'N/A'}</span>
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
              <CheckCircle className="w-4 h-4" /> {clienteEncontrado.estado_servicio || 'Sin estado'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
              <MapPin className="text-rose-500 w-5 h-5 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-gray-500 uppercase">Dirección de Suministro</span>
                <span className="text-sm font-bold text-gray-900 truncate">{clienteEncontrado.predios?.direccion_fisica}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
              <Droplet className="text-blue-500 w-5 h-5 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-gray-500 uppercase">Uso y Estrato</span>
                <span className="text-sm font-bold text-gray-900 truncate">{clienteEncontrado.predios?.uso_aseo} • Estrato {clienteEncontrado.predios?.estrato || 'N/D'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-gray-200 mt-1">
            <button
              type="button"
              onClick={() => {
                onLimpiarCliente();
                setBusquedaRealizada(false);
                setResultados([]);
              }}
              className="text-gray-500 hover:text-gray-800 text-xs font-bold flex items-center gap-1 bg-white border border-gray-300 px-3 py-1.5 rounded-lg shadow-sm"
            >
              <RefreshCw className="w-3 h-3" /> Buscar otro cliente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay cliente seleccionado, mostramos el buscador
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col gap-6">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
          <UserCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">1. Identificación del Suscriptor</h2>
          <p className="text-sm text-gray-500">Búsqueda censal EXACTA en base de datos</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="sm:w-1/3">
          <label className="text-sm font-bold text-gray-700 mb-1 block">Filtrar por:</label>
          <select
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
          >
            <option value="acuasan">Solo Código Acuasan</option>
            <option value="essa">Solo Código ESSA</option>
            <option value="cedula">Solo Cédula / NIT</option>
          </select>
        </div>

        <div className="sm:w-2/3">
          <label className="text-sm font-bold text-gray-700 mb-1 block">Término exacto de búsqueda:</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBuscar(); } }}
                placeholder={filtroBusqueda === 'cedula' ? 'Ej. 1098742315' : 'Ej. 12345 (Coincidencia exacta)'}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
            <button
              type="button"
              aria-label="Consultar"
              onClick={handleBuscar}
              disabled={isBuscando || !terminoBusqueda}
              className="px-6 py-3 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm disabled:opacity-70 transition-all"
            >
              {isBuscando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              <span className="hidden sm:inline">Consultar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Resultados de la Búsqueda */}
      {busquedaRealizada && (
        <div className="mt-2 animate-in fade-in duration-300">
          <h3 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2">
            {resultados.length} Coincidencia(s) Encontrada(s)
          </h3>

          {resultados.length === 0 ? (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-gray-500 text-sm font-medium">
              No se encontró ningún registro EXACTO con "{terminoBusqueda}". <br />
              Intenta verificar el número.
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2">
              {resultados.map((res) => (
                <div key={res.id_vinculo} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-white hover:border-emerald-300 hover:shadow-sm transition-all">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-sm">{res.personas?.nombres_razon_social}</span>
                    <span className="text-xs text-gray-500">
                      {res.personas?.tipo_documento} {res.personas?.numero_documento} |
                      <span className="font-medium text-blue-600 ml-1">Acuasan: {res.predios?.codigo_acuasan || 'N/A'}</span>
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3"/> {res.predios?.direccion_fisica}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onClienteSeleccionado(res)}
                    className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Seleccionar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
