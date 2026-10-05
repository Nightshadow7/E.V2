import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Loader2 } from 'lucide-react';

export const RecentPQRS = () => {
  const [tramites, setTramites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function cargarRecientes() {
      setLoading(true);
      const { data, error } = await supabase
        .from('pqrs')
        .select(`
          id_pqr,
          tipo_solicitud,
          fase_actual,
          fecha_creacion,
          vinculos_servicio (
            personas ( nombres_razon_social )
          )
        `)
        .order('fecha_creacion', { ascending: false })
        .limit(6);

      if (!error && data) {
        setTramites(data);
      }
      setLoading(false);
    }
    
    cargarRecientes();
  }, []);

  const getColorFase = (fase) => {
    if (fase.includes('1.')) return 'bg-blue-100 text-blue-700';
    if (fase.includes('2.') || fase.includes('3.')) return 'bg-amber-100 text-amber-700';
    if (fase.includes('4.')) return 'bg-purple-100 text-purple-700';
    if (fase.includes('5.')) return 'bg-emerald-100 text-emerald-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <h3 className="text-lg font-semibold text-gray-800">Trámites Recientes</h3>
        <button onClick={() => navigate('/pqrs')} className="text-sm text-emerald-600 font-medium hover:text-emerald-700 transition-colors">
          Ver todos
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
              <th className="px-6 py-4 font-medium">Radicado / Fecha</th>
              <th className="px-6 py-4 font-medium">Cliente</th>
              <th className="px-6 py-4 font-medium">Tipo de Solicitud</th>
              <th className="px-6 py-4 font-medium text-center">Fase Actual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                  Cargando trámites...
                </td>
              </tr>
            ) : tramites.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500 font-medium">
                  No hay trámites radicados aún.
                </td>
              </tr>
            ) : (
              tramites.map((row) => (
                <tr key={row.id_pqr} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">#PQR-{row.id_pqr}</p>
                    <p className="text-[11px] text-gray-500 font-medium">{new Date(row.fecha_creacion).toLocaleDateString('es-CO')}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    {row.vinculos_servicio?.personas?.nombres_razon_social || 'Desconocido'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs" title={row.tipo_solicitud}>
                    {row.tipo_solicitud}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${getColorFase(row.fase_actual)}`}>
                      {row.fase_actual}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
