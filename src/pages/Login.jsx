import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Lock, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

export const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Buscamos el correo en la tabla de empleados (ahora ignora mayúsculas/minúsculas)
      const { data, error: dbError } = await supabase
        .from('empleados')
        .select('*')
        .ilike('email', email.trim())
        .single();

      if (dbError || !data) {
        throw new Error('Usuario no encontrado en el sistema.');
      }

      // 2. Verificamos si la cuenta está activa (Soft Delete)
      if (data.estado !== 'Activo') {
        throw new Error('Esta cuenta ha sido desactivada. Contacta al administrador.');
      }

      // 3. Login Exitoso (Guardamos en la memoria del navegador)
      // Nota: En esta fase MVP validamos por email. Luego conectaremos el Auth real de Supabase.
      localStorage.setItem('ecoUser', JSON.stringify(data));
      onLogin(data); // Le avisamos a React que ya puede mostrar el CRM

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      {/* Círculos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-1/3 h-1/3 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-500">
        
        {/* Cabecera del Login */}
        <div className="bg-emerald-600 px-8 py-10 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg rotate-3">
            <span className="text-3xl font-bold text-emerald-600 -rotate-3">E</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">EcoSanGil<span className="text-emerald-200">V2</span></h1>
          <p className="text-emerald-100 text-sm mt-2">Plataforma Integral de Gestión y PQRS</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2 text-emerald-500" /> Iniciar Sesión
          </h2>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start border border-red-100">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo Corporativo</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-gray-50 focus:bg-white transition-colors"
                  placeholder="ej. admin@ecosangil.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña de Acceso</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-gray-50 focus:bg-white transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !email}
            className="w-full mt-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {loading ? 'Verificando...' : 'Acceder al CRM'}
          </button>
        </form>
      </div>
      
      <p className="mt-8 text-sm text-gray-400 relative z-10">
        © {new Date().getFullYear()} EcoSanGil V2. Acceso restringido.
      </p>
    </div>
  );
};