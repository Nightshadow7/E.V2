import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  Plus, Search, Filter, MoreVertical, Clock, 
  AlertTriangle, CheckCircle, FileText, Loader2, ArrowRight
} from 'lucide-react';

export const TramitesPQRS = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [radicados, setRadicados] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  // Las columnas oficiales de nuestro flujo estricto
  const fases = [
    '1. Recepción',
    '2. Visita de Verificación',
    '3. Cargue Documental',
    '4. Radicado Ventanilla',
    '5. Respuesta Final'
  ];

  useEffect(() => {
    cargarRadicados();
  }, []);

  const cargarRadicados = async () => {
    setLoading(true);
    try {
      // Magia Relacional: Traemos la PQR + Datos de la Casa + Datos de la Persona en 1 sola consulta
      const { data, error } = await supabase
        .from('pqrs')
        .select(`
          id_pqr,
          tipo_solicitud,
          fase_actual,
          fecha_creacion,
          datos_especificos,
          vinculos_servicio (
            personas ( nombres_razon_social, numero_documento ),
            predios ( codigo_acuasan, direccion_fisica, barrio )
          )
        `)
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      if (data) setRadicados(data);
    } catch (error) {
      console.error("Error al cargar PQRS:", error);
    } finally {
      setLoading(false);
    }
  };

  const radicadosFiltrados = radicados.filter(pqr => {
    if (!busqueda) return true;
    const termino = busqueda.toLowerCase();
    const cliente = pqr.vinculos_servicio?.personas?.nombres_razon_social?.toLowerCase() || '';
    const asunto = pqr.datos_especificos?.asunto?.toLowerCase() || '';
    const tipo = pqr.tipo_solicitud?.toLowerCase() || '';
    
    return cliente.includes(termino) || asunto.includes(termino) || tipo.includes(termino);
  });

  const TarjetaPQR = ({ pqr }) => {
    const urgencia = pqr.datos_especificos?.urgencia || 'media';
    const cliente = pqr.vinculos_servicio?.personas?.nombres_razon_social || 'Desconocido';
    const direccion = pqr.vinculos_servicio?.predios?.direccion_fisica || 'Sin dirección';
    
    // Formatear fecha
    const fecha = new Date(pqr.fecha_creacion).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });

    return (
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col gap-3">
        <div className="flex justify-between items-start gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {pqr.tipo_solicitud.substring(0, 20)}...
          </span>
          <button className="text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h4 className="text-sm font-bold text-gray-900 leading-tight mb-1">{cliente}</h4>
          <p className="text-xs text-gray-500 truncate" title={pqr.datos_especificos?.asunto}>
            {pqr.datos_especificos?.asunto || 'Sin asunto registrado'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500">
          <span className="truncate max-w-[140px]">{direccion}</span>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-1">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-bold text-gray-600">{fecha}</span>
          </div>
          
          {urgencia === 'alta' && <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full"><AlertTriangle className="w-3 h-3"/> Alta</span>}
          {urgencia === 'media' && <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Media</span>}
          {urgencia === 'baja' && <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Baja</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      
      {/* HEADER DE LA BANDEJA */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Bandeja de Trámites (PQRS)</h2>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona las solicitudes de los usuarios a través de sus fases.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar trámite o cliente..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button className="p-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 bg-white">
            <Filter className="w-4 h-4" />
          </button>
          <button 
            onClick={() => navigate('/pqrs/nuevo')}
            className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" /> Nuevo Trámite
          </button>
        </div>
      </div>

      {/* ÁREA KANBAN (Scroll Horizontal y Vertical) */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
            <p className="text-sm font-medium">Sincronizando trámites con Supabase...</p>
          </div>
        ) : (
          <div className="flex gap-6 h-full min-w-max pb-2">
            
            {/* Iteramos sobre las 5 fases estrictas */}
            {fases.map((fase) => {
              // Filtramos los radicados que pertenecen a esta columna
              const radicadosEnFase = radicadosFiltrados.filter(pqr => pqr.fase_actual === fase);
              
              return (
                <div key={fase} className="w-80 flex flex-col h-full bg-slate-100/50 rounded-xl border border-gray-200/60 overflow-hidden shrink-0">
                  {/* Encabezado de la Columna */}
                  <div className="px-4 py-3 border-b border-gray-200/60 bg-slate-100 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-sm text-gray-700 truncate">{fase}</h3>
                    <span className="bg-white text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                      {radicadosEnFase.length}
                    </span>
                  </div>
                  
                  {/* Contenedor de Tarjetas (Scroll Vertical) */}
                  <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                    {radicadosEnFase.length === 0 ? (
                      <div className="h-24 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-xs font-medium">
                        Sin trámites aquí
                      </div>
                    ) : (
                      radicadosEnFase.map(pqr => <TarjetaPQR key={pqr.id_pqr} pqr={pqr} />)
                    )}
                  </div>
                </div>
              )
            })}
            
          </div>
        )}
      </div>

    </div>
  );
};