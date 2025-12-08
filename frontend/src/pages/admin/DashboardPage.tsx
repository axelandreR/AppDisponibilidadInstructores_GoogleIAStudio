import React, { useEffect, useState } from 'react';
import { 
  Users, 
  FileCheck, 
  AlertCircle, 
  Calendar, 
  Lock, 
  Unlock, 
  Download,
  RefreshCw 
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { periodService } from '../../services/period.service';
import { reportService } from '../../services/report.service';
import { DashboardStats } from '../../types/admin.types';
import { AcademicPeriod } from '../../types/availability.types';
import { Button } from '../../components/ui/Button';

export const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [period, setPeriod] = useState<AcademicPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const activePeriod = await periodService.getActive();
      setPeriod(activePeriod);
      
      if (activePeriod) {
        const dashboardStats = await adminService.getDashboardStats(activePeriod.id);
        setStats(dashboardStats);
      }
    } catch (error) {
      console.error("Error loading dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownloadConsolidated = async () => {
    if (!period) return;
    try {
      setDownloading(true);
      await reportService.downloadConsolidated(period.id);
    } catch (error) {
      alert("Error al descargar el reporte");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Cargando métricas del sistema...</div>;
  }

  if (!period) {
    return <div className="p-8 text-center text-red-500">No hay periodo académico activo.</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard Administrativo</h2>
          <p className="text-slate-500 text-sm mt-1">Visión general del proceso de disponibilidad.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadData} title="Recargar datos">
            <RefreshCw size={18} />
          </Button>
          <Button onClick={handleDownloadConsolidated} isLoading={downloading} className="flex items-center gap-2">
            <Download size={18} />
            Descargar Consolidado
          </Button>
        </div>
      </div>

      {/* Period Status Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <Calendar size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase">Periodo Activo</h3>
            <p className="text-2xl font-bold text-slate-800">{period.name}</p>
            <p className="text-xs text-slate-400">ID: {period.id}</p>
          </div>
        </div>

        <div className="h-10 w-px bg-slate-200 hidden md:block"></div>

        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${period.isOpenForSubmission ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {period.isOpenForSubmission ? <Unlock size={24} /> : <Lock size={24} />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase">Ventana de Carga</h3>
            <p className={`text-xl font-bold ${period.isOpenForSubmission ? 'text-green-600' : 'text-red-600'}`}>
              {period.isOpenForSubmission ? 'ABIERTA' : 'CERRADA'}
            </p>
            <p className="text-xs text-slate-400">
              {period.isOpenForSubmission ? 'Instructores pueden editar' : 'Edición bloqueada'}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Users} 
          label="Total Instructores" 
          value={stats?.totalInstructors || 0} 
          color="blue" 
        />
        <StatCard 
          icon={FileCheck} 
          label="Completados (Final)" 
          value={stats?.submittedFinal || 0} 
          color="green" 
        />
        <StatCard 
          icon={AlertCircle} 
          label="En Borrador" 
          value={stats?.draftOnly || 0} 
          color="orange" 
        />
        <StatCard 
          icon={AlertCircle} 
          label="Pendientes" 
          value={stats?.pending || 0} 
          color="slate" 
        />
      </div>

      {/* Progress Bar Visual */}
      {stats && stats.totalInstructors > 0 && (
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Progreso de Entrega</h3>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
                <div 
                  className="bg-green-500 h-full transition-all duration-1000" 
                  style={{ width: `${(stats.submittedFinal / stats.totalInstructors) * 100}%` }}
                  title="Finalizados"
                />
                <div 
                  className="bg-orange-400 h-full transition-all duration-1000" 
                  style={{ width: `${(stats.draftOnly / stats.totalInstructors) * 100}%` }}
                  title="Borradores"
                />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>0%</span>
                <span>{Math.round((stats.submittedFinal / stats.totalInstructors) * 100)}% Completado</span>
                <span>100%</span>
            </div>
         </div>
      )}
    </div>
  );
};

// Helper Component for Stats
const StatCard = ({ icon: Icon, label, value, color }: any) => {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    slate: "bg-slate-50 text-slate-600",
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
};