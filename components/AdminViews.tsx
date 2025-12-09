import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Users, FileCheck, AlertTriangle, Plus, Trash2, Edit, Search, 
  Download, Upload, CheckCircle, X, Filter, ChevronDown, Eye, Calendar, Lock, 
  Save, RefreshCw, Clock, CalendarDays, Power, FileSpreadsheet, ArrowRight
} from 'lucide-react';
import { User, AvailabilityVersion, Role, AcademicPeriod } from '../types';
import { downloadCSV, generateAvailabilityReport } from '../services/utils';
import AvailabilityScheduler from './AvailabilityScheduler';

// --- Dashboard Component ---
export const AdminDashboard = ({ 
  stats,
  period
}: { 
  stats: { totalInstructors: number, submitted: number, notSubmitted: number },
  period: AcademicPeriod
}) => {
  const data = [
    { name: 'Total', value: stats.totalInstructors },
    { name: 'Enviadas', value: stats.submitted },
    { name: 'Pendientes', value: stats.notSubmitted },
  ];

  return (
    <div className="space-y-6">
      {/* Configuration Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Calendar size={20} />
                </div>
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Periodo Académico Activo</p>
                    <p className="text-lg font-bold text-slate-800">{period.name}</p>
                </div>
            </div>
            <div className="text-right">
                <span className="text-xs text-slate-400 block">Inicia: {period.startDate}</span>
                <span className="text-xs text-slate-400 block">Termina: {period.endDate}</span>
            </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${period.isOpenForSubmission ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {period.isOpenForSubmission ? <CheckCircle size={20} /> : <Lock size={20} />}
            </div>
            <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Estado Ventana de Carga</p>
                <p className={`text-lg font-bold ${period.isOpenForSubmission ? 'text-green-700' : 'text-red-700'}`}>
                    {period.isOpenForSubmission ? 'Habilitada (Abierta)' : 'Deshabilitada (Cerrada)'}
                </p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Instructores</p>
            <p className="text-2xl font-bold text-slate-800">{stats.totalInstructors}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full">
            <FileCheck size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Con Versión Final</p>
            <p className="text-2xl font-bold text-slate-800">{stats.submitted}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Pendientes</p>
            <p className="text-2xl font-bold text-slate-800">{stats.notSubmitted}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96">
        <h3 className="text-lg font-bold mb-4 text-slate-800">Resumen de Entrega</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
            />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- Configuration Manager Component ---
export const ConfigurationManager = ({ 
    period, 
    onUpdate 
}: { 
    period: AcademicPeriod, 
    onUpdate: (p: AcademicPeriod) => void 
}) => {
    // Local state for editing form
    const [formState, setFormState] = useState({ ...period });
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Sync form if period changes externally
    React.useEffect(() => {
        setFormState({ ...period });
    }, [period]);

    const handleSaveDetails = () => {
        if (!formState.name || !formState.startDate || !formState.endDate) {
            setMsg({ type: 'error', text: 'Todos los campos del periodo son obligatorios.' });
            return;
        }
        if (formState.startDate > formState.endDate) {
            setMsg({ type: 'error', text: 'La fecha de inicio debe ser anterior a la fecha de fin.' });
            return;
        }

        onUpdate({ ...formState });
        setMsg({ type: 'success', text: 'Detalles del periodo actualizados correctamente.' });
        setTimeout(() => setMsg(null), 3000);
    };

    const handleNewPeriod = () => {
        const confirm = window.confirm(
            "¿Estás seguro de INICIAR UN NUEVO PERIODO?\n\n" +
            "1. Se generará un nuevo ID de sistema.\n" +
            "2. La ventana de carga se cerrará automáticamente.\n" +
            "3. Los instructores no verán las cargas del periodo anterior en su vista por defecto."
        );
        
        if (confirm) {
            const newId = `${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`;
            const newPeriod: AcademicPeriod = {
                ...formState,
                id: newId,
                name: formState.name + ' (Nuevo)',
                isOpenForSubmission: false // Rule: Close window on new period
            };
            onUpdate(newPeriod);
            setMsg({ type: 'success', text: `Nuevo periodo iniciado (ID: ${newId}). Ventana cerrada por seguridad.` });
        }
    };

    const toggleWindow = () => {
        const newState = !formState.isOpenForSubmission;
        // Updating directly for immediate feedback on toggle
        const updated = { ...formState, isOpenForSubmission: newState };
        setFormState(updated);
        onUpdate(updated);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Period Details */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-900 p-4 flex items-center justify-between">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <CalendarDays size={20} className="text-blue-400"/>
                            Definición del Periodo Académico
                        </h3>
                        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded font-mono">
                            ID: {period.id}
                        </span>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-start gap-2">
                             <Clock size={16} className="mt-0.5 shrink-0" />
                             <p>
                                El periodo activo define dónde se almacenarán las nuevas disponibilidades. 
                                Cambiar los detalles aquí afecta al periodo actual (ID: <strong>{period.id}</strong>).
                             </p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Periodo</label>
                            <input 
                                type="text" 
                                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formState.name}
                                onChange={e => setFormState({...formState, name: e.target.value})}
                                placeholder="Ej. Ciclo 2024-2 Regular"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Fecha de Inicio</label>
                                <input 
                                    type="date" 
                                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formState.startDate}
                                    onChange={e => setFormState({...formState, startDate: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Fecha de Fin</label>
                                <input 
                                    type="date" 
                                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formState.endDate}
                                    onChange={e => setFormState({...formState, endDate: e.target.value})}
                                />
                            </div>
                        </div>

                        {msg && (
                            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                {msg.type === 'error' ? <AlertTriangle size={16}/> : <CheckCircle size={16}/>}
                                {msg.text}
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                             <button 
                                onClick={handleNewPeriod}
                                className="text-slate-500 hover:text-blue-600 text-sm flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-50 transition-colors"
                             >
                                <RefreshCw size={16} />
                                Iniciar un Periodo Totalmente Nuevo
                             </button>

                             <button 
                                onClick={handleSaveDetails}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg shadow-sm font-medium flex items-center gap-2 transition-transform active:scale-95"
                             >
                                <Save size={18} />
                                Guardar Cambios del Periodo
                             </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Column 2: Window Control */}
            <div className="space-y-6">
                <div className={`rounded-xl shadow-sm border overflow-hidden ${formState.isOpenForSubmission ? 'bg-white border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`p-4 flex items-center justify-between ${formState.isOpenForSubmission ? 'bg-green-50' : 'bg-slate-200'}`}>
                         <h3 className={`font-bold flex items-center gap-2 ${formState.isOpenForSubmission ? 'text-green-800' : 'text-slate-700'}`}>
                            <Power size={20} />
                            Ventana de Carga
                         </h3>
                         <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${formState.isOpenForSubmission ? 'bg-green-200 text-green-800' : 'bg-slate-300 text-slate-600'}`}>
                             {formState.isOpenForSubmission ? 'ACTIVA' : 'INACTIVA'}
                         </span>
                    </div>
                    <div className="p-6 flex flex-col items-center text-center space-y-4">
                        <div className={`p-4 rounded-full ${formState.isOpenForSubmission ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                             {formState.isOpenForSubmission ? <CheckCircle size={48} /> : <Lock size={48} />}
                        </div>
                        
                        <p className="text-sm text-slate-600">
                            {formState.isOpenForSubmission 
                                ? "Los instructores pueden registrar y modificar sus disponibilidades para este periodo." 
                                : "El registro está cerrado. Los instructores solo pueden consultar información histórica."}
                        </p>

                        <label className="relative inline-flex items-center cursor-pointer mt-2">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={formState.isOpenForSubmission}
                                onChange={toggleWindow}
                            />
                            <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                        <span className="text-xs font-bold text-slate-400">Clic para cambiar estado</span>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-2 text-sm flex items-center gap-2">
                        <Clock size={16} /> Registro de Cambios
                    </h4>
                    <ul className="text-xs text-slate-500 space-y-2">
                        <li className="flex justify-between">
                            <span>Creación del Periodo</span>
                            <span className="font-mono">01/03/2024</span>
                        </li>
                        <li className="flex justify-between">
                            <span>Última apertura ventana</span>
                            <span className="font-mono">Hoy, 09:00</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

// --- Bulk Upload Modal Component ---
const BulkUploadModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState<{valid: number, errors: string[]} | null>(null);

    if (!isOpen) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleAnalyze = () => {
        if (!file) return;
        setAnalyzing(true);
        // Simulate analysis delay
        setTimeout(() => {
            setAnalyzing(false);
            setResults({
                valid: 50,
                errors: ["Fila 12: Correo electrónico inválido", "Fila 15: ID duplicado"]
            });
            setStep(2);
        }, 1500);
    };

    const handleProcess = () => {
        alert("Importación procesada con éxito (Simulación)");
        onClose();
        setStep(1);
        setFile(null);
        setResults(null);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold flex items-center gap-2">
                        <FileSpreadsheet size={20} className="text-green-400"/>
                        Carga Masiva de Instructores
                    </h3>
                    <button onClick={onClose}><X size={20} className="hover:text-slate-300" /></button>
                </div>
                
                <div className="p-6">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800">
                                <p className="font-bold mb-1">Paso 1: Seleccionar Archivo</p>
                                <p>Descarga la plantilla y sube un archivo .CSV o .XLSX con los datos de los instructores.</p>
                                <button className="text-blue-600 underline mt-2 text-xs font-bold">Descargar Plantilla Modelo</button>
                            </div>

                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                                <input type="file" id="fileUpload" className="hidden" accept=".csv,.xlsx" onChange={handleFileSelect} />
                                <label htmlFor="fileUpload" className="cursor-pointer block">
                                    <Upload size={32} className="mx-auto text-slate-400 mb-2" />
                                    <span className="text-slate-600 font-medium block">
                                        {file ? file.name : "Haz clic para subir o arrastra aquí"}
                                    </span>
                                    <span className="text-xs text-slate-400 block mt-1">Soporta CSV y Excel</span>
                                </label>
                            </div>

                            <button 
                                disabled={!file || analyzing}
                                onClick={handleAnalyze}
                                className={`w-full py-3 rounded-lg font-bold text-white transition-all ${!file ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-sm'}`}
                            >
                                {analyzing ? 'Analizando archivo...' : 'Analizar y Validar'}
                            </button>
                        </div>
                    )}

                    {step === 2 && results && (
                        <div className="space-y-6">
                             <div className="flex items-center gap-4">
                                 <div className="flex-1 bg-green-50 border border-green-200 p-4 rounded-xl text-center">
                                     <p className="text-3xl font-bold text-green-700">{results.valid}</p>
                                     <p className="text-xs font-bold text-green-800 uppercase">Válidos</p>
                                 </div>
                                 <div className="flex-1 bg-red-50 border border-red-200 p-4 rounded-xl text-center">
                                     <p className="text-3xl font-bold text-red-700">{results.errors.length}</p>
                                     <p className="text-xs font-bold text-red-800 uppercase">Errores</p>
                                 </div>
                             </div>

                             {results.errors.length > 0 && (
                                 <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                                     <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Detalle de Errores:</p>
                                     <ul className="space-y-1">
                                         {results.errors.map((err, i) => (
                                             <li key={i} className="text-xs text-red-600 flex items-start gap-1">
                                                 <span className="mt-0.5">•</span> {err}
                                             </li>
                                         ))}
                                     </ul>
                                 </div>
                             )}

                             <div className="flex gap-3 pt-2">
                                 <button onClick={() => {setStep(1); setFile(null); setResults(null);}} className="flex-1 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium">
                                     Cancelar / Volver
                                 </button>
                                 <button onClick={handleProcess} className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm text-sm font-bold flex justify-center items-center gap-2">
                                     Procesar Importación <ArrowRight size={16} />
                                 </button>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Instructor Manager Component ---
export const InstructorManager = ({ 
  instructors, 
  onAdd, 
  onUpdate,
  onDelete,
  onDownloadReport,
  availabilities,
  period
}: { 
  instructors: User[], 
  onAdd: (u: User) => void, 
  onUpdate: (u: User) => void,
  onDelete: (id: string) => void,
  onDownloadReport: () => void,
  availabilities: AvailabilityVersion[],
  period: AcademicPeriod
}) => {
  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'final' | 'draft' | 'none'>('all');
  const [sortField, setSortField] = useState<'id' | 'name'>('name');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingInstructorId, setViewingInstructorId] = useState<string | null>(null);

  // Form State
  const [userForm, setUserForm] = useState<Partial<User>>({ role: Role.INSTRUCTOR, active: true });

  // Helper Logic
  const getInstructorStatus = (userId: string) => {
      const userVersions = availabilities.filter(a => a.instructorId === userId && a.periodId === period.id);
      if (userVersions.length === 0) return 'none';
      if (userVersions.some(a => a.isFinal)) return 'final';
      return 'draft';
  };

  const processedInstructors = useMemo(() => {
    let result = instructors.filter(i => 
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterStatus !== 'all') {
        result = result.filter(i => getInstructorStatus(i.id) === filterStatus);
    }

    result.sort((a, b) => {
        if (sortField === 'name') return a.name.localeCompare(b.name);
        return a.id.localeCompare(b.id);
    });

    return result;
  }, [instructors, searchTerm, filterStatus, sortField, availabilities, period.id]);

  // Handlers
  const handleOpenAdd = () => {
      setEditingUser(null);
      setUserForm({ role: Role.INSTRUCTOR, active: true, id: '', name: '', email: '', dni: '' });
      setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
      setEditingUser(user);
      setUserForm({...user});
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(userForm.name && userForm.email && userForm.id && userForm.dni) {
      if (editingUser) {
          onUpdate(userForm as User);
      } else {
          onAdd(userForm as User);
      }
      setIsModalOpen(false);
    }
  };

  // View Details Modal
  const ViewingModal = () => {
      if (!viewingInstructorId) return null;
      const targetUser = instructors.find(u => u.id === viewingInstructorId);
      if (!targetUser) return null;

      const userVersions = availabilities.filter(a => a.instructorId === targetUser.id && a.periodId === period.id);

      return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Eye size={20} className="text-blue-400"/>
                            Detalle de Instructor: {targetUser.name}
                        </h3>
                        <p className="text-xs text-slate-400">ID: {targetUser.id} • Periodo: {period.name}</p>
                    </div>
                    <button onClick={() => setViewingInstructorId(null)} className="hover:bg-slate-700 p-2 rounded transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <AvailabilityScheduler 
                        user={targetUser}
                        period={period}
                        onSave={() => {}}
                        onMarkFinal={() => {}}
                        previousVersions={userVersions}
                        readOnly={true} // FORCE READ ONLY FOR ADMIN VIEW
                    />
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col xl:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 flex-1">
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar por ID, Nombre o Email..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-2">
                <div className="relative">
                    <select 
                        className="appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                    >
                        <option value="all">Todos los Estados</option>
                        <option value="final">Con Versión Final</option>
                        <option value="draft">Borrador / Pendiente Final</option>
                        <option value="none">Sin Disponibilidad</option>
                    </select>
                    <Filter className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
                </div>

                <div className="relative">
                    <select 
                         className="appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                         value={sortField}
                         onChange={(e) => setSortField(e.target.value as any)}
                    >
                        <option value="name">Ordenar por Nombre</option>
                        <option value="id">Ordenar por ID</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
                </div>
            </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap items-center">
           <button 
             onClick={() => setIsBulkModalOpen(true)}
             className="flex items-center space-x-2 px-3 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-50 text-sm"
           >
             <Upload size={16} />
             <span className="hidden sm:inline">Carga Masiva</span>
           </button>
           <button 
            onClick={onDownloadReport}
            className="flex items-center space-x-2 px-3 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-50 text-sm"
           >
             <Download size={16} />
             <span className="hidden sm:inline">Reporte</span>
           </button>
           <button 
             onClick={handleOpenAdd}
             className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm text-sm"
           >
             <Plus size={16} />
             <span>Nuevo Instructor</span>
           </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-600 text-sm">ID</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Nombre</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-sm hidden md:table-cell">Email</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Estado Disponibilidad</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {processedInstructors.map(inst => {
              const status = getInstructorStatus(inst.id);
              return (
              <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-600 font-mono">{inst.id}</td>
                <td className="px-6 py-4 text-sm text-slate-800 font-medium">{inst.name}</td>
                <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell">{inst.email}</td>
                <td className="px-6 py-4 text-sm">
                   {status === 'final' && 
                     <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                        <CheckCircle size={12}/> Final
                     </span>
                   }
                   {status === 'draft' && 
                     <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                        <Edit size={12}/> Borrador
                     </span>
                   }
                   {status === 'none' && 
                     <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        Pendiente
                     </span>
                   }
                </td>
                <td className="px-6 py-4 text-sm text-right flex justify-end gap-2">
                  <button 
                    onClick={() => setViewingInstructorId(inst.id)} 
                    className="text-slate-500 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded"
                    title="Ver Disponibilidad e Historial"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    onClick={() => handleOpenEdit(inst)} 
                    className="text-slate-500 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded"
                    title="Editar Datos"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => onDelete(inst.id)} 
                    className="text-slate-500 hover:text-red-600 p-1.5 hover:bg-red-50 rounded"
                    title="Eliminar Instructor"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            )})}
            {processedInstructors.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                        <Search size={32} className="opacity-20"/>
                        <p>No se encontraron instructores con los filtros actuales</p>
                    </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Details Modal */}
      <ViewingModal />
      
      {/* Bulk Upload Modal */}
      <BulkUploadModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} />

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
             <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="text-lg font-bold text-slate-800">
                     {editingUser ? 'Editar Instructor' : 'Agregar Instructor'}
                 </h3>
                 <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
             </div>
             <form onSubmit={handleSubmit} className="p-6 space-y-4">
               <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">ID (Usuario)</label>
                 <input 
                    required 
                    disabled={!!editingUser}
                    className={`w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none ${editingUser ? 'bg-slate-100 text-slate-500' : ''}`}
                    value={userForm.id || ''} 
                    onChange={e => setUserForm({...userForm, id: e.target.value})} 
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo</label>
                 <input required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={userForm.name || ''} onChange={e => setUserForm({...userForm, name: e.target.value})} />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                 <input type="email" required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={userForm.email || ''} onChange={e => setUserForm({...userForm, email: e.target.value})} />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">DNI (Recuperación)</label>
                 <input required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={userForm.dni || ''} onChange={e => setUserForm({...userForm, dni: e.target.value})} />
               </div>
               
               {editingUser && (
                   <div className="flex items-center gap-2 mt-2">
                       <input 
                         type="checkbox" 
                         id="isActive"
                         checked={userForm.active} 
                         onChange={e => setUserForm({...userForm, active: e.target.checked})}
                         className="w-4 h-4 text-blue-600"
                       />
                       <label htmlFor="isActive" className="text-sm text-slate-700">Usuario Activo</label>
                   </div>
               )}

               <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-medium">Cancelar</button>
                 <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium shadow-sm">
                     {editingUser ? 'Guardar Cambios' : 'Crear Instructor'}
                 </button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};