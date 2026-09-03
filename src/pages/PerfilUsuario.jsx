import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  ArrowLeft, User, MapPin, Phone, Mail, 
  FileText, Activity, Building, CreditCard, 
  CheckCircle, AlertTriangle, Edit, Save, X, Loader2
} from 'lucide-react';

export const PerfilUsuario = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({});

  // --- NUEVO: ESTADOS PARA EL BUSCADOR DE BARRIOS ---
  const [barriosDB, setBarriosDB] = useState([]);
  const [bloquesUnicos, setBloquesUnicos] = useState([]);
  const [cargandoLugares, setCargandoLugares] = useState(true);
  const [showBarriosList, setShowBarriosList] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar menú de barrios al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowBarriosList(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cargar lista de barrios y bloques al vuelo
  useEffect(() => {
    async function cargarLugares() {
      const { data, error } = await supabase.from('vista_barrios').select('*');
      if (!error && data) {
        setBarriosDB(data);
        
        // Sacar y ordenar bloques inteligentemente
        let bloques = [...new Set(data.map(b => b.bloque).filter(Boolean))];
        bloques.sort((a, b) => {
          const numA = parseInt(a, 10);
          const numB = parseInt(b, 10);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          if (!isNaN(numA) && isNaN(numB)) return -1;
          if (isNaN(numA) && !isNaN(numB)) return 1;
          return a.localeCompare(b);
        });
        setBloquesUnicos(bloques);
      }
      setCargandoLugares(false);
    }
    cargarLugares();
  }, []);
  // -------------------------------------------------

  useEffect(() => {
    async function cargarPerfil() {
      setLoading(true);
      const { data, error } = await supabase
        .from('vinculos_servicio')
        .select('*, personas (*), predios (*)')
        .eq('id_vinculo', id)
        .single();

      if (!error && data) setPerfil(data);
      else console.error("Error al cargar perfil:", error);
      
      setLoading(false);
    }
    cargarPerfil();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-gray-400">
        <Activity className="w-10 h-10 animate-spin mb-4 text-emerald-500" />
        <p className="font-medium text-gray-500">Abriendo expediente digital...</p>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-gray-400">
        <AlertTriangle className="w-12 h-12 mb-4 text-amber-500" />
        <h3 className="text-xl font-bold text-gray-700">Expediente no encontrado</h3>
        <button onClick={() => navigate('/usuarios')} className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-lg">
          Volver al directorio
        </button>
      </div>
    );
  }

  // AHORA CARGAMOS TODOS LOS CAMPOS EN EL EDITOR
  const iniciarEdicion = () => {
    setFormData({
      // Datos Persona
      tipo_documento: perfil.personas?.tipo_documento || 'CC',
      numero_documento: perfil.personas?.numero_documento || '',
      nombres_razon_social: perfil.personas?.nombres_razon_social || '',
      celular: perfil.personas?.celular || '',
      email: perfil.personas?.email || '',
      
      // Datos Predio
      direccion_fisica: perfil.predios?.direccion_fisica || '',
      barrio: perfil.predios?.barrio || '',
      bloque: perfil.predios?.bloque || '',
      codigo_acuasan: perfil.predios?.codigo_acuasan || '',
      codigo_essa: perfil.predios?.codigo_essa || '',
      
      // Datos Administrativos
      calidad_vinculacion: perfil.calidad_vinculacion || 'Propietario',
      estrato: perfil.predios?.estrato || '',
      uso_aseo: perfil.predios?.uso_aseo || 'Residencial'
    });
    setIsEditing(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const guardarCambios = async () => {
    setIsSaving(true);
    try {
      // 1. Actualizar Persona completa
      await supabase.from('personas').update({
        tipo_documento: formData.tipo_documento,
        numero_documento: formData.numero_documento,
        nombres_razon_social: formData.nombres_razon_social,
        celular: formData.celular,
        email: formData.email
      }).eq('id_persona', perfil.id_persona);

      // 2. Actualizar Predio completo
      await supabase.from('predios').update({
        direccion_fisica: formData.direccion_fisica,
        barrio: formData.barrio,
        bloque: formData.bloque,
        codigo_acuasan: formData.codigo_acuasan || null,
        codigo_essa: formData.codigo_essa || null,
        estrato: formData.estrato ? parseInt(formData.estrato) : null,
        uso_aseo: formData.uso_aseo
      }).eq('id_predio', perfil.id_predio);

      // 3. Actualizar Vínculo
      await supabase.from('vinculos_servicio').update({
        calidad_vinculacion: formData.calidad_vinculacion
      }).eq('id_vinculo', id);

      // Recargar la pantalla con los nuevos datos
      const { data } = await supabase.from('vinculos_servicio').select('*, personas(*), predios(*)').eq('id_vinculo', id).single();
      setPerfil(data);
      setIsEditing(false);
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al guardar. Revisa que la cédula o códigos no estén repetidos en otro usuario.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate('/usuarios')} className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al directorio
        </button>
        <button onClick={iniciarEdicion} className="flex items-center text-sm font-medium bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-200 shadow-sm">
          <Edit className="w-4 h-4 mr-2" /> Editar Todo (Modo Dios)
        </button>
      </div>

      {/* Tarjeta Principal */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="h-28 bg-gradient-to-r from-slate-800 to-slate-700"></div>
        <div className="px-8 pb-8 relative">
          <div className="absolute -top-12 w-24 h-24 bg-white rounded-full p-2 shadow-md">
            <div className="w-full h-full bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <User className="w-10 h-10" />
            </div>
          </div>
          
          <div className="pt-14 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 uppercase">
                {perfil.personas?.nombres_razon_social || 'Sin Nombre Registrado'}
              </h1>
              <div className="flex flex-wrap items-center mt-2 gap-4 text-sm text-gray-600 font-medium">
                <span className="flex items-center bg-gray-100 px-3 py-1 rounded-md">
                  <CreditCard className="w-4 h-4 mr-2 text-gray-400"/> 
                  {perfil.personas?.tipo_documento}: {perfil.personas?.numero_documento}
                </span>
                <span className="flex items-center bg-gray-100 px-3 py-1 rounded-md">
                  <User className="w-4 h-4 mr-2 text-gray-400"/> 
                  Calidad: {perfil.calidad_vinculacion}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-2">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold border flex items-center shadow-sm ${perfil.estado_servicio === 'Activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                <CheckCircle className="w-4 h-4 mr-2" /> Servicio {perfil.estado_servicio}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Datos Duros */}
        <div className="lg:col-span-1 space-y-8">
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5 flex items-center">
              <Phone className="w-4 h-4 mr-2 text-blue-500" /> Datos de Contacto
            </h3>
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Teléfono Principal</p>
                <p className="text-base font-medium text-gray-900">{perfil.personas?.celular || 'No registrado'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Correo Electrónico</p>
                <p className="text-base font-medium text-gray-900 break-all">{perfil.personas?.email || 'No registrado'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5 flex items-center">
              <Building className="w-4 h-4 mr-2 text-purple-500" /> Detalles del Inmueble
            </h3>
            <div className="space-y-5">
              <div className="flex items-start bg-slate-50 p-3 rounded-lg border border-slate-100">
                <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900">{perfil.predios?.direccion_fisica}</p>
                  <p className="text-xs font-medium text-gray-500 mt-1">{perfil.predios?.barrio} • {perfil.predios?.bloque}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Código ESSA</p>
                  <p className="text-sm font-bold text-emerald-900 font-mono">{perfil.predios?.codigo_essa || 'N/A'}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Código ACUASAN</p>
                  <p className="text-sm font-bold text-blue-900 font-mono">{perfil.predios?.codigo_acuasan || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Estrato</p>
                  <p className="text-sm font-medium text-gray-900">{perfil.predios?.estrato ? `Estrato ${perfil.predios.estrato}` : 'Sin definir'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Tipo de Uso</p>
                  <p className="text-sm font-medium text-gray-900">{perfil.predios?.uso_aseo || 'Residencial'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Historial */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-slate-500" />
                  Historial de Trámites y PQRS
                </h3>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                <FileText className="w-10 h-10 text-gray-300" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Módulo en Preparación</h4>
              <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                Aquí vivirán los radicados de desvinculación y peticiones en la siguiente fase.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE EDICIÓN (MODO DIOS: TODOS LOS CAMPOS) */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <Edit className="w-5 h-5 mr-2 text-emerald-600" /> Editar Expediente Completo
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              
              {/* SECCIÓN 1: PERSONA */}
              <h4 className="text-sm font-bold text-emerald-700 mb-4 border-b pb-2">1. Datos Personales</h4>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo Doc.</label>
                  <select name="tipo_documento" value={formData.tipo_documento} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="CC">Cédula</option>
                    <option value="NIT">NIT</option>
                    <option value="CE">Cédula Ext.</option>
                    <option value="PPT">PPT</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Documento</label>
                  <input type="text" name="numero_documento" value={formData.numero_documento} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="md:col-span-5">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombres / Empresa</label>
                  <input type="text" name="nombres_razon_social" value={formData.nombres_razon_social} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Celular</label>
                  <input type="text" name="celular" value={formData.celular} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Electrónico</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>

              {/* SECCIÓN 2: PREDIO */}
              <h4 className="text-sm font-bold text-blue-700 mb-4 border-b pb-2">2. Ubicación del Inmueble</h4>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
                <div className="md:col-span-12">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección Física</label>
                  <input type="text" name="direccion_fisica" value={formData.direccion_fisica} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                
                {/* COMBOBOX INTELIGENTE PARA BARRIO */}
                <div className="md:col-span-6" ref={dropdownRef}>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                    Barrio {cargandoLugares && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      name="barrio" 
                      value={formData.barrio} 
                      onChange={(e) => {
                        handleChange(e);
                        setShowBarriosList(true);
                      }} 
                      onFocus={() => setShowBarriosList(true)}
                      autoComplete="off"
                      disabled={cargandoLugares}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                    />
                    
                    {showBarriosList && (
                      <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-48 overflow-y-auto">
                        {barriosDB.filter(b => b.barrio.toLowerCase().includes((formData.barrio || '').toLowerCase())).length > 0 ? (
                          barriosDB
                            .filter(b => b.barrio.toLowerCase().includes((formData.barrio || '').toLowerCase()))
                            .map((item, idx) => (
                              <div 
                                key={idx}
                                onClick={() => {
                                  // Al seleccionar, se actualiza el barrio Y el bloque automáticamente
                                  setFormData({ ...formData, barrio: item.barrio, bloque: item.bloque });
                                  setShowBarriosList(false); 
                                }}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-50 text-sm flex justify-between items-center transition-colors"
                              >
                                <span className="font-medium text-gray-800">{item.barrio}</span>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{item.bloque}</span>
                              </div>
                          ))
                        ) : (
                          <div className="p-3 text-xs text-center bg-amber-50 text-amber-800 rounded-b-lg">
                            <span className="font-bold block">Barrio no encontrado</span>
                            Se guardará como uno nuevo.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bloque</label>
                  <select name="bloque" value={formData.bloque} onChange={handleChange} disabled={cargandoLugares} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="">Selecciona...</option>
                    {bloquesUnicos.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="Bloque Por Definir">Otro / Por Definir</option>
                  </select>
                </div>

                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código ACUASAN</label>
                  <input type="text" name="codigo_acuasan" value={formData.codigo_acuasan} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50 font-mono" />
                </div>
                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código ESSA</label>
                  <input type="text" name="codigo_essa" value={formData.codigo_essa} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-emerald-50 font-mono" />
                </div>
              </div>

              {/* SECCIÓN 3: ADMINISTRATIVO */}
              <h4 className="text-sm font-bold text-purple-700 mb-4 border-b pb-2">3. Datos Administrativos</h4>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Calidad Vinculación</label>
                  <select name="calidad_vinculacion" value={formData.calidad_vinculacion} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 outline-none">
                    <option value="Propietario">Propietario</option>
                    <option value="Residente">Residente / Inquilino</option>
                    <option value="Poseedor">Poseedor</option>
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Uso</label>
                  <select name="uso_aseo" value={formData.uso_aseo} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 outline-none">
                    <option value="Residencial">Residencial</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Oficial">Oficial / Institucional</option>
                    <option value="Lote">Lote / Predio Vacío</option>
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estrato</label>
                  <select name="estrato" value={formData.estrato} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 outline-none">
                    <option value="">Sin Estrato</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                  </select>
                </div>
              </div>

            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50 rounded-b-xl">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 mr-3 transition-colors">
                Cancelar
              </button>
              <button disabled={isSaving} onClick={guardarCambios} className="px-5 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 flex items-center shadow-sm disabled:opacity-70 transition-colors">
                {isSaving ? <Activity className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};