import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';

/**
 * GlobalSearch — barra de búsqueda del header principal.
 * - En /pqrs: filtra la bandeja kanban usando el query param ?q=
 * - En otras páginas: navega a /pqrs?q=termino al presionar Enter
 */
export const GlobalSearch = ({ location }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [valor, setValor] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const termino = valor.trim();
      navigate(`/pqrs${termino ? `?q=${encodeURIComponent(termino)}` : ''}`);
    }
    if (e.key === 'Escape') {
      setValor('');
      if (location?.pathname === '/pqrs') {
        navigate('/pqrs');
      }
    }
  };

  // Mientras escribe y está en /pqrs, actualiza el param sin cambiar de página
  const handleChange = (e) => {
    const v = e.target.value;
    setValor(v);
    if (location?.pathname === '/pqrs') {
      if (v.trim()) {
        navigate(`/pqrs?q=${encodeURIComponent(v.trim())}`, { replace: true });
      } else {
        navigate('/pqrs', { replace: true });
      }
    }
  };

  return (
    <div className="relative hidden md:block">
      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
      <input
        type="text"
        value={location?.pathname === '/pqrs' ? (searchParams.get('q') || '') : valor}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={
          location?.pathname === '/pqrs'
            ? 'Filtrar bandeja…'
            : 'Buscar cédula o radicado…'
        }
        className="pl-9 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-64 bg-gray-50 transition-all"
      />
      {valor && (
        <button
          onClick={() => {
            setValor('');
            if (location?.pathname === '/pqrs') navigate('/pqrs', { replace: true });
          }}
          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs font-bold"
        >
          ✕
        </button>
      )}
    </div>
  );
};
