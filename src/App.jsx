import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Users, FileText, Settings, Menu, X, MapPin } from 'lucide-react';
import { RadicarPQRS } from './pages/RadicarPQRS';
import { TramitesPQRS } from './pages/TramitesPQRS';
import { supabase } from './supabaseClient';
import { cargarEmpleadoAutenticado } from './lib/session';
import { puedeVerTrazabilidad } from './lib/roles';
import { Trazabilidad } from './pages/Trazabilidad';
import { Login } from './pages/Login';

// Importamos las pantallas
import { Dashboard } from './pages/Dashboard';
import { UsuariosPredios } from './pages/UsuariosPredios';
import { PerfilUsuario } from './pages/PerfilUsuario';
import { NuevoUsuario } from './pages/NuevoUsuario';
import { Configuracion } from './pages/Configuracion';
import { NotificationsDropdown } from './components/layout/NotificationsDropdown';
import { GlobalSearch } from './components/layout/GlobalSearch';

const NavItem = ({ path, to, icon: Icon, text, isActive, onClick }) => {
  const targetPath = path || to;
  return (
    <Link
      to={targetPath}
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 mt-2 rounded-lg transition-colors ${
        isActive ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      <span className="font-medium">{text}</span>
    </Link>
  );
};

function AppLayout({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation(); // Esto lee en qué URL estamos (ej: /usuarios)

  const getTitle = () => {
    switch (location.pathname) {
      case '/': return 'Panel de Control';
      case '/usuarios': return 'Gestión de Usuarios';
      case '/pqrs': return 'Radicados PQRS';
      case '/trazabilidad': return 'Trazabilidad';
      default: return 'EcoSanGil V2';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {sidebarOpen && <div className="fixed inset-0 bg-gray-800/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Menú Lateral */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mr-3"><span className="font-bold text-white text-xl">E</span></div>
            <span className="text-xl font-bold tracking-wide">EcoSanGil<span className="text-emerald-500">V2</span></span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {/* Ahora usamos rutas reales como "/" o "/usuarios" */}
          <NavItem path="/" icon={Home} text="Dashboard" isActive={location.pathname === '/'} onClick={() => setSidebarOpen(false)} />
          <NavItem path="/usuarios" icon={Users} text="Usuarios y Predios" isActive={location.pathname === '/usuarios'} onClick={() => setSidebarOpen(false)} />
          <NavItem path="/pqrs" icon={FileText} text="Radicados PQRS" isActive={location.pathname === '/pqrs'} onClick={() => setSidebarOpen(false)} />
          {puedeVerTrazabilidad(user) && <NavItem path="/trazabilidad" icon={MapPin} text="Trazabilidad" isActive={location.pathname === '/trazabilidad'} onClick={() => setSidebarOpen(false)} />}
        </nav>

        <div className="p-4 border-t border-slate-800">
            <NavItem to="/configuracion" icon={Settings} text="Configuración" isActive={location.pathname === '/configuracion'} onClick={() => setSidebarOpen(false)} />

            {/* AÑADIDO: Muestra los datos reales del usuario logueado */}
            <div className="mt-4 flex items-center justify-between px-4">
              <div className="flex items-center min-w-0">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shrink-0">
                  {(user.nombres || 'Usuario').substring(0, 2).toUpperCase()}
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-medium text-white truncate" title={user.nombres}>{user.nombres}</p>
                  <p className="text-xs text-emerald-400 font-bold truncate">{user.rol}</p>
                </div>
              </div>
            </div>

            {/* AÑADIDO: Botón de Cerrar Sesión */}
            <button
              onClick={onLogout}
              className="mt-4 w-full py-2 text-xs font-bold text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:bg-slate-800 transition-colors"
            >
              CERRAR SESIÓN
            </button>
          </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(true)} className="p-2 mr-3 text-gray-600 rounded-md lg:hidden hover:bg-gray-100"><Menu className="w-6 h-6" /></button>
            <h1 className="text-2xl font-bold text-gray-800 hidden sm:block">
              {getTitle()}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <GlobalSearch key={location.pathname} location={location} />
            <NotificationsDropdown />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          {/* Aquí ocurre la magia: React Router decide qué componente mostrar según la URL */}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/usuarios" element={<UsuariosPredios />} />
            <Route path="/usuarios/nuevo" element={<NuevoUsuario />} />
            <Route path="/usuarios/:id" element={<PerfilUsuario />} />
            <Route path="/configuracion" element={<Configuracion user={user} />} />

            {/* AÑADIDO: Rutas para PQRS */}
            <Route path="/pqrs/nuevo" element={<RadicarPQRS />} />

            {/* AÑADIDO: Tablero Kanban Oficial */}
            <Route path="/pqrs" element={<TramitesPQRS />} />



            <Route path="/trazabilidad" element={<Trazabilidad user={user} />} />
            <Route path="*" element={<div>Página no encontrada. <Link to="/" className="text-emerald-700 underline">Volver al inicio</Link></div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorSesion, setErrorSesion] = useState('');

  useEffect(() => {
    let active = true;
    let revision = 0;
    const actualizar = async () => {
      const current = ++revision;
      try {
        const empleado = await cargarEmpleadoAutenticado();
        if (active && current === revision) { setUser(empleado); setErrorSesion(''); }
      } catch (error) { if (active && current === revision) { setUser(null); setErrorSesion(error.message); } }
      finally { if (active && current === revision) setLoading(false); }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') { revision++; setUser(null); localStorage.removeItem('ecoUser'); }
      else setTimeout(() => { if (active) actualizar(); }, 0);
    });
    actualizar();
    window.addEventListener('eco-user-updated', actualizar);
    window.addEventListener('focus', actualizar);
    return () => { active = false; subscription.unsubscribe(); window.removeEventListener('eco-user-updated', actualizar); window.removeEventListener('focus', actualizar); };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('ecoUser');
  };
  if (loading) return <p role="status" className="p-8">Validando sesión…</p>;
  if (errorSesion && !user) return <div className="p-8"><p role="alert">{errorSesion}</p><button className="mt-4 underline" onClick={async () => { await handleLogout(); setErrorSesion(''); }}>Volver al inicio de sesión</button></div>;

  // AÑADIDO: Si NO hay usuario, mostramos el Login. No lo dejamos pasar al CRM.
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // AÑADIDO: Si SI hay usuario, le pasamos los datos a la estructura del CRM
  return (
    <Router>
      <AppLayout user={user} onLogout={handleLogout} />
    </Router>
  );
}
