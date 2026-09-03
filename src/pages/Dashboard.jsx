import { useState, useEffect } from 'react';
import { supabase } from './../supabaseClient'; 
import { BuscadorInteligente } from '../components/BuscadorInteligente'; // <-- 2. NUEVA LÍNEA:
export const Dashboard = () => {
  const [stats, setStats] = useState({
    usuarios: 'Cargando...', tramites: '18', visitas: '12', resueltos: '156'
  });

  useEffect(() => {
    async function cargarMetricas() {
      const { count, error } = await supabase
        .from('vinculos_servicio')
        .select('*', { count: 'exact', head: true });
        
      if (!error && count !== null) {
        setStats(prev => ({ ...prev, usuarios: count.toLocaleString('es-CO') }));
      }
    }
    cargarMetricas();
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Usuarios Activos', value: stats.usuarios, color: 'bg-blue-500' },
          { title: 'Trámites Pendientes', value: stats.tramites, color: 'bg-amber-500' },
          { title: 'Visitas Hoy', value: stats.visitas, color: 'bg-purple-500' },
          { title: 'Resueltos (Mes)', value: stats.resueltos, color: 'bg-emerald-500' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
            <div className={`w-12 h-12 rounded-lg ${stat.color} bg-opacity-10 flex items-center justify-center mr-4`}>
              <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
              <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        {/* Aquí estás usando el componente que separaste arriba */}
        <BuscadorInteligente />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-800">Trámites Recientes (Ventanilla)</h3>
          <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700">Ver todos</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="px-6 py-4 font-medium">Radicado</th>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Tipo de Solicitud</th>
                <th className="px-6 py-4 font-medium">Fase Actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { id: '20260828-001', nombre: 'Juan Pérez', tipo: 'Desvinculación', fase: '1. Recepción', color: 'bg-blue-100 text-blue-700' },
                { id: '20260828-002', nombre: 'María Gómez', tipo: 'Queja Recolección', fase: '4. Radicado Ventanilla', color: 'bg-purple-100 text-purple-700' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{row.nombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{row.tipo}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.color}`}>{row.fase}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};