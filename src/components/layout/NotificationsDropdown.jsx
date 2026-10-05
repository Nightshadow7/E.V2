import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Bell, AlertTriangle, Clock } from 'lucide-react';

export const NotificationsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Cargar PQRS críticas
    const cargarAlertas = async () => {
      const { data, error } = await supabase
        .from('pqrs')
        .select(`
          id_pqr,
          fase_actual,
          fecha_creacion,
          datos_especificos,
          vinculos_servicio (
            personas ( nombres_razon_social )
          )
        `)
        .neq('fase_actual', '5. Respuesta Final')
        .order('fecha_creacion', { ascending: false });

      if (!error && data) {
        // Filtramos las de urgencia alta
        const altas = data.filter(pqr => pqr.datos_especificos?.urgencia === 'alta');
        setNotificaciones(altas.slice(0, 5)); // Mostrar máximo 5
      }
    };
    
    cargarAlertas();

    // Cerrar al hacer clic afuera
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {notificaciones.length > 0 && (
          <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-sm">Notificaciones</h3>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
              {notificaciones.length} Críticas
            </span>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                No hay alertas críticas en este momento.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notificaciones.map((notif) => (
                  <div 
                    key={notif.id_pqr} 
                    onClick={() => { setIsOpen(false); navigate('/pqrs'); }}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {notif.vinculos_servicio?.personas?.nombres_razon_social || 'Usuario Desconocido'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {notif.datos_especificos?.asunto || 'Trámite Crítico'}
                        </p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(notif.fecha_creacion).toLocaleDateString('es-CO')} - {notif.fase_actual}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-gray-100 bg-gray-50">
            <button 
              onClick={() => { setIsOpen(false); navigate('/pqrs'); }}
              className="w-full text-center text-xs font-bold text-emerald-600 hover:text-emerald-700 py-1"
            >
              Ver todos los trámites
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
