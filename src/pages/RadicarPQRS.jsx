import { Fragment, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { cargarConfiguracion } from '../lib/systemSettings';
import { TIPOS_PQRS } from '../lib/pqrs';
import {
  ArrowLeft, User, Ticket, Clock, Shield, FileText,
  Save, Send, Loader2, CheckCircle
} from 'lucide-react';
import { BuscadorClientePQRS } from '../components/pqrs/BuscadorClientePQRS';
import { FormularioDetallePQRS } from '../components/pqrs/FormularioDetallePQRS';
import { AnexosDocumentos } from '../components/pqrs/AnexosDocumentos';

// ─── Estado inicial del formulario ──────────────────────────────────────────
const FORM_INICIAL = {
  tipo_solicitud: 'Petición',
  asunto: '',
  descripcion: '',
  urgencia: 'media',
  datos_extra: {}
};

export const RadicarPQRS = () => {
  const navigate = useNavigate();

  const [params] = useSearchParams();
  const draftKey = `pqrs-borrador:${JSON.parse(localStorage.getItem('ecoUser') || '{}')?.id_empleado || JSON.parse(localStorage.getItem('ecoUser') || '{}')?.email || 'local'}`;
  const [borrador] = useState(() => { try { return JSON.parse(localStorage.getItem(draftKey) || 'null'); } catch { return null; } });

  // Cliente seleccionado (resultado de BuscadorClientePQRS)
  const [clienteEncontrado, setClienteEncontrado] = useState(null);

  // Datos del formulario PQRS gestionados desde FormularioDetallePQRS
  const [formData, setFormData] = useState({ ...FORM_INICIAL, tipo_solicitud: TIPOS_PQRS.includes(params.get('tipo')) ? params.get('tipo') : 'Petición' });

  // Archivo físico seleccionado (gestionado desde AnexosDocumentos)
  const [archivoFisico, setArchivoFisico] = useState(null);

  // Estados de flujo
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const [config, setConfig] = useState(null);
  const [errorConfig, setErrorConfig] = useState('');
  const [versionConfig, setVersionConfig] = useState(0);
  const archivoSubido = useRef(null);
  useEffect(() => {
    let active = true;
    cargarConfiguracion().then(data => {
      if (active) { setConfig(data); setErrorConfig(''); setFormData(prev => ({ ...prev, urgencia: data.urgencia_predeterminada })); }
    }).catch(error => { if (active) setErrorConfig(error.message); });
    return () => { active = false; };
  }, [versionConfig]);
  const subirArchivo = async archivo => {
    if (archivoSubido.current?.archivo === archivo) return archivoSubido.current.path;
    const { data: { user }, error: errorSesion } = await supabase.auth.getUser();
    if (errorSesion || !user) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
    const extension = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[archivo.type];
    if (!extension) throw new Error('Selecciona PDF, JPG, PNG o WebP.');
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from('pqrs-anexos').upload(path, archivo, { contentType: archivo.type, upsert: false, metadata: { nombre_original: archivo.name } });
    if (error) throw error;
    archivoSubido.current = { archivo, path };
    return path;
  };

  // ─── Radicar PQRS ─────────────────────────────────────────────────────────
  const handleRadicar = async (e) => {
    e.preventDefault();
    if (isSubmitting || mensajeExito || !config) return;

    // Validaciones previas
    if (!clienteEncontrado) {
      alert('⚠️ Debes buscar y seleccionar un cliente antes de radicar.');
      return;
    }
    const asuntoLimpio = formData.asunto.trim();
    const descripcionLimpia = formData.descripcion.trim();
    if (!asuntoLimpio || !descripcionLimpia) {
      alert('⚠️ El asunto y la descripción son campos obligatorios.');
      return;
    }

    if (config.exigir_anexo_reclamo && formData.tipo_solicitud === 'Reclamo' && !archivoFisico) { alert('La configuración exige un anexo para reclamos.'); return; }
    if (archivoFisico && archivoFisico.size > config.max_archivo_mb * 1048576) { alert(`El archivo supera ${config.max_archivo_mb} MB.`); return; }
    setIsSubmitting(true);
    let rutaArchivo = null;

    try {
      // 1. Subir archivo a almacenamiento (si hay uno)
      if (archivoFisico) {
        setIsUploading(true);
        try {
          rutaArchivo = await subirArchivo(archivoFisico);
        } catch (uploadError) {
          console.error('Error subiendo a almacenamiento:', uploadError);
          throw new Error(`No se pudo subir el anexo: ${uploadError.message}. Reintenta o quita el archivo para radicar sin él.`, { cause: uploadError });
        } finally {
          setIsUploading(false);
        }
      }

      // 2. Construir el JSONB de datos_especificos
      const datosEspecificosJSON = {
        asunto: asuntoLimpio,
        descripcion: descripcionLimpia,
        urgencia: formData.urgencia,
        // Campos extra dinámicos (nro factura, área, motivo, etc.)
        ...formData.datos_extra,
        // Ruta privada del soporte (null si no se subió nada)
        documento_soporte_path: rutaArchivo,
        documento_soporte_nombre: rutaArchivo ? archivoFisico?.name : null
      };

      // 3. Insertar en Supabase
      const { error } = await supabase.from('pqrs').insert({
        id_vinculo: clienteEncontrado.id_vinculo,
        tipo_solicitud: formData.tipo_solicitud,
        fase_actual: '1. Recepción',
        datos_especificos: datosEspecificosJSON
      });

      if (error) throw error;

      try { localStorage.removeItem(draftKey); } catch { /* La radicación ya fue guardada. */ }
      // 4. Éxito: mensaje flotante + reset + redirigir
      setMensajeExito(
        `✅ PQRS radicada para ${(clienteEncontrado.personas?.nombres_razon_social || 'el usuario seleccionado')}`
      );
      setTimeout(() => {
        setMensajeExito('');
        setClienteEncontrado(null);
        setFormData({ ...FORM_INICIAL });
        setArchivoFisico(null);
        navigate('/pqrs');
      }, 3000);

    } catch (error) {
      console.error('Error al radicar:', error);
      alert(`❌ Error al radicar: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="bg-slate-50 min-h-full pb-10">

      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-40">
        <div className="h-16 px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              aria-label="Volver a PQRS"
              onClick={() => navigate('/pqrs')}
              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
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
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shadow-sm">
            <User className="text-white w-4 h-4" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto flex flex-col w-full pt-6 px-4 md:px-6">

        {borrador && <div className="mb-4 p-4 bg-amber-50 border rounded-lg"><p>Hay un borrador guardado en este navegador. Se recupera solo si lo eliges.</p><button type="button" disabled={!config} className="mt-2 underline" onClick={() => { setClienteEncontrado(borrador.cliente || null); setFormData({ ...FORM_INICIAL, ...borrador.formData, tipo_solicitud: TIPOS_PQRS.includes(borrador.formData?.tipo_solicitud) ? borrador.formData.tipo_solicitud : 'Petición' }); }}>Recuperar borrador</button></div>}
        {errorConfig ? <div role="alert" className="mb-4 p-4 bg-red-50 text-red-700">{errorConfig}<button onClick={() => setVersionConfig(v => v + 1)} className="ml-3 underline">Reintentar configuración</button></div> : !config && <p role="status" className="mb-4">Cargando reglas de radicación…</p>}
        {/* INDICADOR DE ESTADO */}
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
                <Clock className="w-4 h-4" />
                Hoy • {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })}
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Shield className="w-4 h-4" /> Sede Central
              </span>
            </div>
          </div>
        </section>

        {/* STEPPER */}
        <section className="w-full mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm overflow-x-auto">
            <div className="flex items-center min-w-[600px] justify-between px-2">
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

              {[{ n: 2, label: 'Verificación' }, { n: 3, label: 'Anexos' }, { n: 4, label: 'Ventanilla' }].map(({ n, label }) => (
                <Fragment key={n}>
                  <div className="flex items-center gap-3 opacity-40">
                    <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold">{n}</div>
                    <span className="text-sm text-gray-700 font-bold">{label}</span>
                  </div>
                  {n < 4 && <div className="flex-1 h-1 mx-4 bg-gray-100 rounded-full"></div>}
                </Fragment>
              ))}
            </div>
          </div>
        </section>

        <form onSubmit={handleRadicar}><fieldset disabled={isSubmitting || !!mensajeExito} className="min-w-0 flex flex-col gap-8">

          {/* BLOQUE 1: Buscador con filtro exacto + desplegable de resultados */}
          <BuscadorClientePQRS
            clienteEncontrado={clienteEncontrado}
            onClienteSeleccionado={setClienteEncontrado}
            onLimpiarCliente={() => setClienteEncontrado(null)}
          />

          {/* BLOQUE 2: Formulario dinámico según tipo de trámite */}
          <FormularioDetallePQRS
            formData={formData}
            setFormData={setFormData}
            isClienteSeleccionado={!!clienteEncontrado}
          />

          {/* BLOQUE 3: Anexo real — sube a almacenamiento privado */}
          <div className={`bg-white rounded-2xl border border-gray-200 p-6 shadow-sm transition-all ${!clienteEncontrado ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">3. Soporte Documental</h2>
                <p className="text-sm text-gray-500">
                  El anexo se guardará de forma privada y su carga quedará registrada en trazabilidad.
                </p>
              </div>
            </div>

            <AnexosDocumentos
              archivoFisico={archivoFisico}
              setArchivoFisico={setArchivoFisico}
              isUploading={isUploading}
              maxMB={config?.max_archivo_mb || 10}
              disabled={!clienteEncontrado || !config}
            />
          </div>

          {/* BOTONERA */}
          <div className={`flex flex-col-reverse sm:flex-row gap-3 ${!clienteEncontrado ? 'opacity-50 pointer-events-none' : ''}`}>
            <button
              type="button"
              onClick={() => { try { localStorage.setItem(draftKey, JSON.stringify({ cliente: clienteEncontrado, formData })); alert('Borrador guardado en este navegador. Los archivos deben adjuntarse nuevamente al volver.'); } catch { alert('No se pudo guardar el borrador.'); } }}
              className="w-full sm:w-auto flex-1 py-4 px-6 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 flex items-center justify-center gap-2 transition-all"
            >
              <Save className="w-5 h-5" /> Guardar Borrador
            </button>
            <button
              type="submit"
              disabled={!config || !clienteEncontrado || isSubmitting || isUploading || !!mensajeExito}
              className="w-full sm:w-auto flex-[2] py-4 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-70"
            >
              {(isSubmitting || isUploading)
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <Send className="w-5 h-5" />}
              {isUploading
                ? 'Subiendo documento a almacenamiento…'
                : isSubmitting
                  ? 'Radicando en sistema…'
                  : 'Radicar solicitud'}
            </button>
          </div>

        </fieldset></form>
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
