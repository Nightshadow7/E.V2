import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Plus, MapPin, ChevronDown, Check, Building } from 'lucide-react';

const MOCK_BARRIOS_DB = [
  { bloque: 'Bloque 1', barrio: 'Centro' },
  { bloque: 'Bloque 1', barrio: 'La Playa' },
  { bloque: 'Bloque 2', barrio: 'Villa Olímpica' },
  { bloque: 'Bloque 3', barrio: 'José Antonio Galán' },
  { bloque: 'Bloque 4', barrio: 'Pablo VI' },
  { bloque: 'Bloque 5', barrio: 'La Gruta' }
];

const BLOQUES_UNICOS = [...new Set(MOCK_BARRIOS_DB.map(b => b.bloque))];

export const BuscadorInteligente = () => {
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState('');
  const [barrioBuscado, setBarrioBuscado] = useState('');
  const [barrioSeleccionado, setBarrioSeleccionado] = useState('');
  const [isBarrioDropdownOpen, setIsBarrioDropdownOpen] = useState(false);
  const [barriosDb, setBarriosDb] = useState(MOCK_BARRIOS_DB);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsBarrioDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const barriosFiltrados = useMemo(() => {
    let filtrados = barriosDb;
    if (bloqueSeleccionado) {
      filtrados = filtrados.filter(b => b.bloque === bloqueSeleccionado);
    }
    if (barrioBuscado) {
      filtrados = filtrados.filter(b => 
        b.barrio.toLowerCase().includes(barrioBuscado.toLowerCase())
      );
    }
    return filtrados;
  }, [bloqueSeleccionado, barrioBuscado, barriosDb]);

  const handleSeleccionarBarrio = (barrioItem) => {
    setBarrioSeleccionado(barrioItem.barrio);
    setBarrioBuscado(barrioItem.barrio);
    if (!bloqueSeleccionado) {
      setBloqueSeleccionado(barrioItem.bloque);
    }
    setIsBarrioDropdownOpen(false);
  };

  const handleCrearBarrio = () => {
    const nuevoBloque = bloqueSeleccionado || 'Bloque Por Definir';
    const nuevoBarrio = { bloque: nuevoBloque, barrio: barrioBuscado };
    setBarriosDb([...barriosDb, nuevoBarrio]);
    setBarrioSeleccionado(barrioBuscado);
    setIsBarrioDropdownOpen(false);
    alert(`¡Barrio "${barrioBuscado}" creado y asignado a ${nuevoBloque}!`);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <MapPin className="w-5 h-5 mr-2 text-emerald-600" />
        Buscador Bidireccional (Prueba de UX)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bloque</label>
          <div className="relative">
            <select
              value={bloqueSeleccionado}
              onChange={(e) => {
                setBloqueSeleccionado(e.target.value);
                setBarrioBuscado('');
                setBarrioSeleccionado('');
              }}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white transition-all"
            >
              <option value="">Todos los bloques...</option>
              {BLOQUES_UNICOS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <Building className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
          </div>
        </div>

        <div ref={dropdownRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">Barrio o Vereda</label>
          <div className="relative">
            <input
              type="text"
              value={barrioBuscado}
              onChange={(e) => {
                setBarrioBuscado(e.target.value);
                setBarrioSeleccionado('');
                setIsBarrioDropdownOpen(true);
              }}
              onFocus={() => setIsBarrioDropdownOpen(true)}
              placeholder="Ej. Pablo VI..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
          </div>

          {isBarrioDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
              {barriosFiltrados.length > 0 ? (
                barriosFiltrados.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSeleccionarBarrio(item)}
                    className="px-4 py-3 hover:bg-emerald-50 cursor-pointer flex justify-between items-center transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div>
                      <span className="block font-medium text-gray-800">{item.barrio}</span>
                      <span className="text-xs text-gray-500">{item.bloque}</span>
                    </div>
                    {barrioSeleccionado === item.barrio && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500 mb-3">No se encontró "{barrioBuscado}"</p>
                  <button onClick={handleCrearBarrio} className="flex items-center justify-center w-full py-2 bg-emerald-100 text-emerald-700 rounded-md font-medium hover:bg-emerald-200 transition-colors">
                    <Plus className="w-4 h-4 mr-1" />
                    Crear nuevo barrio
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};