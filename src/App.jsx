import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Users, FileText, Settings, Bell, Menu, X, MapPin, Search } from 'lucide-react';

// Importamos las pantallas
import { Dashboard } from './pages/Dashboard';
import { UsuariosPredios } from './pages/UsuariosPredios';
import { PerfilUsuario } from './pages/PerfilUsuario';
import { NuevoUsuario } from './pages/NuevoUsuario'; // <-- 1. AÑADE ESTA IMPORTACIÓN
import { Configuracion } from './pages/Configuracion'; // <-- NUEVO: IMPORTAR LA CONFIGURACIÓN

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation(); // Esto lee en qué URL estamos (ej: /usuarios)

  const NavItem = ({ path, icon: Icon, text }) => {
    const isActive = location.pathname === path;
    return (
      // Cambiamos <button> por <Link> para que cambie la URL del navegador
      <Link 
        to={path}
        onClick={() => setSidebarOpen(false)}
        className={`w-full flex items-center px-4 py-3 mt-2 rounded-lg transition-colors ${
          isActive ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Icon className="w-5 h-5 mr-3" />
        <span className="font-medium">{text}</span>
      </Link>
    );
  };

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
          <NavItem path="/" icon={Home} text="Dashboard" />
          <NavItem path="/usuarios" icon={Users} text="Usuarios y Predios" />
          <NavItem path="/pqrs" icon={FileText} text="Radicados PQRS" />
          <NavItem path="/trazabilidad" icon={MapPin} text="Trazabilidad" />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link 
            to="/configuracion"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
              location.pathname === '/configuracion' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5 mr-3" />
            <span className="font-medium">Configuración</span>
          </Link>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(true)} className="p-2 mr-3 text-gray-600 rounded-md lg:hidden hover:bg-gray-100"><Menu className="w-6 h-6" /></button>
            <h1 className="text-2xl font-bold text-gray-800 hidden sm:block">
              {getTitle()}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
             <div className="relative hidden md:block">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2" />
              <input type="text" placeholder="Buscar cédula o radicado..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-64 bg-gray-50" />
            </div>
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          {/* Aquí ocurre la magia: React Router decide qué componente mostrar según la URL */}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/usuarios" element={<UsuariosPredios />} />
            <Route path="/usuarios/nuevo" element={<NuevoUsuario />} /> {/* <-- 2. AÑADE ESTA RUTA ANTES DE LA DEL PERFIL */}
            <Route path="/usuarios/:id" element={<PerfilUsuario />} /> 
            
            <Route path="/configuracion" element={<Configuracion />} /> {/* <-- NUEVO: RUTA DE CONFIGURACIÓN */}

            {/* Pantallas en construcción */}
            <Route path="/pqrs" element={
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><FileText className="w-8 h-8 text-gray-300" /></div>
                <h3 className="text-lg font-medium text-gray-600">Módulo en Construcción</h3>
                <p className="text-sm">Esta pantalla estará disponible muy pronto.</p>
              </div>
            } />
            <Route path="/trazabilidad" element={
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><MapPin className="w-8 h-8 text-gray-300" /></div>
                <h3 className="text-lg font-medium text-gray-600">Módulo en Construcción</h3>
                <p className="text-sm">Esta pantalla estará disponible muy pronto.</p>
              </div>
            } />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}