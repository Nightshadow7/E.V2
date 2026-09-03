import { useState, useEffect, useCallback } from 'react';
import { 
  Shield, User, Sliders, Mail, Save, Plus, 
  Trash2, Edit, X, CheckCircle, AlertTriangle, Loader2 
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export const Configuracion = () => {
  // --- 1. USUARIO ACTUAL (EXTRAÍDO DE LA MEMORIA DEL LOGIN) ---
  const [currentUser] = useState(() => {
    const saved = localStorage.getItem('ecoUser');
    return saved ? JSON.parse(saved) : { rol: 'Invitado' };
  });

  // --- 2. ESTADOS GENERALES ---
  const [activeTab, setActiveTab] = useState('perfil');
  const [mensajePerfil, setMensajePerfil] = useState('');
  const [isSavingPerfil, setIsSavingPerfil] = useState(false);

  // --- 3. ESTADO DE LOS EMPLEADOS ---
  const [empleados, setEmpleados] = useState([]);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);

  // --- 4. ESTADOS PARA LAS VENTANAS MODALES ---
  const [showModalEmpleado, setShowModalEmpleado] = useState(false);
  const [showModalDesactivar, setShowModalDesactivar] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [formData, setFormData] = useState({ nombres: '', email: '', rol: 'Comercial' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 5. LÓGICA DE CARGA (Corregida con useCallback para evitar errores de React) ---
  const cargarEmpleados = useCallback(async () => {
    setLoadingEmpleados(true);
    
    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .order('nombres', { ascending: true });
    
    if (!error && data) {
      setEmpleados(data);
    }
    setLoadingEmpleados(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'equipo') {
      const fetchData = async () => {
        await cargarEmpleados();
      };
      fetchData();
    }
  }, [activeTab, cargarEmpleados]);

  // --- 6. FUNCIONES DE INTERACCIÓN ---
  const handleGuardarPerfil = () => {
    setIsSavingPerfil(true);
    setTimeout(() => {
      setIsSavingPerfil(false);
      setMensajePerfil('¡Perfil actualizado con éxito!');
      setTimeout(() => setMensajePerfil(''), 3000);
    }, 1000);
  };

  const abrirModalNuevo = () => {
    setFormData({ nombres: '', email: '', rol: 'Comercial' });
    setEmpleadoSeleccionado(null);
    setShowModalEmpleado(true);
  };

  const abrirModalEditar = (empleado) => {
    setFormData({ nombres: empleado.nombres, email: empleado.email, rol: empleado.rol });
    setEmpleadoSeleccionado(empleado);
    setShowModalEmpleado(true);
  };

  const abrirModalDesactivar = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setShowModalDesactivar(true);
  };

  const guardarEmpleado = async (e) => {
    e.preventDefault();
    if (currentUser.rol !== 'Administrador') {
      alert("Acceso denegado. Solo los administradores pueden modificar el equipo.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (empleadoSeleccionado) {
        let rolA_Guardar = formData.rol;
        if (empleadoSeleccionado.rol === 'Administrador') {
            rolA_Guardar = 'Administrador';
        }
        await supabase.from('empleados').update({
          nombres: formData.nombres,
          email: formData.email,
          rol: rolA_Guardar
        }).eq('id_empleado', empleadoSeleccionado.id_empleado);
      } else {
        await supabase.from('empleados').insert({
          nombres: formData.nombres,
          email: formData.email,
          rol: formData.rol,
          estado: 'Activo'
        });
      }
      await cargarEmpleados();
      setShowModalEmpleado(false);
    } catch (error) {
      console.error("Error al guardar empleado:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmarDesactivacion = async () => {
    if (currentUser.rol !== 'Administrador' || empleadoSeleccionado?.rol === 'Administrador') {
        return;
    }

    setIsSubmitting(true);
    try {
      const nuevoEstado = empleadoSeleccionado.estado === 'Activo' ? 'Inactivo' : 'Activo';
      await supabase.from('empleados').update({ estado: nuevoEstado }).eq('id_empleado', empleadoSeleccionado.id_empleado);
      await cargarEmpleados();
      setShowModalDesactivar(false);
    } catch(error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-10 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Configuración del Sistema</h2>
        <p className="text-sm text-gray-500 mt-1">Gestiona tu cuenta, el equipo de trabajo y los permisos de la plataforma.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1">
        
        {/* MENÚ LATERAL */}
        <div className="w-full md:w-64 flex flex-col space-y-1">
          <button 
            onClick={() => setActiveTab('perfil')}
            className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'perfil' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <User className="w-5 h-5 mr-3" /> Mi Perfil
          </button>
          
          {currentUser.rol === 'Administrador' && (
            <button 
              onClick={() => setActiveTab('equipo')}
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'equipo' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Shield className="w-5 h-5 mr-3" /> Equipo y Roles
            </button>
          )}

          <button 
            onClick={() => setActiveTab('sistema')}
            className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'sistema' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Sliders className="w-5 h-5 mr-3" /> Variables del Sistema
          </button>
        </div>

        {/* ÁREA DE CONTENIDO */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative">
          
          {/* PESTAÑA: PERFIL */}
          {activeTab === 'perfil' && (
            <div className="p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">Información de mi Cuenta</h3>
              
              {mensajePerfil && (
                <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-lg flex items-center font-medium border border-emerald-200">
                  <CheckCircle className="w-5 h-5 mr-2" /> {mensajePerfil}
                </div>
              )}

              <div className="max-w-xl space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                    <input type="text" defaultValue={currentUser.nombres} disabled className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 cursor-not-allowed text-gray-600" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico (No modificable)</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                    <input type="email" defaultValue={currentUser.email} disabled className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-500 cursor-not-allowed" />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button onClick={handleGuardarPerfil} disabled={isSavingPerfil} className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center shadow-sm disabled:opacity-70">
                    {isSavingPerfil ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {isSavingPerfil ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA: EQUIPO */}
          {activeTab === 'equipo' && (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Gestión de Usuarios del Sistema</h3>
                  <p className="text-sm text-gray-500">Crea cuentas y asigna roles. (Soft Delete activado para trazabilidad).</p>
                </div>
                <button onClick={abrirModalNuevo} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
                  <Plus className="w-4 h-4 mr-2" /> Nuevo Empleado
                </button>
              </div>
              
              <div className="flex-1 overflow-auto p-0">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                      <th className="px-6 py-4 font-medium">Nombre y Correo</th>
                      <th className="px-6 py-4 font-medium">Rol de Acceso</th>
                      <th className="px-6 py-4 font-medium text-center">Estado</th>
                      <th className="px-6 py-4 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loadingEmpleados ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                          <Loader2 className="w-6 h-6 mx-auto animate-spin text-emerald-500 mb-2" />
                          Cargando equipo desde la base de datos...
                        </td>
                      </tr>
                    ) : empleados.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                          No hay empleados registrados.
                        </td>
                      </tr>
                    ) : (
                      empleados.map((emp) => (
                        <tr key={emp.id_empleado} className={`hover:bg-gray-50 transition-colors ${emp.estado === 'Inactivo' ? 'opacity-60 bg-gray-50/50' : ''}`}>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-gray-900">{emp.nombres}</p>
                            <p className="text-xs text-gray-500">{emp.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                              {emp.rol}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${emp.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                              {emp.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => abrirModalEditar(emp)} className="text-gray-400 hover:text-emerald-600 p-1.5 rounded-md hover:bg-emerald-50 transition-colors mr-2" title="Editar datos">
                              <Edit className="w-4 h-4" />
                            </button>
                            
                            {emp.rol !== 'Administrador' ? (
                              <button onClick={() => abrirModalDesactivar(emp)} className={`p-1.5 rounded-md transition-colors ${emp.estado === 'Activo' ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={emp.estado === 'Activo' ? 'Desactivar acceso' : 'Reactivar acceso'}>
                                {emp.estado === 'Activo' ? <Trash2 className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                              </button>
                            ) : (
                              <button disabled className="p-1.5 rounded-md text-gray-200 cursor-not-allowed" title="Los administradores no pueden ser desactivados">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      )))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PESTAÑA: SISTEMA */}
          {activeTab === 'sistema' && (
            <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400">
              <Sliders className="w-16 h-16 mb-4 text-gray-300" />
              <h3 className="text-lg font-bold text-gray-700">Módulo en Desarrollo</h3>
              <p className="text-sm text-gray-500 max-w-sm text-center mt-2">
                Aquí configuraremos las plantillas de PDF, firmas y variables globales para las PQRS.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* MODAL: Crear/Editar Empleado */}
      {showModalEmpleado && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">
                {empleadoSeleccionado ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h3>
              <button onClick={() => setShowModalEmpleado(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={guardarEmpleado} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input required type="text" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico (Para Login)</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol de Sistema</label>
                <select 
                  value={formData.rol} 
                  onChange={e => setFormData({...formData, rol: e.target.value})} 
                  disabled={empleadoSeleccionado?.rol === 'Administrador'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  <option value="Comercial">Comercial (Solo lee y edita prospectos)</option>
                  <option value="Lider">Líder Comercial (Asigna tareas)</option>
                  <option value="Secretario">Secretario (Maneja PQRS y Documentos)</option>
                  <option value="Administrador">Administrador (Control Total)</option>
                </select>
                {empleadoSeleccionado?.rol === 'Administrador' && (
                  <p className="text-xs text-amber-600 mt-1 font-medium">Protección de sistema: No puedes cambiar el rol de un Administrador.</p>
                )}
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setShowModalEmpleado(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-emerald-600 rounded-md text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-70 flex items-center">
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
                  Guardar Datos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirmar Desactivación (Soft Delete) */}
      {showModalDesactivar && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${empleadoSeleccionado?.estado === 'Activo' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {empleadoSeleccionado?.estado === 'Activo' ? '¿Desactivar Acceso?' : '¿Reactivar Acceso?'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {empleadoSeleccionado?.estado === 'Activo' 
                ? 'El usuario no será eliminado de la base de datos por temas de trazabilidad y auditoría, pero no podrá iniciar sesión en la plataforma.'
                : 'El usuario recuperará el acceso al sistema con su rol actual.'}
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowModalDesactivar(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={confirmarDesactivacion} disabled={isSubmitting} className={`px-4 py-2 rounded-md text-sm font-medium text-white shadow-sm flex items-center disabled:opacity-70 ${empleadoSeleccionado?.estado === 'Activo' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
                {empleadoSeleccionado?.estado === 'Activo' ? 'Sí, Desactivar' : 'Sí, Reactivar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};