import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  ArrowLeft, User, Ticket, Clock, Shield, FileText, 
  UserCheck, Search, MapPin, Droplet, ShieldCheck, RefreshCw, 
  ArrowDownToLine, Hourglass, AlertTriangle, UploadCloud, 
  File, Eye, Trash2, Gavel, Save, Send, Loader2, CheckCircle
} from 'lucide-react';

export const RadicarPQRS = () => {
  const navigate = useNavigate();

  // --- ESTADOS DE BÚSQUEDA ---
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [isBuscando, setIsBuscando] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState(null);

  // --- ESTADOS DEL FORMULARIO PQRS ---
  const [formData, setFormData] = useState({
    tipo_solicitud: 'Reclamación por Facturación / Consumo Atípico',
    asunto: '',
    descripcion: '',
    urgencia: 'media' // baja, media, alta
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  // --- 1. LÓGICA DE BÚSQUEDA DEL CLIENTE ---
  const handleBuscar = async () => {
    if (!terminoBusqueda.trim()) return;
    
    setIsBuscando(true);
    setClienteEncontrado(null);
    
    try {
      const columnasSelect = `
        id_vinculo, 
        estado_servicio,
        personas!inner ( nombres_razon_social, numero_documento, tipo_documento ),
        predios!inner ( direccion_fisica, barrio, bloque, codigo_acuasan, codigo_essa, estrato, uso_aseo )
      `;

      // Buscamos simultáneamente por Cédula o por Código Acuasan/ESSA
      const [resPersonas, resPredios] = await Promise.all([
        supabase.from('vinculos_servicio').select(columnasSelect).ilike('personas.numero_documento', `%${terminoBusqueda}%`),
        supabase.from('vinculos_servicio').select(columnasSelect).or(`codigo_acuasan.ilike.%${terminoBusqueda}%,codigo_essa.ilike.%${terminoBusqueda}%`, { foreignTable: 'predios' })
      ]);

      let combinados = [];
      if (resPersonas.data) combinados = [...combinados, ...resPersonas.data];
      if (resPredios.data) combinados = [...combinados, ...resPredios.data];

      if (combinados.length > 0) {
        setClienteEncontrado(combinados[0]); // Seleccionamos el primero que coincida
      } else {
        alert("No se encontró ningún cliente o predio con ese número.");
      }
    } catch (error) {
      console.error("Error buscando:", error);
    } finally {
      setIsBuscando(false);
    }
  };

  // --- 2. LÓGICA DE RADICACIÓN ---
  const handleRadicar = async (e) => {
    e.preventDefault();
    
    if (!clienteEncontrado) {
      alert("⚠️ Debes buscar y seleccionar un cliente antes de radicar.");
      return;
    }
    if (!formData.asunto.trim() || !formData.descripcion.trim()) {
      alert("⚠️ El asunto y la descripción son obligatorios.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Usamos el poder del JSONB para guardar los datos específicos del formulario
      const datosEspecificosJSON = {
        asunto: formData.asunto,
        descripcion: formData.descripcion,
        urgencia: formData.urgencia,
        documentos_adjuntos: ["Factura_Acuasan_Nov2024.pdf"] // Simulado por ahora
      };

      const { error } = await supabase.from('pqrs').insert({
        id_vinculo: clienteEncontrado.id_vinculo,
        tipo_solicitud: formData.tipo_solicitud,
        fase_actual: '1. Recepción',
        datos_especificos: datosEspecificosJSON
      });

      if (error) throw error;

      // Éxito
      setMensajeExito(`¡PQRS Radicada con éxito para ${clienteEncontrado.personas.nombres_razon_social}!`);
      
      // Limpiamos el formulario después de 3 segundos
      setTimeout(() => {
        setMensajeExito('');
        setClienteEncontrado(null);
        setFormData({ tipo_solicitud: 'Reclamación por Facturación / Consumo Atípico', asunto: '', descripcion: '', urgencia: 'media' });
        setTerminoBusqueda('');
        navigate('/pqrs');
      }, 3000);

    } catch (error) {
      console.error("Error al radicar:", error);
      alert("Ocurrió un error al intentar radicar el trámite.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-full pb-10">
      {/* HEADER TIPO APP */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-40">
        <div className="h-16 px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col ml-1">
              <nav className="flex items-center gap-1 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                <span>Trámites</span>
                <span>/</span>
                <span className="text-emerald-600 font-bold">Radicación</span>
              </nav>
              <h1 className="font-bold text-lg text-gray-900 leading-tight">Radicar Trámite (PQRS)</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shadow-sm">
              <User className="text-white w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto flex flex-col w-full pt-6 px-4 md:px-6">
        
        {/* INDICADOR DE ESTADO Y CASO */}
        <section className="w-full mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Recepción Oficial</span>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full text-blue-700 text-xs font-bold">
                <Ticket className="w-4 h-4" />
                <span>#PQRS-NUEVO</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-gray-500 text-sm pt-1 border-t border-gray-100">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> Hoy • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Shield className="w-4 h-4" /> Sede Central
              </span>
            </div>
          </div>
        </section>

        {/* STEPPER HORIZONTAL (Indicador de Proceso) */}
        <section className="w-full mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm overflow-x-auto">
            <div className="flex items-center min-w-[600px] justify-between px-2">
              
              {/* Step 1 (Active) */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-emerald-700 font-bold">1. Recepción</span>
                  <span className="text-[11px] text-gray-500 font-medium">En curso</span>
                </div>
              </div>
              <div className="flex-1 h-1 mx-4 bg-emerald-100 rounded-full"></div>
              
              {/* Step 2 */}
              <div className="flex items-center gap-3 opacity-50">
                <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold">2</div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-700 font-bold">Verificación</span>
                  <span className="text-[11px] text-gray-500 font-medium">Pendiente</span>
                </div>
              </div>
              <div className="flex-1 h-1 mx-4 bg-gray-100 rounded-full"></div>

              {/* Step 3 */}
              <div className="flex items-center gap-3 opacity-50">
                <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold">3</div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-700 font-bold">Anexos</span>
                </div>
              </div>
              <div className="flex-1 h-1 mx-4 bg-gray-100 rounded-full"></div>

              {/* Step 4 */}
              <div className="flex items-center gap-3 opacity-50">
                <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold">4</div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-700 font-bold">Ventanilla</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        <form onSubmit={handleRadicar} className="flex flex-col gap-8">
          
          {/* BLOQUE 1: BÚSQUEDA DEL CLIENTE */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">1. Identificación del Suscriptor</h2>
                <p className="text-sm text-gray-500">Búsqueda censal en base de acueducto y aseo</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700 flex items-center justify-between">
                <span>Cédula de Ciudadanía o Código Acuasan</span>
                <span className="text-emerald-600 text-xs font-bold">Búsqueda universal</span>
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    value={terminoBusqueda}
                    onChange={(e) => setTerminoBusqueda(e.target.value)}
                    placeholder="Ej. 1098742315 ó 84920" 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
                <button 
                  type="button" 
                  onClick={handleBuscar}
                  disabled={isBuscando || !terminoBusqueda}
                  className="px-6 py-3 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm disabled:opacity-70 transition-all"
                >
                  {isBuscando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  <span className="hidden sm:inline">Consultar</span>
                </button>
              </div>
            </div>

            {/* TARJETA DEL CLIENTE ENCONTRADO */}
            {clienteEncontrado && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col gap-4 relative animate-in fade-in zoom-in duration-300">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-lg font-bold shadow-sm">
                      {clienteEncontrado.personas.nombres_razon_social.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">{clienteEncontrado.personas.nombres_razon_social}</h3>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {clienteEncontrado.personas.tipo_documento} {clienteEncontrado.personas.numero_documento} • 
                        <span className="font-bold text-blue-600 ml-1">Acuasan: {clienteEncontrado.predios.codigo_acuasan || 'N/A'}</span>
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                    <CheckCircle className="w-4 h-4" /> Al Día
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                    <MapPin className="text-rose-500 w-5 h-5 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-gray-500 uppercase">Dirección de Suministro</span>
                      <span className="text-sm font-bold text-gray-900 truncate">{clienteEncontrado.predios.direccion_fisica}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                    <Droplet className="text-blue-500 w-5 h-5 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-gray-500 uppercase">Uso y Estrato</span>
                      <span className="text-sm font-bold text-gray-900 truncate">{clienteEncontrado.predios.uso_aseo} • Estrato {clienteEncontrado.predios.estrato || 'N/D'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 mt-1">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                    <ShieldCheck className="w-4 h-4" /> Sin suspensiones ni procesos coactivos
                  </div>
                  <button type="button" onClick={() => setClienteEncontrado(null)} className="text-gray-500 hover:text-gray-800 text-xs font-bold flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Cambiar cliente
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* BLOQUE 2: DETALLES DE LA SOLICITUD */}
          <div className={`bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col gap-6 transition-all ${!clienteEncontrado ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">2. Detalles de la Solicitud</h2>
                <p className="text-sm text-gray-500">Tipificación y fundamentación técnica del reclamo</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Tipo de Solicitud (PQRS)</label>
              <select 
                value={formData.tipo_solicitud}
                onChange={(e) => setFormData({...formData, tipo_solicitud: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
              >
                <option>Desvinculación de Servicio</option>
                <option>Reclamación por Facturación / Consumo Atípico</option>
                <option>Petición de Reconexión de Suministro</option>
                <option>Queja por Calidad de Agua / Presión en Red</option>
                <option>Solicitud de Revisión de Aforo y Estratificación</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Asunto del Trámite</label>
              <input 
                type="text" 
                value={formData.asunto}
                onChange={(e) => setFormData({...formData, asunto: e.target.value})}
                placeholder="Ej. Inconformidad con cobro..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-700">Descripción de los Hechos</label>
                <span className="text-xs font-bold text-gray-400">Max. 1000 caracteres</span>
              </div>
              <textarea 
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                rows="4"
                placeholder="Describa puntualmente los motivos de inconformidad..."
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
              ></textarea>
            </div>

            {/* TOGGLES DE URGENCIA */}
            <div className="flex flex-col gap-3">
              <span className="text-sm font-bold text-gray-700">Nivel de Urgencia Operativa</span>
              <div className="grid grid-cols-3 gap-3">
                <label className="cursor-pointer">
                  <input type="radio" name="urgencia" value="baja" checked={formData.urgencia === 'baja'} onChange={(e) => setFormData({...formData, urgencia: e.target.value})} className="sr-only peer" />
                  <div className="flex flex-col items-center p-3 rounded-xl border-2 border-transparent bg-gray-50 text-gray-500 peer-checked:bg-emerald-50 peer-checked:border-emerald-500 peer-checked:text-emerald-700 transition-all text-center">
                    <ArrowDownToLine className="w-5 h-5 mb-1" />
                    <span className="text-sm font-bold">Baja</span>
                    <span className="text-[10px] uppercase font-bold opacity-70">15 Días</span>
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="urgencia" value="media" checked={formData.urgencia === 'media'} onChange={(e) => setFormData({...formData, urgencia: e.target.value})} className="sr-only peer" />
                  <div className="flex flex-col items-center p-3 rounded-xl border-2 border-transparent bg-gray-50 text-gray-500 peer-checked:bg-amber-50 peer-checked:border-amber-500 peer-checked:text-amber-700 transition-all text-center">
                    <Hourglass className="w-5 h-5 mb-1" />
                    <span className="text-sm font-bold">Media</span>
                    <span className="text-[10px] uppercase font-bold opacity-70">8 Días</span>
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="urgencia" value="alta" checked={formData.urgencia === 'alta'} onChange={(e) => setFormData({...formData, urgencia: e.target.value})} className="sr-only peer" />
                  <div className="flex flex-col items-center p-3 rounded-xl border-2 border-transparent bg-gray-50 text-gray-500 peer-checked:bg-rose-50 peer-checked:border-rose-500 peer-checked:text-rose-700 transition-all text-center">
                    <AlertTriangle className="w-5 h-5 mb-1" />
                    <span className="text-sm font-bold">Alta</span>
                    <span className="text-[10px] uppercase font-bold opacity-70">48 Horas</span>
                  </div>
                </label>
              </div>
            </div>

            {/* DRAG & DROP FALSO */}
            <div className="flex flex-col gap-2 mt-2">
              <label className="text-sm font-bold text-gray-700 flex justify-between">
                <span>Pruebas y Documentos Anexos</span>
                <span className="text-blue-600 text-xs font-bold">PDF hasta 15MB</span>
              </label>
              <div className="rounded-xl p-8 border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-blue-500 shadow-sm">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-700 font-bold">Arrastra tu archivo PDF aquí o <span className="text-blue-600 underline">examina</span></p>
                  <p className="text-xs text-gray-500 mt-1">Facturas de cobro, evidencias fotográficas o memoriales.</p>
                </div>
              </div>

              {/* Archivo adjunto simulado */}
              <div className="mt-2 bg-white border border-gray-200 p-3 rounded-xl shadow-sm flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
                    <File className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-800">Soporte_Firma_Nov2024.pdf</span>
                    <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                      1.8 MB • <span className="text-emerald-500">Verificado</span>
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button type="button" className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><Eye className="w-5 h-5"/></button>
                  <button type="button" className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-5 h-5"/></button>
                </div>
              </div>
            </div>

            {/* AVISO LEGAL */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 mt-2">
              <Gavel className="text-amber-600 w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-amber-800 leading-relaxed">
                La radicación genera deber legal conforme a la Ley 142 de 1994 y la Ley 1755 de 2015. Al radicar, el sistema asignará el estado oficial "1. Recepción" y guardará los metadatos en la estructura unificada (JSONB).
              </p>
            </div>
          </div>

          {/* BOTONERA FINAL */}
          <div className={`flex flex-col-reverse sm:flex-row gap-3 ${!clienteEncontrado ? 'opacity-50 pointer-events-none' : ''}`}>
            <button type="button" className="w-full sm:w-auto flex-1 py-4 px-6 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 flex items-center justify-center gap-2 transition-all">
              <Save className="w-5 h-5" /> Guardar Borrador
            </button>
            <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto flex-[2] py-4 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-70">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Radicar y Generar Constancia
            </button>
          </div>

        </form>
      </main>

      {/* TOAST DE ÉXITO */}
      {mensajeExito && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 bg-gray-900 text-white rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle className="text-emerald-400 w-6 h-6" />
          <span className="text-sm font-bold">{mensajeExito}</span>
        </div>
      )}
    </div>
  );
};