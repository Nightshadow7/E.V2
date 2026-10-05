import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export const StatCards = () => {
  const [stats, setStats] = useState({
    usuarios: '...', tramites: '...', visitas: '...', resueltos: '...'
  });

  useEffect(() => {
    async function cargarMetricas() {
      // 1. Usuarios Activos
      const { count: countUsuarios } = await supabase
        .from('vinculos_servicio')
        .select('*', { count: 'exact', head: true });

      // 2. Trámites Pendientes (fase_actual != '5. Respuesta Final')
      const { count: countPendientes } = await supabase
        .from('pqrs')
        .select('*', { count: 'exact', head: true })
        .neq('fase_actual', '5. Respuesta Final');

      // 3. Visitas Hoy (fase_actual == '2. Visita de Verificación')
      const { count: countVisitas } = await supabase
        .from('pqrs')
        .select('*', { count: 'exact', head: true })
        .eq('fase_actual', '2. Visita de Verificación');

      // 4. Resueltos (fase_actual == '5. Respuesta Final')
      const { count: countResueltos } = await supabase
        .from('pqrs')
        .select('*', { count: 'exact', head: true })
        .eq('fase_actual', '5. Respuesta Final');

      setStats({
        usuarios: countUsuarios !== null ? countUsuarios.toLocaleString('es-CO') : '0',
        tramites: countPendientes !== null ? countPendientes.toString() : '0',
        visitas: countVisitas !== null ? countVisitas.toString() : '0',
        resueltos: countResueltos !== null ? countResueltos.toString() : '0'
      });
    }
    
    cargarMetricas();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[
        { title: 'Usuarios Activos', value: stats.usuarios, color: 'bg-blue-500' },
        { title: 'Trámites Pendientes', value: stats.tramites, color: 'bg-amber-500' },
        { title: 'En Verificación', value: stats.visitas, color: 'bg-purple-500' },
        { title: 'Trámites Resueltos', value: stats.resueltos, color: 'bg-emerald-500' }
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
  );
};
