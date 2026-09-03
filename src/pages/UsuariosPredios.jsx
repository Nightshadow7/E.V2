import { useState, useEffect } from 'react';
import { Search, Plus, Loader2, User, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export const UsuariosPredios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para la búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [busquedaDiferida, setBusquedaDiferida] = useState('');
  const [filtro, setFiltro] = useState('todos');
  
  const navigate = useNavigate();

  // 1. Efecto Antirrebote (Debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaDiferida(busqueda);
    }, 500);
    return () => clearTimeout(timer);
  }, [busqueda]);

  // 2. Consulta a Supabase cada vez que cambia la búsqueda o el filtro
  useEffect(() => {
    async function cargarUsuarios() {
      setLoading(true);
      
      const columnasSelect = `
          id_vinculo, 
          estado_servicio,
          personas!inner ( nombres_razon_social, numero_documento ),
          predios!inner ( direccion_fisica, barrio, bloque, codigo_acuasan, codigo_essa )
      `;

      if (busquedaDiferida) {
        let promesas = [];

        // A. Si el filtro lo permite, buscamos en la tabla de Personas
        if (filtro === 'todos' || filtro === 'nombre' || filtro === 'documento') {
          let qPersonas = supabase.from('vinculos_servicio').select(columnasSelect).limit(20);
          
          if (filtro === 'nombre') qPersonas = qPersonas.or(`nombres_razon_social.ilike.%${busquedaDiferida}%`, { foreignTable: 'personas' });
          else if (filtro === 'documento') qPersonas = qPersonas.or(`numero_documento.ilike.%${busquedaDiferida}%`, { foreignTable: 'personas' });
          else qPersonas = qPersonas.or(`nombres_razon_social.ilike.%${busquedaDiferida}%,numero_documento.ilike.%${busquedaDiferida}%`, { foreignTable: 'personas' });
          
          promesas.push(qPersonas);
        }

        // B. Si el filtro lo permite, buscamos en la tabla de Predios
        if (filtro === 'todos' || filtro === 'acuasan' || filtro === 'essa') {
          let qPredios = supabase.from('vinculos_servicio').select(columnasSelect).limit(20);
          
          if (filtro === 'acuasan') qPredios = qPredios.or(`codigo_acuasan.ilike.%${busquedaDiferida}%`, { foreignTable: 'predios' });
          else if (filtro === 'essa') qPredios = qPredios.or(`codigo_essa.ilike.%${busquedaDiferida}%`, { foreignTable: 'predios' });
          else qPredios = qPredios.or(`codigo_acuasan.ilike.%${busquedaDiferida}%,codigo_essa.ilike.%${busquedaDiferida}%`, { foreignTable: 'predios' });
          
          promesas.push(qPredios);
        }

        const resultados = await Promise.all(promesas);
        
        let combinados = [];
        resultados.forEach(res => {
          if (!res.error && res.data) {
            combinados = [...combinados, ...res.data];
          }
        });

        // Quitamos los duplicados
        const unicos = Array.from(new Map(combinados.map(item => [item.id_vinculo, item])).values());
        setUsuarios(unicos.slice(0, 20));

      } else {
        const { data, error } = await supabase.from('vinculos_servicio').select(columnasSelect).limit(20);
        if (!error && data) setUsuarios(data);
      }
      
      setLoading(false);
    }
    
    cargarUsuarios();
  }, [busquedaDiferida, filtro]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <h3 className="text-lg font-semibold text-gray-800">Directorio de Usuarios y Predios</h3>
        {/* MODIFICA EL BOTÓN PARA QUE USE onClick={() => navigate('/usuarios/nuevo')} */}
        <button 
          onClick={() => navigate('/usuarios/nuevo')}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Nuevo Usuario
        </button>
      </div>

      {/* Barra de Búsqueda Activa con Filtro */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex flex-col sm:flex-row gap-3 max-w-4xl">
          <div className="w-full sm:w-64">
            <select 
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-gray-50 text-gray-700 transition-all cursor-pointer font-medium"
            >
              <option value="todos">Buscar en todo...</option>
              <option value="acuasan">Solo Código Acuasan</option>
              <option value="essa">Solo Código ESSA</option>
              <option value="documento">Solo Cédula / NIT</option>
              <option value="nombre">Solo Nombres / Empresa</option>
            </select>
          </div>

          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Escribe aquí para buscar..." 
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" 
            />
          </div>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="flex-1 overflow-auto bg-slate-50/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
            <p className="font-medium text-gray-500">Buscando en la base de datos...</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <User className="w-12 h-12 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-600">No hay resultados</h3>
            <p className="text-sm">No encontramos coincidencias para tu búsqueda.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200 sticky top-0 shadow-sm z-10">
                <th className="px-6 py-4 font-medium">Cliente / Empresa</th>
                <th className="px-6 py-4 font-medium">Cód. Acuasan</th>
                <th className="px-6 py-4 font-medium">Cód. ESSA</th>
                <th className="px-6 py-4 font-medium">Ubicación Física</th>
                <th className="px-6 py-4 font-medium text-center">Estado</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {usuarios.map((row, i) => (
                <tr key={row.id_vinculo || i} className="hover:bg-emerald-50/50 transition-colors group cursor-pointer">
                  <td className="px-6 py-4 flex items-center">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center mr-3 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {row.personas?.nombres_razon_social || 'Sin nombre'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-blue-600 font-medium">
                    {row.predios?.codigo_acuasan || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-emerald-600 font-medium">
                    {row.predios?.codigo_essa || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 text-gray-400 mr-1.5 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="block text-sm text-gray-900 truncate max-w-[200px]">{row.predios?.direccion_fisica}</span>
                        <span className="block text-xs text-gray-500">{row.predios?.barrio} • {row.predios?.bloque}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${row.estado_servicio === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {row.estado_servicio}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => navigate(`/usuarios/${row.id_vinculo}`)}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-800 px-3 py-1.5 rounded hover:bg-emerald-50 transition-colors">
                      Ver Perfil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}