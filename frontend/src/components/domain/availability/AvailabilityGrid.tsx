import React from 'react';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../../../utils/constants';
import clsx from 'clsx';

interface AvailabilityGridProps {
  selectedSlots: Set<string>;
  onToggleSlot: (day: string, time: string) => void;
  readOnly?: boolean;
  isViewingHistory?: boolean;
}

export const AvailabilityGrid: React.FC<AvailabilityGridProps> = ({
  selectedSlots,
  onToggleSlot,
  readOnly = false,
  isViewingHistory = false,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Header Visual */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          {isViewingHistory ? 'Visualizando Versión Histórica' : 'Editor de Disponibilidad'}
          {readOnly && !isViewingHistory && <span className="text-xs font-normal text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100">(Modo Lectura)</span>}
        </h3>
        
        {/* Leyenda */}
        <div className="flex gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-white border border-slate-300 rounded"></div> Libre
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-600 rounded"></div> Seleccionado
          </div>
        </div>
      </div>

      {/* Grid Scrollable Area */}
      <div className="overflow-auto flex-1 p-4">
        <div className="min-w-[800px]">
          {/* Header Row (Días) */}
          <div className="grid grid-cols-8 gap-1 mb-2 sticky top-0 z-10 bg-white">
            <div className="text-center font-bold text-slate-400 text-xs py-2">Hora</div>
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="text-center font-bold text-slate-700 bg-slate-100 rounded py-2 text-sm uppercase tracking-wide">
                {day}
              </div>
            ))}
          </div>

          {/* Time Rows */}
          {TIME_SLOTS.map((time) => (
            <div key={time} className="grid grid-cols-8 gap-1 mb-1">
              {/* Etiqueta de Hora */}
              <div className="text-center text-xs text-slate-400 py-2 -mt-1 font-mono">{time}</div>
              
              {/* Celdas por Día */}
              {DAYS_OF_WEEK.map((day) => {
                const slotId = `${day}-${time}`;
                const isSelected = selectedSlots.has(slotId);

                return (
                  <div
                    key={slotId}
                    onClick={() => !readOnly && onToggleSlot(day, time)}
                    className={clsx(
                      "h-8 rounded border transition-all duration-150 ease-in-out",
                      isSelected 
                        ? "bg-blue-600 border-blue-700 shadow-sm" 
                        : "bg-white border-slate-100 hover:border-slate-300",
                      !readOnly 
                        ? "cursor-pointer hover:scale-[1.02]" 
                        : "cursor-default opacity-90",
                      // Estilos específicos para modo lectura/bloqueado
                      readOnly && !isSelected && "bg-slate-50"
                    )}
                    title={isSelected ? `${day} ${time} - Disponible` : `${day} ${time}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};