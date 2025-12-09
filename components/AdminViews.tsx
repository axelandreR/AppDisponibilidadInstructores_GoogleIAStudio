import React, { useState, useMemo } from 'react';
import {
  Users, FileCheck, AlertCircle, Plus, Trash2, Edit, Search,
  Download, Upload, CheckCircle, X, Filter, ChevronDown, Eye, Calendar,
  Clock, FileSpreadsheet, ArrowRight, ShieldAlert, BadgeCheck, Mail, Lock
} from 'lucide-react';
import { User, AvailabilityVersion, Role, AcademicPeriod } from '../types';
import AvailabilityScheduler from './AvailabilityScheduler';

// --- Helper Functions for Stats ---
const calculateHours = (version: AvailabilityVersion | undefined): number => {
  if (!version || !version.slots) return 0;
  return version.slots.length * 0.5;
};

const calculateDays = (version: AvailabilityVersion | undefined): number => {
  if (!version || !version.slots) return 0;
  const days = new Set(version.slots.map(s => s.split('-')[0]));
  return days.size;
};

// --- Helper Functions for CSV ---
const parseCSV = (content: string) => {
  const lines = content.split('\n');
  if (lines.length < 2) return { headers: [], data: [] };
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const data = lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(',');
    return headers.reduce((obj, header, i) => {
      obj[header] = values[i]?.trim();
      return obj;
    }, {} as any);
  });
  return { headers, data };
};

// --- Components ---

