import React, { useEffect, useState } from 'react';
import { AvailabilityGrid } from '../../components/domain/availability/AvailabilityGrid';
import { VersionHistory } from '../../components/domain/availability/VersionHistory';
import { Button } from '../../components/ui/Button';
import { AcademicPeriod, AvailabilityVersion } from '../../types/availability.types';
import { periodService } from '../../services/period.service';
import { availabilityService } from '../../services/availability.service';
import { Save, AlertTriangle, Loader2, Info, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AvailabilityPage = () => {
  const { user } = useAuth();
  
  // Estado Global de la Página
  const [period, setPeriod] = useState<AcademicPeriod | null>(null);
  const [versions, setVersions] = useState<AvailabilityVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estado del Editor
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState('');
  const [viewingVersionId, setViewingVersionId] = useState<string | null>(null); // Si no es null, estamos viendo historial

  // Inicialización de Datos
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // 1. Obtener Periodo
        const activePeriod = await periodService.getActive();
        setPeriod(activePeriod);

        if (activePeriod) {
          // 2. Obtener Historial
          const history = await availabilityService.getMyHistory(activePeriod.id);
          setVersions(history);
          
          // 3. Cargar estado inicial del editor
          // Si hay una versión final, cargarla. Si no, la última. Si no, vacío.
          const finalOrLatest = history.find(v => v.isFinal) || history[0];
          if (finalOrLatest) {
            loadVersionToEditor(finalOrLatest, true); // true = modo visualización inicial (puede ser editable si no es histórico)
          }
        }
      } catch (err: any) {
        // Manejar caso 404 si no hay periodo
        if (err.response?.status === 404) {
            setError("No hay un periodo académico activo configurado en el sistema.");
        } else {
            setError("Error al conectar con el servidor. Intente recargar.");
        }
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // --- Helpers ---

  // Carga una versión en el estado local. 
  // viewOnly=true pone el ID en viewingVersionId (bloquea edición).
  // viewOnly=false limpia viewingVersionId (permite editar/guardar nueva).
  const loadVersionToEditor = (v: AvailabilityVersion, viewOnly: boolean) => {
    setSelectedSlots(new Set(v.slots));
    setComments(v.comments || '');
    if (viewOnly) {
      setViewingVersionId(v.id);
    } else {
      setViewingVersionId(null);
      setSuccessMsg("Datos cargados. Puedes modificarlos y guardar una nueva versión.");
    }
  };

  // --- Handlers ---

  const handleToggleSlot = (day: string, time: string) => {
    const slotId = `${day}-${time}`;
    const newSet = new Set(selectedSlots);
    if (newSet.has(slotId)) {
      newSet.delete(slotId);
    } else {
      newSet.add(slotId);
    }
    setSelectedSlots(newSet);
    // Si estábamos viendo un historial y tocamos algo, implícitamente salimos del modo vista 
    // PERO aquí forzamos a usar el botón "Restaurar" para evitar confusiones, 
    // así que si está en modo vista, el componente Grid ya debería estar en readOnly.
  };

  const handleSave = async () => {
    if (!period) return;
    setError(null);
    setSuccessMsg(null);

    try {
      const newVersion = await availabilityService.create({
        periodId: period.id,
        slots: Array.from(selectedSlots),
        comments: comments
      });

      // Actualizar historial
      setVersions([newVersion, ...versions]);
      setSuccessMsg("Disponibilidad guardada exitosamente.");
      setViewingVersionId(newVersion.id); // Pasamos a modo vista de lo recién guardado para confirmar
    } catch (err: any) {
      // Manejo de errores de validación del backend (ej. Regla 2 horas)
      const msg = err.response?.data?.message || "Error al guardar.";
      setError(msg);
    }
  };

  const handleMarkFinal = async (versionId: string) => {
    try {
      await availabilityService.markAsFinal(versionId);
      
      // Actualizar estado local
      const updatedVersions = versions.map(v => ({
        ...v,
        isFinal: v.id === versionId // Solo esta es final
      }));
      setVersions(updatedVersions);
      setSuccessMsg("Versión marcada como FINAL correctamente.");
    } catch (err) {
      setError("Error al marcar como final.");
    }
  };

  const handleRestore = (version: AvailabilityVersion) => {
      loadVersionToEditor(version, false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Renders Condicionales ---

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <span className="ml-3 text-slate-500">Cargando datos...</span>
      </div>
    );
  }

  if (!period) {
    return (
      <div className="p-8 bg-white rounded-xl shadow border text-center">
        <Info className="mx-auto text-blue-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-800">No hay Periodo Activo</h2>
        <p className="text-slate-500 mt-2">{error || "Contacte al administrador para configurar el ciclo académico."}</p>
      </div>
    );
  }

  // Calculamos si el grid debe ser editable
  // Editable si: Ventana Abierta Y NO estamos viendo un registro histórico específico
  const isWindowOpen = period.isOpenForSubmission;
  const isEditable = isWindowOpen && viewingVersionId === null;

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado y Estado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Mi Disponibilidad</h2>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-sm text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded">
               Periodo: {period.name}
             </span>
             {isWindowOpen ? (
                <span className="text-sm text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200 flex items-center gap-1">
                   <span className="w-2 h-2 bg-green-500 rounded-full"></span> Ventana Abierta
                </span>
             ) : (
                <span className="text-sm text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200 flex items-center gap-1">
                   <Lock size={12} /> Ventana Cerrada
                </span>
             )}
          </div>
        </div>

        {/* Barra de Acciones */}
        <div className="flex items-center gap-3 w-full md:w-auto">
           {viewingVersionId && isWindowOpen && (
               <Button variant="secondary" onClick={() => setViewingVersionId(null)}>
                  Volver al Editor
               </Button>
           )}
           
           {isEditable && (
              <Button 
                onClick={handleSave} 
                className="flex items-center gap-2 w-full md:w-auto justify-center"
              >
                <Save size={18} />
                Guardar Disponibilidad
              </Button>
           )}
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="shrink-0 mt-0.5" size={20} />
          <div>
              <p className="font-bold">No se pudo guardar</p>
              <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
         <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg flex items-center gap-3 animate-in fade-in">
             <Info size={20} />
             <span>{successMsg}</span>
         </div>
      )}

      {/* Observaciones (Solo visible en edición) */}
      {isEditable && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
             <label className="block text-sm font-semibold text-slate-700 mb-2">Observaciones / Comentarios</label>
             <textarea 
               className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
               rows={2}
               placeholder="Ej. Prefiero no tener clases los lunes por la mañana..."
               value={comments}
               onChange={(e) => setComments(e.target.value)}
             />
          </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 h-[800px]">
        {/* Columna Principal: Calendario */}
        <div className="flex-1 min-w-0">
           <AvailabilityGrid 
              selectedSlots={selectedSlots}
              onToggleSlot={handleToggleSlot}
              readOnly={!isEditable}
              isViewingHistory={viewingVersionId !== null}
           />
        </div>

        {/* Columna Lateral: Historial */}
        <div className="w-full lg:w-80 shrink-0">
           <VersionHistory 
              versions={versions}
              currentViewingId={viewingVersionId}
              onViewVersion={(v) => loadVersionToEditor(v, true)}
              onRestoreToEditor={handleRestore}
              onMarkFinal={handleMarkFinal}
              isWindowOpen={isWindowOpen}
           />
        </div>
      </div>
    </div>
  );
};