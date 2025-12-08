import React, { useState, useEffect } from 'react';
import { TIME_SLOTS_STRINGS, DAYS_OF_WEEK } from '../constants';
import { AcademicPeriod, AvailabilityVersion } from '../types';
import { validateAvailability, downloadCSV, generateAvailabilityReport } from '../services/utils';
import { Save, AlertCircle, CheckCircle, Download, History, Calendar, Check, Lock, Eye, RotateCcw, MessageSquare, X } from 'lucide-react';
import { User } from '../types';

interface AvailabilitySchedulerProps {
  user: User;
  period: AcademicPeriod;
  onSave: (slots: string[], comments: string) => void;
  onMarkFinal: (versionId: string) => void;
  previousVersions: AvailabilityVersion[];
  readOnly?: boolean; // New prop for Admin View Mode
}

const AvailabilityScheduler: React.FC<AvailabilitySchedulerProps> = ({ 
  user, 
  period, 
  onSave, 
  onMarkFinal,
  previousVersions,
  readOnly = false
}) => {
  // State
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Modal State for Observations
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  
  // Viewing Logic
  const [viewingVersionId, setViewingVersionId] = useState<string | null>(null);

  // Derived State
  const finalVersion = previousVersions.find(v => v.isFinal);
  const sortedVersions = [...previousVersions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // Dashboard Status Calculation
  let statusText = "Sin disponibilidad";
  let statusColor = "bg-slate-100 text-slate-600";
  
  if (previousVersions.length > 0) {
      if (finalVersion) {
          statusText = "Versión Final Marcada";
          statusColor = "bg-green-100 text-green-700";
      } else {
          statusText = "Disponibilidad Registrada (Borrador)";
          statusColor = "bg-orange-100 text-orange-700";
      }
  }

  // Load latest final version (or latest draft) into "Editor" on mount if not viewing history
  useEffect(() => {
    if (!viewingVersionId) {
        const target = finalVersion || sortedVersions[0];
        if (target) {
            setSelectedSlots(new Set(target.slots));
            setComments(target.comments);
        } else {
             setSelectedSlots(new Set());
             setComments('');
        }
    }
  }, [period.id, user.id]); 

  const toggleSlot = (day: string, time: string) => {
    // Restriction: Cannot edit if window closed OR viewing a historical record OR readOnly mode
    if (readOnly || !period.isOpenForSubmission || viewingVersionId) return;

    const id = `${day}-${time}`;
    const newSet = new Set(selectedSlots);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedSlots(newSet);
    setError(null);
    setSuccessMsg(null);
  };

  const handleSave = () => {
    if (readOnly) return;
    if (!period.isOpenForSubmission) {
        setError("La ventana de carga está cerrada.");
        return;
    }

    const slotsArray = Array.from(selectedSlots);
    const validation = validateAvailability(slotsArray);

    if (!validation.valid) {
      setError(validation.error || 'Error de validación');
      return;
    }

    onSave(slotsArray, comments);
    setSuccessMsg("Nueva versión guardada correctamente.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleMarkFinal = (vId: string) => {
      if (readOnly || !period.isOpenForSubmission) return;
      onMarkFinal(vId);
      setSuccessMsg("Versión marcada como final.");
      setTimeout(() => setSuccessMsg(null), 3000);
  };

  const loadVersionToView = (version: AvailabilityVersion) => {
    setSelectedSlots(new Set(version.slots));
    setComments(version.comments);
    setViewingVersionId(version.id);
    setError(null);
    setSuccessMsg(null);
  };

  const restoreVersionToEditor = (version: AvailabilityVersion) => {
      if (readOnly || !period.isOpenForSubmission) return;
      setSelectedSlots(new Set(version.slots));
      setComments(version.comments);
      setViewingVersionId(null); // Exit view mode
      setSuccessMsg("Versión cargada en el editor. Puedes modificarla y guardarla como nueva.");
  };

  const resetToEditor = () => {
    setViewingVersionId(null);
    const target = finalVersion || sortedVersions[0];
    if (target) {
        setSelectedSlots(new Set(target.slots));
        setComments(target.comments);
    } else {
        setSelectedSlots(new Set());
        setComments('');
    }
  };

  const handleDownloadPersonal = () => {
      const targetVersion = viewingVersionId 
        ? previousVersions.find(v => v.id === viewingVersionId) 
        : (finalVersion || {
            id: 'current',
            instructorId: user.id,
            periodId: period.id,
            timestamp: new Date().toISOString(),
            slots: Array.from(selectedSlots),
            comments: comments,
            isFinal: true
        } as AvailabilityVersion);

      if (targetVersion) {
        const rows = generateAvailabilityReport([user], [targetVersion]);
        downloadCSV(`Disponibilidad_${user.id}_${period.name}.csv`, rows);
      }
  };

  const isEditable = !readOnly && period.isOpenForSubmission && !viewingVersionId;

  return (
    <div className="space-y-6">
      
      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Calendar size={24} />
                  </div>
                  <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">Periodo Activo</p>
                      <p className="text-sm font-semibold text-slate-800">{period.name}</p>
                  </div>
              </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${period.isOpenForSubmission ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {period.isOpenForSubmission ? <CheckCircle size={24} /> : <Lock size={24} />}
                  </div>
                  <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">Ventana de Carga</p>
                      <p className={`text-sm font-semibold ${period.isOpenForSubmission ? 'text-green-700' : 'text-red-700'}`}>
                          {period.isOpenForSubmission ? 'Habilitada (Activa)' : 'Cerrada (Solo Lectura)'}
                      </p>
                  </div>
              </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${statusText.includes('Final') ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-600'}`}>
                    <Check size={24} />
                  </div>
                  <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">Estado de Envío</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>
                          {statusText}
                      </span>
                  </div>
              </div>
          </div>
      </div>

      {/* Toolbar / Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2">
            {viewingVersionId ? (
                <div className="flex items-center gap-2 bg-orange-50 text-orange-800 px-3 py-1 rounded-lg border border-orange-200">
                    <Eye size={16} />
                    <span className="text-sm font-medium">Modo Lectura: Histórico</span>
                    <button onClick={resetToEditor} className="ml-2 text-xs underline hover:text-orange-900">
                        Volver a Actual
                    </button>
                </div>
            ) : readOnly ? (
                <div className="flex items-center gap-2 bg-purple-50 text-purple-800 px-3 py-1 rounded-lg border border-purple-200">
                    <Eye size={16} />
                    <span className="text-sm font-medium">Vista de Administrador (Solo Lectura)</span>
                </div>
            ) : !period.isOpenForSubmission && (
                <div className="flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1 rounded-lg border border-slate-200">
                    <Lock size={16} />
                    <span className="text-sm">Edición bloqueada por administrador</span>
                </div>
            )}
        </div>
        
        <div className="flex gap-2">
           <button
             onClick={() => setIsCommentsModalOpen(true)}
             className={`flex items-center space-x-2 px-3 py-2 border rounded-lg text-sm ${comments.length > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
             disabled={!isEditable && !viewingVersionId && !readOnly} // Can view comments in all modes, edit in edit mode
           >
              <MessageSquare size={16} />
              <span className="hidden sm:inline">{comments.length > 0 ? 'Editar Observaciones' : 'Observaciones'}</span>
           </button>

           <button 
             onClick={handleDownloadPersonal}
             className="flex items-center space-x-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 text-sm"
           >
              <Download size={16} />
              <span className="hidden sm:inline">Reporte</span>
           </button>
           
           {isEditable && (
             <button 
               onClick={handleSave}
               className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all active:scale-95 text-sm"
             >
                <Save size={16} />
                <span>Guardar</span>
             </button>
           )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Calendar Grid */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                 <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Calendar size={18} />
                    {viewingVersionId ? 'Visualizando Histórico' : (readOnly ? `Disponibilidad de ${user.name}` : 'Editor de Disponibilidad')}
                 </h3>
                 <div className="flex gap-4 text-xs text-slate-500">
                     <div className="flex items-center gap-1"><div className="w-3 h-3 bg-white border border-slate-300 rounded"></div> Libre</div>
                     <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded"></div> Seleccionado</div>
                 </div>
            </div>
            
            <div className="overflow-x-auto pb-2 flex-1">
                <div className="min-w-[800px] p-4">
                    {/* Header Row */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                    <div className="text-center font-bold text-slate-400 text-sm py-2">Hora</div>
                    {DAYS_OF_WEEK.map(day => (
                        <div key={day} className="text-center font-bold text-slate-700 bg-slate-100 rounded py-2 text-sm">
                        {day}
                        </div>
                    ))}
                    </div>

                    {/* Slots */}
                    {TIME_SLOTS_STRINGS.map((time, idx) => (
                    <div key={time} className="grid grid-cols-7 gap-1 mb-1">
                        <div className="text-center text-xs text-slate-400 py-2 -mt-1">{time}</div>
                        {DAYS_OF_WEEK.map(day => {
                            const id = `${day}-${time}`;
                            const isSelected = selectedSlots.has(id);
                            return (
                            <div 
                                key={id}
                                onClick={() => toggleSlot(day, time)}
                                className={`
                                    h-8 rounded transition-all border
                                    ${isSelected 
                                        ? 'bg-blue-500 border-blue-600 shadow-sm' 
                                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                    }
                                    ${(!isEditable) ? 'cursor-default opacity-80' : 'cursor-pointer hover:scale-[1.02]'}
                                `}
                            />
                            );
                        })}
                    </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Sidebar Controls */}
        <div className="w-full lg:w-80 space-y-6">
           
           {/* Version History */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col max-h-[600px] h-full">
             <div className="p-4 border-b border-slate-100">
                <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                    <History size={18} /> Historial de Versiones
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                    {sortedVersions.length === 0 ? "No hay versiones guardadas" : `${sortedVersions.length} versiones registradas`}
                </p>
             </div>
             
             <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar flex-1">
                 {sortedVersions.map((version, idx) => {
                     const isViewing = viewingVersionId === version.id;
                     return (
                        <div 
                            key={version.id}
                            className={`
                                p-3 rounded-lg border transition-all
                                ${isViewing ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : 'bg-white hover:bg-slate-50 border-slate-100'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-700 text-sm">
                                        Versión {sortedVersions.length - idx}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {new Date(version.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                {version.isFinal && (
                                    <span className="text-[10px] uppercase font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">
                                        Final
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex justify-between items-center mt-3">
                                <button 
                                    onClick={() => loadVersionToView(version)}
                                    className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${isViewing ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <Eye size={12} /> Ver
                                </button>

                                <div className="flex gap-2">
                                    {/* Action: Mark Final (Disabled for Admin View typically unless Super Admin override needed) */}
                                    {!readOnly && !version.isFinal && period.isOpenForSubmission && (
                                        <button 
                                            onClick={() => handleMarkFinal(version.id)}
                                            className="text-xs px-2 py-1 rounded border border-green-200 text-green-600 hover:bg-green-50 font-medium"
                                            title="Marcar esta versión como la definitiva para reporte"
                                        >
                                            Hacer Final
                                        </button>
                                    )}
                                    
                                    {/* Action: Restore (Copy to Editor) */}
                                    {!readOnly && period.isOpenForSubmission && (
                                        <button 
                                            onClick={() => restoreVersionToEditor(version)}
                                            className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50"
                                            title="Cargar estos datos en el editor para crear una nueva versión"
                                        >
                                            <RotateCcw size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                     );
                 })}
             </div>
           </div>
        </div>
      </div>

      {/* Observations Modal (Wireframe #6) */}
      {isCommentsModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                  <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2">
                          <MessageSquare size={18} className="text-blue-500" />
                          Observaciones
                      </h3>
                      <button onClick={() => setIsCommentsModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                  </div>
                  <div className="p-4">
                      <p className="text-xs text-slate-500 mb-2">
                          Añade comentarios para la coordinación (ej. restricciones de sede, preferencias de días no marcados, etc.).
                      </p>
                      <textarea 
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        disabled={!isEditable}
                        className={`w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-40 ${!isEditable ? 'bg-slate-100 text-slate-500' : 'bg-white'}`}
                        placeholder="Escribe aquí..."
                        autoFocus
                      />
                  </div>
                  <div className="p-4 border-t border-slate-100 flex justify-end">
                      <button 
                        onClick={() => setIsCommentsModalOpen(false)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                          {isEditable ? 'Aceptar' : 'Cerrar'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AvailabilityScheduler;