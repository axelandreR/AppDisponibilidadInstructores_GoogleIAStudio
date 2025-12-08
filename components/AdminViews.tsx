import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Users, FileCheck, AlertCircle, Calendar, Lock, Unlock, Download, RefreshCw, 
  Search, Filter, Eye, Save, AlertTriangle, CheckCircle, Power, Upload, ArrowRight, X, Edit, Trash2
} from 'lucide-react';
import { User, AcademicPeriod, Role, DashboardStats, InstructorRow, FilterStatus } from '../types';
import { adminService } from '../services/admin.service';
import { periodService } from '../services/period.service';
import { reportService } from '../services/report.service';
import AvailabilityScheduler from './AvailabilityScheduler';

// --- Dashboard Component ---
export const AdminDashboard = () => {
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

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando métricas...</div>;
  if (!period) return <div className="p-8 text-center text-red-500">No hay periodo activo.</div>;

  const chartData = stats ? [
    { name: 'Total', value: stats.totalInstructors },
    { name: 'Finalizados', value: stats.submittedFinal },
    { name: 'Borrador', value: stats.draftOnly },
    { name: 'Pendientes', value: stats.pending },
  ] : [];

  return (
    <div className="space-y-8">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard Administrativo</h2>
          <p className="text-slate-500 text-sm mt-1">Visión general del periodo {period.name}.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <RefreshCw size={18} />
          </button>
          <button 
            onClick={handleDownloadConsolidated} 
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Download size={18} />
            {downloading ? 'Descargando...' : 'Descargar Consolidado'}
          </button>
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
            <div className="text-xs text-slate-400 mt-1 flex gap-2">
                <span>Inicio: {period.startDate}</span>
                <span>Fin: {period.endDate}</span>
            </div>
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
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Instructores" value={stats?.totalInstructors || 0} color="blue" />
        <StatCard icon={FileCheck} label="Completados (Final)" value={stats?.submittedFinal || 0} color="green" />
        <StatCard icon={AlertCircle} label="En Borrador" value={stats?.draftOnly || 0} color="orange" />
        <StatCard icon={AlertCircle} label="Pendientes" value={stats?.pending || 0} color="slate" />
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
        <h3 className="text-lg font-bold mb-4 text-slate-800">Progreso de Entregas</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- Helper Component for Stats ---
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

// --- Instructor Manager Component ---
export const InstructorManager = () => {
    const [instructors, setInstructors] = useState<InstructorRow[]>([]);
    const [filtered, setFiltered] = useState<InstructorRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [periodId, setPeriodId] = useState<string>('');
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

    // Viewing State
    const [viewingInstructor, setViewingInstructor] = useState<InstructorRow | null>(null);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const p = await periodService.getActive();
            setPeriodId(p.id);
            const data = await adminService.getInstructorsList();
            setInstructors(data);
            setLoading(false);
        };
        init();
    }, []);

    useEffect(() => {
        let result = instructors;
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(i => 
                i.name.toLowerCase().includes(lower) || 
                i.id.toLowerCase().includes(lower) || 
                i.email.toLowerCase().includes(lower)
            );
        }
        if (statusFilter !== 'ALL') {
            if (statusFilter === 'FINAL') result = result.filter(i => i.hasFinalVersion);
            if (statusFilter === 'DRAFT') result = result.filter(i => i.hasDraft && !i.hasFinalVersion);
            if (statusFilter === 'PENDING') result = result.filter(i => !i.hasDraft);
        }
        setFiltered(result);
    }, [instructors, searchTerm, statusFilter]);

    const handleDownloadReport = async (instructorId: string) => {
        if (!periodId) return;
        try {
            await reportService.downloadIndividual(instructorId, periodId);
        } catch (e) {
            alert("Error descargando reporte");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Gestión de Instructores</h2>
                <div className="text-sm text-slate-500">Periodo: <span className="font-semibold">{periodId}</span></div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por ID, nombre o email..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={20} className="text-slate-400" />
                    <select 
                        className="border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                    >
                        <option value="ALL">Todos los Estados</option>
                        <option value="FINAL">Completado (Final)</option>
                        <option value="DRAFT">En Progreso (Borrador)</option>
                        <option value="PENDING">Pendiente</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">ID</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Instructor</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Estado</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">Cargando...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">No hay resultados</td></tr>
                        ) : (
                            filtered.map((inst) => (
                                <tr key={inst.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{inst.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-slate-900">{inst.name}</div>
                                        <div className="text-xs text-slate-500">{inst.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {inst.hasFinalVersion ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Completado</span>
                                        ) : inst.hasDraft ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Borrador</span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Pendiente</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => setViewingInstructor(inst)} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded hover:bg-blue-50">
                                            <Eye size={18} />
                                        </button>
                                        <button onClick={() => handleDownloadReport(inst.id)} className="p-2 text-slate-400 hover:text-green-600 bg-slate-50 rounded hover:bg-green-50">
                                            <Download size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Read Only Modal (Placeholder for actual Scheduler reuse) */}
            {viewingInstructor && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-900 text-white rounded-t-xl">
                            <h3 className="font-bold">Vista Previa: {viewingInstructor.name}</h3>
                            <button onClick={() => setViewingInstructor(null)}><X size={20}/></button>
                        </div>
                        <div className="flex-1 p-8 flex items-center justify-center bg-slate-50">
                             <p className="text-slate-500">
                                Aquí se renderizaría el componente <code>AvailabilityScheduler</code> en modo <code>readOnly=true</code>.
                                <br/>Cargando datos del periodo <strong>{periodId}</strong>.
                             </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Config Manager Component ---
export const ConfigurationManager = () => {
    const [period, setPeriod] = useState<AcademicPeriod | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const p = await periodService.getActive();
        setPeriod(p);
        setFormData({ name: p.name, startDate: p.startDate, endDate: p.endDate });
        setLoading(false);
    };

    const handleToggle = async () => {
        if(!period) return;
        const newState = !period.isOpenForSubmission;
        setPeriod({ ...period, isOpenForSubmission: newState });
        await periodService.toggleWindow(newState);
    };

    const handleSave = async () => {
        if(!period) return;
        await periodService.updatePeriod(formData);
        alert("Configuración guardada");
    };

    if(loading) return <div>Cargando...</div>;
    if(!period) return <div>Error</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Calendar size={20} className="text-blue-500"/> Detalles del Periodo
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label>
                            <input className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Inicio</label>
                                <input type="date" className="w-full border p-2 rounded" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Fin</label>
                                <input type="date" className="w-full border p-2 rounded" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                            </div>
                        </div>
                        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
                            <Save size={18} /> Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className={`p-6 rounded-xl border flex flex-col items-center text-center ${period.isOpenForSubmission ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className={`p-4 rounded-full mb-4 ${period.isOpenForSubmission ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                        {period.isOpenForSubmission ? <Unlock size={32} /> : <Lock size={32} />}
                    </div>
                    <h3 className={`font-bold text-lg mb-2 ${period.isOpenForSubmission ? 'text-green-800' : 'text-red-800'}`}>
                        Ventana {period.isOpenForSubmission ? 'ABIERTA' : 'CERRADA'}
                    </h3>
                    <button 
                        onClick={handleToggle}
                        className={`w-full py-2 px-4 rounded-lg text-sm font-bold text-white transition-colors ${period.isOpenForSubmission ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        {period.isOpenForSubmission ? 'Cerrar Ventana' : 'Abrir Ventana'}
                    </button>
                </div>
            </div>
        </div>
    );
};
