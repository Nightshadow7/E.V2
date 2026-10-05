import { BuscadorInteligente } from '../components/BuscadorInteligente';
import { StatCards } from '../components/dashboard/StatCards';
import { RecentPQRS } from '../components/dashboard/RecentPQRS';

export const Dashboard = () => {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      {/* 1. Tarjetas de Estadísticas (Conectadas a Supabase) */}
      <StatCards />

      {/* 2. Buscador Central (El que ya estaba) */}
      <div className="mb-8">
        <BuscadorInteligente />
      </div>

      {/* 3. Tabla de Trámites Recientes (Conectada a Supabase) */}
      <RecentPQRS />
    </div>
  );
};