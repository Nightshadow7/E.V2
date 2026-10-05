import { UploadCloud, File, Trash2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

/**
 * AnexosDocumentos.jsx
 * Componente encargado de la selección y preview de un archivo (PDF/imagen)
 * que luego será subido a almacenamiento privado al momento de radicar.
 *
 * Props:
 *  - archivoFisico    : File | null  — el archivo seleccionado
 *  - setArchivoFisico : fn           — setter del estado
 *  - isUploading      : boolean      — true mientras se sube el archivo
 *  - disabled         : boolean      — desactiva el campo cuando no hay cliente
 */
export const AnexosDocumentos = ({ archivoFisico, setArchivoFisico, isUploading, disabled, maxMB = 10 }) => {

  const MAX_MB = maxMB;

  const handleCambioArchivo = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      alert('Selecciona PDF, JPG, PNG o WebP.');
      e.target.value = '';
      return;
    }

    const tamanioMB = archivo.size / 1024 / 1024;
    if (tamanioMB > MAX_MB) {
      alert(`⚠️ El archivo pesa ${tamanioMB.toFixed(1)} MB. El máximo permitido es ${MAX_MB} MB.`);
      e.target.value = '';
      return;
    }

    setArchivoFisico(archivo);
    e.target.value = ''; // reset para permitir re-seleccionar el mismo archivo
  };

  return (
    <div className={`flex flex-col gap-3 transition-all ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <label className="text-sm font-bold text-gray-700 flex items-center justify-between">
        <span>Pruebas y Documentos Anexos</span>
        <span className="text-blue-600 text-xs font-bold">PDF / imagen — máx. {MAX_MB} MB</span>
      </label>

      {/* Zona de selección — sólo muestra si no hay archivo aún */}
      {!archivoFisico && (
        <label className="rounded-xl p-8 border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleCambioArchivo}
            disabled={disabled}
          />
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-blue-500 shadow-sm">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-700 font-bold">
              Haz clic aquí para seleccionar tu archivo
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Facturas de cobro, evidencias fotográficas o memoriales en PDF.
            </p>
          </div>
        </label>
      )}

      {/* Vista previa del archivo seleccionado */}
      {archivoFisico && !isUploading && (
        <div className="bg-white border border-emerald-200 p-3 rounded-xl shadow-sm flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
              <File className="w-6 h-6" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-gray-800 truncate">{archivoFisico.name}</span>
              <span className="text-[11px] text-gray-400 font-medium">
                {(archivoFisico.size / 1024 / 1024).toFixed(2)} MB •{' '}
                <span className="text-emerald-600 font-bold flex-inline items-center gap-1">
                  <CheckCircle className="w-3 h-3 inline mr-0.5" />
                  Listo para subir
                </span>
              </span>
            </div>
          </div>
          <button
            type="button"
            disabled={disabled || isUploading}
            onClick={() => setArchivoFisico(null)}
            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 transition-colors"
            title="Quitar archivo"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Estado: subiendo a almacenamiento privado */}
      {isUploading && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-blue-700">Subiendo archivo a almacenamiento privado…</span>
            <span className="text-xs text-blue-500">Esto puede tardar unos segundos.</span>
          </div>
        </div>
      )}

      {/* Aviso cuando no hay archivo */}
      {!archivoFisico && !isUploading && (
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          El archivo es opcional. Puedes radicar sin adjuntar documentos.
        </p>
      )}
    </div>
  );
};