// 1. DASHBOARD COMPONENT (Operational View + Availability Monitor)
export const AdminDashboard = ({
  stats,
  period,
  instructors,
  availabilities
}: {
  stats: { totalInstructors: number, submitted: number, notSubmitted: number },
  period: AcademicPeriod,
  instructors: User[],
  availabilities: AvailabilityVersion[]
}) => {
  // Local state for the monitoring table
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'pending'>('all');
  const [viewingInstructorId, setViewingInstructorId] = useState<string | null>(null);

  const getInstructorStatus = (userId: string) => {
    const userVersions = availabilities.filter(a => a.instructorId === userId && a.periodId === period.id);
    return userVersions.some(a => a.isFinal) ? 'submitted' : 'pending';
  };

  const getLastUpdate = (userId: string) => {
    const userVersions = availabilities.filter(a => a.instructorId === userId && a.periodId === period.id);
    if (userVersions.length === 0) return null;
    return userVersions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  };

  const processedData = useMemo(() => {
    let data = instructors.map(inst => {
      const status = getInstructorStatus(inst.id);
      const lastVersion = getLastUpdate(inst.id);
      const versionCount = availabilities.filter(a => a.instructorId === inst.id && a.periodId === period.id).length;
      const hours = calculateHours(lastVersion || undefined);
      const days = calculateDays(lastVersion || undefined);
      return { ...inst, status, lastVersion, versionCount, hours, days };
    });

    if (searchTerm) {
      data = data.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      data = data.filter(d => d.status === filterStatus);
    }

    return data;
  }, [instructors, searchTerm, filterStatus, availabilities, period.id]);

  // View Details Modal (Read Only)
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
                <Eye size={20} className="text-blue-400" />
                Monitoreo: {targetUser.name}
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
              onSave={() => { }} // Read only
              onMarkFinal={() => { }} // Read only
              previousVersions={userVersions}
              readOnly={true}
            />
          </div>
        </div>
      </div>
    );
  };

  const submittedPct = stats.totalInstructors > 0 ? Math.round((stats.submitted / stats.totalInstructors) * 100) : 0;
  const notSubmittedPct = stats.totalInstructors > 0 ? Math.round((stats.notSubmitted / stats.totalInstructors) * 100) : 0;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">

      {/* 1. KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Instructors */}
        <div className="bg-[#EBF5FF] p-6 rounded-2xl border border-blue-100 flex flex-col justify-between h-32 relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
          <div className="z-10">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Users size={18} />
              <span className="font-semibold text-sm">Total Instructores</span>
            </div>
            <p className="text-4xl font-bold text-slate-800">{stats.totalInstructors}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-200/50 rounded-full group-hover:scale-110 transition-transform"></div>
        </div>

        {/* Con Disponibilidad */}
        <div className="bg-[#EBFDF5] p-6 rounded-2xl border border-green-100 flex flex-col justify-between h-32 relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
          <div className="z-10">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CheckCircle size={18} />
              <span className="font-semibold text-sm">Disponibilidad Cargada</span>
            </div>
            <div>
              <span className="text-4xl font-bold text-slate-800 block">{stats.submitted}</span>
              <span className="text-sm font-medium text-green-700">{submittedPct}% del total</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-green-200/50 rounded-full group-hover:scale-110 transition-transform"></div>
        </div>

        {/* Sin Disponibilidad */}
        <div className="bg-[#FFF1F2] p-6 rounded-2xl border border-red-100 flex flex-col justify-between h-32 relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
          <div className="z-10">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertCircle size={18} />
              <span className="font-semibold text-sm">Pendientes de Carga</span>
            </div>
            <div>
              <span className="text-4xl font-bold text-slate-800 block">{stats.notSubmitted}</span>
              <span className="text-sm font-medium text-red-700">{notSubmittedPct}% del total</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-200/50 rounded-full group-hover:scale-110 transition-transform"></div>
        </div>
      </div>

      {/* 2. Consolidation Banner */}
      <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 p-6 rounded-2xl border border-violet-100 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Reporte de Disponibilidad Consolidada</h3>
          <p className="text-slate-500 text-sm">Descarga el archivo maestro con todas las horas y días seleccionados por los instructores.</p>
        </div>
        <button className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-fuchsia-200/50 transition-all active:scale-95 flex items-center gap-2">
          <FileSpreadsheet size={20} />
          Descargar Excel
        </button>
      </div>

      {/* 3. Monitoring Table (Moved from InstructorManager) */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Avance de Carga</h3>
            <p className="text-sm text-slate-500">Monitoreo en tiempo real del proceso.</p>
          </div>

          {/* Table Filters */}
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar instructor..."
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-48"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
            >
              <option value="all">Todos</option>
              <option value="submitted">Completados</option>
              <option value="pending">Pendientes</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Instructor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado Carga</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Última Act.</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Métricas</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {processedData.map(inst => (
                <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-700">{inst.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{inst.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    {inst.status === 'submitted' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                        <CheckCircle size={12} /> Completado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                        <Clock size={12} /> Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {inst.lastVersion
                      ? new Date(inst.lastVersion.timestamp).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1"><Clock size={14} className="text-blue-400" /> {inst.hours}h</span>
                      <span className="flex items-center gap-1"><Calendar size={14} className="text-green-400" /> {inst.days}d</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setViewingInstructorId(inst.id)}
                      className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ViewingModal />
    </div>
  );
};

// 2. INSTRUCTOR MANAGER COMPONENT (User Management / CRUD)
export const InstructorManager = ({
  instructors,
  onAdd,
  onUpdate,
  onDelete
}: {
  instructors: User[],
  onAdd: (u: User) => void,
  onUpdate: (u: User) => void,
  onDelete: (id: string) => void
}) => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<Partial<User>>({});

  // CRUD Data Processing
  const usersList = useMemo(() => {
    return instructors.filter(u =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [instructors, searchTerm]);

  // Handlers
  const handleEdit = (u: User) => {
    setEditingUser(u);
    setUserForm({ ...u });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setUserForm({ role: Role.INSTRUCTOR, active: true, id: '', name: '', email: '', dni: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) onUpdate(userForm as User);
    else onAdd(userForm as User);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Instructores</h2>
          <p className="text-slate-500 text-sm">Administra las cuentas y accesos de los instructores del sistema.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
          >
            <Upload size={18} /> Carga Masiva
          </button>
          <button
            onClick={handleCreate}
            className="bg-purple-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 flex items-center gap-2"
          >
            <Plus size={18} /> Nuevo Instructor
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm max-w-lg">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 outline-none text-slate-600"
            placeholder="Buscar por ID, Nombre o Email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nombre</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Email</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Rol</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Estado</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {usersList.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 text-sm font-mono text-slate-600">{user.id}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-800">{user.name}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-bold capitalize ${user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                    }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${user.active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-500'
                    }`}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-10 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-2 border border-slate-200 rounded-lg hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all"
                    >
                      <Edit size={16} className="text-slate-600" />
                    </button>
                    <button
                      onClick={() => onDelete(user.id)}
                      className="p-2 border border-slate-200 rounded-lg hover:bg-white hover:border-red-200 hover:text-red-600 hover:shadow-sm transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {usersList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  No se encontraron usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal User Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-bold mb-4">{editingUser ? 'Editar' : 'Nuevo'} Usuario</h3>
            <div className="space-y-4">
              <input className="w-full border p-2 rounded" placeholder="ID (ej. INST001)" value={userForm.id || ''} onChange={e => setUserForm({ ...userForm, id: e.target.value })} disabled={!!editingUser} />
              <input className="w-full border p-2 rounded" placeholder="Nombre Completo" value={userForm.name || ''} onChange={e => setUserForm({ ...userForm, name: e.target.value })} />
              <input className="w-full border p-2 rounded" placeholder="Email" value={userForm.email || ''} onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
              <input className="w-full border p-2 rounded" placeholder="DNI" value={userForm.dni || ''} onChange={e => setUserForm({ ...userForm, dni: e.target.value })} />

              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={userForm.active} onChange={e => setUserForm({ ...userForm, active: e.target.checked })} />
                  Usuario Activo
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={userForm.role === Role.ADMIN} onChange={e => setUserForm({ ...userForm, role: e.target.checked ? Role.ADMIN : Role.INSTRUCTOR })} />
                  Es Administrador
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500">Cancelar</button>
                <button onClick={handleSubmit} className="px-4 py-2 bg-purple-600 text-white rounded font-bold">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} onProcess={(users) => {
        // Mock processing: In real app this would call API
        users.forEach(u => onAdd(u)); // Add them to state locally
        setIsBulkModalOpen(false);
      }} />
    </div>
  );
};

// 3. BULK UPLOAD MODAL (Logic Implemented)
const BulkUploadModal = ({ isOpen, onClose, onProcess }: { isOpen: boolean, onClose: () => void, onProcess: (users: User[]) => void }) => {
  const [step, setStep] = useState(1);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleFileRead = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
    };
    reader.readAsText(file);
  };

  const handleAnalyze = () => {
    if (!fileContent) return;

    try {
      const { headers, data } = parseCSV(fileContent);

      // Validation
      const requiredFields = ['id', 'name', 'email', 'dni'];
      const missing = requiredFields.filter(field => !headers.includes(field));

      if (missing.length > 0) {
        setErrors([`El archivo no tiene las columnas requeridas: ${missing.join(', ')}`]);
        return;
      }

      // Map to User Objects
      const users: User[] = data.map((row: any) => {
        const userRole = (row.role === 'admin') ? Role.ADMIN : Role.INSTRUCTOR;
        return {
          id: row.id,
          name: row.name,
          email: row.email,
          dni: row.dni,
          role: userRole,
          active: true,
          password: '', // Default or handled by backend
          permissions: userRole === Role.ADMIN ? {
            canManageInstructors: true,
            canViewDashboard: true,
            canManageConfig: false
          } : undefined
        };
      });

      // Basic Data Validation
      const dataErrors: string[] = [];
      users.forEach((u, i) => {
        if (!u.id || !u.name || !u.email) dataErrors.push(`Fila ${i + 2}: Faltan datos obligatorios.`);
      });

      if (dataErrors.length > 0) {
        setErrors(dataErrors);
      } else {
        setPreviewData(users);
        setStep(2);
        setErrors([]);
      }

    } catch (e) {
      setErrors(["Error al procesar el archivo. Asegúrese de que es un CSV válido."]);
    }
  };

  const handleConfirm = () => {
    onProcess(previewData);
    setStep(1);
    setFileContent(null);
    setPreviewData([]);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold flex items-center gap-2">
            <Upload size={20} /> Carga Masiva de Instructores
          </h3>
          <button onClick={onClose}><X size={20} className="hover:text-slate-300" /></button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800">
                <p className="font-bold mb-2">Instrucciones:</p>
                <p className="mb-2">Suba un archivo <strong>.csv</strong> con las siguientes cabeceras exactas:</p>
                <code className="bg-white px-2 py-1 rounded border border-blue-200 block text-center mb-2 font-mono">
                  id, name, email, dni, role
                </code>
                <p className="text-xs text-blue-600">* El campo 'role' es opcional (por defecto 'instructor').</p>
              </div>

              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-sm text-red-700">
                  <p className="font-bold">Errores detectados:</p>
                  <ul className="list-disc pl-4 mt-1">
                    {errors.slice(0, 3).map((e, i) => <li key={i}>{e}</li>)}
                    {errors.length > 3 && <li>... y {errors.length - 3} errores más.</li>}
                  </ul>
                </div>
              )}

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                <input type="file" id="fileUpload" className="hidden" accept=".csv" onChange={handleFileRead} />
                <label htmlFor="fileUpload" className="cursor-pointer block">
                  <Upload size={32} className="mx-auto text-slate-400 mb-2" />
                  <span className="text-slate-600 font-medium block">
                    {fileName || "Seleccionar Archivo CSV"}
                  </span>
                </label>
              </div>

              <button
                disabled={!fileContent}
                onClick={handleAnalyze}
                className={`w-full py-3 rounded-lg font-bold text-white transition-all ${!fileContent ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                Analizar Archivo
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="bg-green-100 text-green-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} />
                </div>
                <h4 className="text-xl font-bold text-slate-800">Archivo Válido</h4>
                <p className="text-slate-500">Se han detectado <strong>{previewData.length}</strong> registros válidos listos para importar.</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 border border-slate-300 rounded-lg font-bold text-slate-600">Atrás</button>
                <button onClick={handleConfirm} className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">Confirmar Carga</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 4. CONFIGURATION MANAGER
export const ConfigurationManager = ({
  period,
  onUpdate
}: {
  period: AcademicPeriod,
  onUpdate: (p: AcademicPeriod) => void
}) => {
  const [formState, setFormState] = useState({
    name: period.name,
    academicStart: period.startDate,
    academicEnd: period.endDate,
    isOpen: period.isOpen,
    submissionStart: period.submissionStart || '',
    submissionEnd: period.submissionEnd || ''
  });

  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);



  const handleSave = () => {
    try {
      // Validations
      if (!formState.name || !formState.academicStart || !formState.academicEnd) {
        setMessage({ text: "Los campos del Periodo Académico son obligatorios.", type: 'error' });
        return;
      }

      if (new Date(formState.academicStart) > new Date(formState.academicEnd)) {
        setMessage({ text: "La fecha de inicio académico no puede ser posterior al fin.", type: 'error' });
        return;
      }

      // Logic to track window history
      // We will log ANY change to the window configuration, not just 'opening'
      let newHistory = [...(period.windowsHistory || [])];

      const hasWindowChanges =
        formState.submissionStart !== period.submissionStart ||
        formState.submissionEnd !== period.submissionEnd ||
        formState.isOpen !== period.isOpen;

      if (hasWindowChanges) {
        const actionType = formState.isOpen ? (period.isOpen ? 'Modificación' : 'Apertura') : 'Cierre';

        newHistory.push({
          id: Date.now().toString(),
          startDate: formState.submissionStart || 'No definida',
          endDate: formState.submissionEnd || 'No definida',
          openedBy: `Admin (${actionType})`,
          createdAt: new Date().toISOString()
        });
      }

      const updatedPeriod = {
        ...period,
        name: formState.name,
        startDate: formState.academicStart,
        endDate: formState.academicEnd,
        isOpen: formState.isOpen,
        submissionStart: formState.submissionStart,
        submissionEnd: formState.submissionEnd,
        windowsHistory: newHistory
      };

      onUpdate(updatedPeriod);

      // Usar alerta nativa para garantizar visibilidad inmediata
      // Esto sobrevive a cualquier re-renderizado o ciclo de vida de React
      window.alert("✅ ¡Configuración Guardada con Éxito!\n\nEl periodo académico y el historial de ventanas han sido actualizados correctamente.");

    } catch (error) {
      console.error("Error en handleSave:", error);
      setMessage({ text: "Ocurrió un error crítico al intentar guardar.", type: 'error' });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100 flex items-start gap-4">
        <div className="bg-white p-3 rounded-xl shadow-sm border border-purple-100/50">
          <Calendar size={32} className="text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Configuración de Disponibilidad</h2>
          <p className="text-slate-600 text-sm mt-1">Configura el ciclo académico vigente y controla las fechas habilitadas para que los instructores carguen su disponibilidad.</p>
        </div>
      </div>

      {/* Notification Area */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
          {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
        <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-blue-800">
          <strong>Campos obligatorios:</strong> El nombre del periodo, inicio y fin académico siempre deben estar definidos antes de habilitar la carga.
        </p>
      </div>

      {/* Academic Period Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-bold text-lg text-slate-800 border-b pb-2">Información del Periodo Académico</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Periodo Académico *</label>
            <input
              type="text"
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              placeholder="Ej. 2026-1"
              value={formState.name}
              onChange={e => setFormState({ ...formState, name: e.target.value })}
            />
            <p className="text-xs text-slate-400 mt-1">Nombre o código identificador del ciclo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Inicio del Periodo *</label>
              <input
                type="date"
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                value={formState.academicStart}
                onChange={e => setFormState({ ...formState, academicStart: e.target.value })}
              />
              <p className="text-xs text-slate-400 mt-1">Fecha de inicio de clases.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Fin del Periodo *</label>
              <input
                type="date"
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                value={formState.academicEnd}
                onChange={e => setFormState({ ...formState, academicEnd: e.target.value })}
              />
              <p className="text-xs text-slate-400 mt-1">Fecha de fin de clases.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Window Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-bold text-lg text-slate-800 border-b pb-2">Configuración de Carga</h3>

        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div>
            <span className="block font-bold text-slate-700">Habilitar carga de disponibilidad</span>
            <span className="text-sm text-slate-500">Permite que los instructores suban o actualicen su información.</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formState.isOpen}
              onChange={e => setFormState({ ...formState, isOpen: e.target.checked })}
            />
            <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity ${!formState.isOpen ? 'opacity-50 pointer-events-none' : ''}`}>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Inicio de Carga (Opcional)</label>
            <input
              type="date"
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              value={formState.submissionStart}
              onChange={e => setFormState({ ...formState, submissionStart: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Fin de Carga (Opcional)</label>
            <input
              type="date"
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              value={formState.submissionEnd}
              onChange={e => setFormState({ ...formState, submissionEnd: e.target.value })}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="bg-purple-600 text-white w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
      >
        <CheckCircle size={24} /> Guardar Configuración
      </button>

      {/* Historial de Registros */}
      <div className="mt-12 border-t pt-8">
        <h3 className="font-bold text-xl text-slate-800 mb-4 flex items-center gap-2">
          <Clock size={24} className="text-slate-400" />
          Historial de Aperturas de Disponibilidad
        </h3>
        <p className="text-slate-500 text-sm mb-6">
          Registro de ventanas de tiempo habilitadas anteriormente para este periodo.
        </p>

        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Estado</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Inicio Disponibilidad</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Fin Disponibilidad</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Registrado Por</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Fecha de Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!period.windowsHistory || period.windowsHistory.length === 0) ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No hay registros históricos disponibles.
                  </td>
                </tr>
              ) : (
                [...(period.windowsHistory)].reverse().map((window) => (
                  <tr key={window.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">
                        Habilitado
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {window.startDate}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {window.endDate}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {window.openedBy}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(window.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>



    </div>
  );
};