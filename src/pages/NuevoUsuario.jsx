import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  ArrowLeft, Save, User, MapPin, Building, 
  CreditCard, Phone, Mail, Loader2
} from 'lucide-react';

export const NuevoUsuario = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Estados para guardar tu lista real de Supabase
  const [barriosDB, setBarriosDB] = useState([]);
  const [bloquesUnicos, setBloquesUnicos] = useState([]);
  const [cargandoLugares, setCargandoLugares] = useState(true);

  const [formData, setFormData] = useState({
    tipo_documento: 'CC',
    numero_documento: '',
    nombres_razon_social: '',
    celular: '',
    email: '',
    calidad_vinculacion: 'Propietario', 
    codigo_acuasan: '',
    codigo_essa: '',
    direccion_fisica: '',
    estrato: '',
    uso_aseo: 'Residencial',
    barrio: '',
    bloque: ''
  });

  // Efecto que se dispara al abrir la pantalla para descargar tus bloques reales
  useEffect(() => {
    async function cargarLugares() {
      const { data, error } = await supabase
        .from('vista_barrios') // Llama a la vista que acabamos de crear en SQL
        .select('*');

      if (!error && data) {
        setBarriosDB(data);
        // Filtramos para sacar solo los nombres de los 13 bloques, pinchote, veredas, etc.
        const bloques = [...new Set(data.map(b => b.bloque).filter(Boolean))];
        setBloquesUnicos(bloques);
      }
      setCargandoLugares(false);
    }
    cargarLugares();
  }, []);

  // Si escribes un barrio que ya existe en tu DB, autocompleta el bloque
  const handleBarrioChange = (e) => {
    const valorBarrio = e.target.value;
    let nuevoBloque = formData.bloque;

    const barrioEncontrado = barriosDB.find(
      b => b.barrio.toLowerCase() === valorBarrio.toLowerCase()
    );

    if (barrioEncontrado && barrioEncontrado.bloque) {
      nuevoBloque = barrioEncontrado.bloque;
    }

    setFormData({ ...formData, barrio: valorBarrio, bloque: nuevoBloque });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // BARRERA: Obliga a tener al menos Acuasan o ESSA
    if (!formData.codigo_acuasan.trim() && !formData.codigo_essa.trim()) {
      setMensaje({ 
        tipo: 'error', 
        texto: '⚠️ Operación cancelada: Debes ingresar al menos el Código ACUASAN o el Código ESSA.' 
      });
      return; 
    }

    setIsSubmitting(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      // 1. Guardar a la Persona
      const { data: personaData, error: errorPersona } = await supabase
        .from('personas')
        .upsert({
          tipo_documento: formData.tipo_documento,
          numero_documento: formData.numero_documento,
          nombres_razon_social: formData.nombres_razon_social,
          celular: formData.celular,
          email: formData.email
        }, { onConflict: 'numero_documento' })
        .select()
        .single();

      if (errorPersona) throw errorPersona;

      // 2. Guardar el Predio 
      const { data: predioData, error: errorPredio } = await supabase
        .from('predios')
        .insert({
          codigo_acuasan: formData.codigo_acuasan || null,
          codigo_essa: formData.codigo_essa || null,
          direccion_fisica: formData.direccion_fisica,
          barrio: formData.barrio,
          bloque: formData.bloque || 'Bloque Por Definir',
          estrato: formData.estrato ? parseInt(formData.estrato) : null,
          uso_aseo: formData.uso_aseo || null,
          municipio: 'San Gil'
        })
        .select()
        .single();

      if (errorPredio) throw errorPredio;

      // 3. Crear el Vínculo
      const { error: errorVinculo } = await supabase
        .from('vinculos_servicio')
        .insert({
          id_persona: personaData.id_persona,
          id_predio: predioData.id_predio,
          calidad_vinculacion: formData.calidad_vinculacion,
          estado_servicio: 'Activo',
          perfil_comercial: 'Potencial'
        });

      if (errorVinculo) throw errorVinculo;

      setMensaje({ tipo: 'exito', texto: '¡Usuario y Predio registrados correctamente!' });
      setTimeout(() => { navigate('/usuarios'); }, 2000);

    } catch (error) {
      console.error("Error al guardar:", error);
      setMensaje({ tipo: 'error', texto: 'Ocurrió un error al guardar los datos. Revisa la consola.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <button 
        onClick={() => navigate('/usuarios')}
        className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Volver al directorio
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Registrar Nuevo Expediente</h2>
            <p className="text-sm text-gray-500 mt-1">Completa los datos de la persona y las características del inmueble.</p>
          </div>
        </div>

        {mensaje.texto && (
          <div className={`p-4 ${mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'} border-b font-medium text-center`}>
            {mensaje.texto}
          </div>
        )}

        {}
        <form onSubmit={handleSubmit} className="p-8">
          
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center border-b pb-2">
            <User className="w-4 h-4 mr-2 text-emerald-600" /> 1. Datos de la Persona (Cliente)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Doc.</label>
              <select name="tipo_documento" value={formData.tipo_documento} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-white">
                <option value="CC">Cédula (CC)</option>
                <option value="NIT">NIT Empresa</option>
                <option value="CE">Cédula Extranjería (CE)</option>
                <option value="PPT">Permiso (PPT)</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </div>

            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Número Documento *</label>
              <div className="relative">
                <CreditCard className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input required type="text" name="numero_documento" value={formData.numero_documento} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" placeholder="Ej. 1098..." />
              </div>
            </div>

            <div className="md:col-span-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombres / Razón Social *</label>
              <input required type="text" name="nombres_razon_social" value={formData.nombres_razon_social} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" placeholder="Ej. Juan Pérez" />
            </div>

            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Celular</label>
              <div className="relative">
                <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input type="text" name="celular" value={formData.celular} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" placeholder="Ej. 310..." />
              </div>
            </div>

            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" placeholder="correo@ejemplo.com" />
              </div>
            </div>

            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Relación con el Predio</label>
              <select name="calidad_vinculacion" value={formData.calidad_vinculacion} onChange={handleChange} className="w-full px-4 py-2.5 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-emerald-50 text-emerald-900 font-medium">
                <option value="Propietario">Es el Propietario</option>
                <option value="Residente">Es el Residente / Inquilino</option>
                <option value="Poseedor">Es el Poseedor</option>
              </select>
            </div>
          </div>

          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center border-b pb-2">
            <Building className="w-4 h-4 mr-2 text-blue-600" /> 2. Ubicación y Características del Predio
          </h3>

          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center">
            <span className="font-bold mr-2">⚠️ Cuentas:</span> Es obligatorio registrar al menos uno de los dos códigos (ACUASAN o ESSA).
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10">
            <div className="md:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Dirección Física *</label>
              <div className="relative">
                <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input required type="text" name="direccion_fisica" value={formData.direccion_fisica} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" placeholder="Ej. Calle 10 # 5-20" />
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between">
                Barrio / Vereda * 
                {cargandoLugares && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
              </label>
              <input 
                required 
                type="text" 
                list="lista-barrios"
                name="barrio" 
                value={formData.barrio} 
                onChange={handleBarrioChange} 
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" 
                placeholder="Escribe el barrio..." 
                disabled={cargandoLugares}
              />
              <datalist id="lista-barrios">
                {barriosDB.map((b, idx) => (
                  <option key={idx} value={b.barrio} />
                ))}
              </datalist>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bloque</label>
              <select name="bloque" value={formData.bloque} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-white" disabled={cargandoLugares}>
                <option value="">Selecciona...</option>
                {bloquesUnicos.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
                <option value="Bloque Por Definir">Otro / Por Definir</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Estrato</label>
              <select name="estrato" value={formData.estrato} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-white">
                <option value="">Sin Estrato</option>
                <option value="1">1 - Bajo-Bajo</option>
                <option value="2">2 - Bajo</option>
                <option value="3">3 - Medio-Bajo</option>
                <option value="4">4 - Medio</option>
                <option value="5">5 - Medio-Alto</option>
                <option value="6">6 - Alto</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Uso</label>
              <select name="uso_aseo" value={formData.uso_aseo} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-white">
                <option value="Residencial">Residencial</option>
                <option value="Comercial">Comercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Oficial">Oficial / Institucional</option>
                <option value="Lote">Lote / Predio Vacío</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Código ACUASAN</label>
              <input type="text" name="codigo_acuasan" value={formData.codigo_acuasan} onChange={handleChange} className="w-full px-4 py-2.5 border border-blue-300 bg-blue-50/50 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono text-blue-700" placeholder="Ej. 12345" />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Código ESSA</label>
              <input type="text" name="codigo_essa" value={formData.codigo_essa} onChange={handleChange} className="w-full px-4 py-2.5 border border-emerald-300 bg-emerald-50/50 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 font-mono text-emerald-700" placeholder="Ej. 98765" />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button 
              type="button"
              onClick={() => navigate('/usuarios')}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 mr-4 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || cargandoLugares}
              className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Guardar Expediente</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};