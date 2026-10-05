import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export const BuscadorInteligente = () => {
  const [termino, setTermino] = useState('');
  const navigate = useNavigate();
  return <form onSubmit={event => { event.preventDefault(); navigate(`/usuarios?q=${encodeURIComponent(termino.trim())}`); }} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
    <h3 className="text-lg font-semibold mb-4">Buscar usuarios y predios</h3>
    <div className="flex gap-3"><input aria-label="Nombre, documento o código de servicio" value={termino} onChange={e => setTermino(e.target.value)} placeholder="Nombre, documento, código Acuasan o ESSA" className="border rounded-lg p-3 flex-1 min-w-0" required /><button type="submit" className="bg-emerald-600 text-white rounded-lg px-4 flex items-center gap-2"><Search size={18} />Buscar</button></div>
  </form>;
};
