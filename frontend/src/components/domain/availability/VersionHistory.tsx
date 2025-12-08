import React from 'react';
import { AvailabilityVersion } from '../../../types/availability.types';
import { History, Eye, CheckCircle, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface VersionHistoryProps {
  versions: AvailabilityVersion[];
  currentViewingId: string | null;
  onViewVersion: (version: AvailabilityVersion) => void;
  onRestoreToEditor: (version: AvailabilityVersion) => void;
  onMarkFinal: (versionId: string) => void;
  isWindowOpen: boolean;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  versions,
  currentViewingId,
  onViewVersion,
  onRestoreToEditor,
  onMarkFinal,
  isWindowOpen
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full max-h-[calc(100vh-140px)]">
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <h4 className="font-semibold text-slate-700 flex items-center gap-2">
          <History size={18} className="text-blue-500" /> Historial
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          {versions.length === 0 ? "Sin versiones guardadas" : `${versions.length} versiones registradas`}
        </p>
      </div>

      <div className="overflow-y-auto p-3 space-y-3 flex-1">
        {versions.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            Guarda tu disponibilidad para ver el historial aquí.
          </div>
        )}

        {versions.map((version, idx) => {
          const isViewing = currentViewingId === version.id;
          const displayIndex = versions.length - idx; // Orden inverso visual

          return (
            <div
              key={version.id}
              className={`p-3 rounded-lg border transition-all ${
                isViewing 
                  ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' 
                  : 'bg-white border-slate-100 hover:border-slate-300'
              }`}
            >
              {/* Header de la Tarjeta */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-bold text-slate-700 text-xs block">
                    Versión {displayIndex}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {format(new Date(version.createdAt), "d MMM, HH:mm", { locale: es })}
                  </span>
                </div>
                {version.isFinal && (
                  <span className="flex items-center gap-1 text-[10px] uppercase font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                    <CheckCircle size={10} /> Final
                  </span>
                )}
              </div>

              {/* Acciones */}
              <div className="flex gap-2 mt-3 pt-2 border-t border-slate-100/50">
                <button
                  onClick={() => onViewVersion(version)}
                  className={`flex-1 flex items-center justify-center gap-1 text-[11px] py-1 rounded font-medium transition-colors ${
                    isViewing 
                      ? 'bg-blue-200 text-blue-800 cursor-default' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  disabled={isViewing}
                >
                  <Eye size={12} /> {isViewing ? 'Viendo' : 'Ver'}
                </button>

                {/* Solo mostrar acciones de edición si la ventana está abierta */}
                {isWindowOpen && (
                  <>
                    {!version.isFinal && (
                      <button
                        onClick={() => onMarkFinal(version.id)}
                        className="flex-1 flex items-center justify-center gap-1 text-[11px] py-1 rounded border border-green-200 text-green-700 hover:bg-green-50 font-medium transition-colors"
                        title="Marcar como oficial"
                      >
                        Hacer Final
                      </button>
                    )}
                    <button
                       onClick={() => onRestoreToEditor(version)}
                       className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                       title="Cargar en editor como copia"
                    >
                       <RotateCcw size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};