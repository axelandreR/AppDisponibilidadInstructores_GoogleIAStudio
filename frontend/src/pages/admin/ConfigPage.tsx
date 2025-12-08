import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/auth.types';
import { periodService } from '../../services/period.service';
import { AcademicPeriod } from '../../types/availability.types';
import { Button } from '../../components/ui/Button';
import { Calendar, Lock, Unlock, Save, AlertTriangle } from 'lucide-react';

export const ConfigPage = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<AcademicPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '' });

  // Permisos
  const canEdit = user?.role === Role.SUPER_ADMIN || user?.permissions?.canManageConfig;

  useEffect(() => {
    loadPeriod();
  }, []);

  const loadPeriod = async () => {
    try {
      const data = await periodService.getActive();
      setPeriod(data);
      setFormData({
        name: data.name,
        startDate: data.startDate, // Asumiendo formato YYYY-MM-DD
        endDate: data.endDate
      });
    } catch (e) {
      console.error("Error loading period");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWindow = async () => {
    if (!period || !canEdit) return;
    
    // Optimistic update
    const newState = !period.isOpenForSubmission;
    setPeriod({ ...period, isOpenForSubmission: newState });

    try {
      await periodService.toggleWindow(newState);
    } catch (e) {
      alert("Error al cambiar estado de la ventana");
      setPeriod({ ...period, isOpenForSubmission: !newState }); // Rollback
    }
  };

  const handleUpdatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setSaving(true);
    try {
      const updated = await periodService.updatePeriod(formData);
      setPeriod({ ...updated, isOpenForSubmission: period?.isOpenForSubmission || false });
      alert("Configuración actualizada correctamente");
    } catch (e) {
      alert("Error al actualizar periodo");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Cargando configuración...</div>;
  if (!period) return <div>No hay información de periodo disponible.</div>;

  if (!canEdit) {
    return (
        <div className="flex flex-col items-center justify-center h-96 text-slate-500">
            <AlertTriangle size={48} className="text-orange-400 mb-4" />
            <h2 className="text-xl font-bold">Acceso Restringido</h2>
            <p>No tienes permisos para modificar la configuración del sistema.</p>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Configuración del Sistema</h2>
        <p className="text-slate-500 text-sm mt-1">Gestión del Ciclo Académico y Control de Acceso.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Columna 1: Formulario Periodo */}
        <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Calendar size={20}/></div>
                    <h3 className="font-bold text-slate-700">Detalles del Periodo</h3>
                </div>

                <form onSubmit={handleUpdatePeriod} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Ciclo</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Inicio</label>
                            <input 
                                type="date" 
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.startDate}
                                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Fin</label>
                            <input 
                                type="date" 
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.endDate}
                                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" isLoading={saving} className="flex items-center gap-2">
                            <Save size={18} />
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </div>
        </div>

        {/* Columna 2: Ventana de Carga */}
        <div className="space-y-6">
            <div className={`rounded-xl border shadow-sm p-6 flex flex-col items-center text-center ${period.isOpenForSubmission ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className={`p-4 rounded-full mb-4 ${period.isOpenForSubmission ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                    {period.isOpenForSubmission ? <Unlock size={32} /> : <Lock size={32} />}
                </div>
                
                <h3 className={`font-bold text-lg mb-1 ${period.isOpenForSubmission ? 'text-green-800' : 'text-red-800'}`}>
                    Ventana {period.isOpenForSubmission ? 'ABIERTA' : 'CERRADA'}
                </h3>
                
                <p className="text-xs text-slate-600 mb-6 px-4">
                    {period.isOpenForSubmission 
                        ? "Los instructores pueden registrar y modificar su disponibilidad." 
                        : "El registro está bloqueado. Solo lectura."}
                </p>

                <button 
                    onClick={handleToggleWindow}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-bold transition-colors ${period.isOpenForSubmission ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
                >
                    {period.isOpenForSubmission ? 'Cerrar Ventana' : 'Abrir Ventana'}
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-xs text-slate-500 uppercase mb-3">Información Técnica</h4>
                <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between">
                        <span>Periodo ID:</span>
                        <span className="font-mono">{period.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Estado:</span>
                        <span className="font-semibold text-blue-600">ACTIVO</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};