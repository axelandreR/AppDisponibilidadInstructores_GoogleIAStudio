import { Role, User, AcademicPeriod, TimeSlot } from './types';

export const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Generate time slots from 07:30 to 22:30 in 30 min intervals
export const GENERATE_TIME_SLOTS = (): string[] => {
  const slots: string[] = [];
  let hour = 7;
  let minute = 30;
  
  while (hour < 22 || (hour === 22 && minute <= 30)) {
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    slots.push(timeStr);
    
    minute += 30;
    if (minute === 60) {
      minute = 0;
      hour += 1;
    }
  }
  return slots;
};

export const TIME_SLOTS_STRINGS = GENERATE_TIME_SLOTS();

export const INITIAL_PERIOD: AcademicPeriod = {
  id: '2024-1',
  name: 'Ciclo Académico 2024-1',
  startDate: '2024-03-01',
  endDate: '2024-07-15',
  isActive: true,
  isOpenForSubmission: true,
};

// Mock Users
export const MOCK_USERS: User[] = [
  {
    id: 'ADMIN001',
    name: 'Carlos Admin',
    email: 'admin@sys.com',
    role: Role.ADMIN,
    dni: '12345678',
    active: true,
    permissions: {
      canManageInstructors: true,
      canViewDashboard: true,
      canManageConfig: false,
    }
  },
  {
    id: 'SUPER001',
    name: 'Maria Super',
    email: 'super@sys.com',
    role: Role.SUPER_ADMIN,
    dni: '87654321',
    active: true,
    permissions: {
      canManageInstructors: true,
      canViewDashboard: true,
      canManageConfig: true,
    }
  },
  {
    id: 'INST001',
    name: 'Juan Pérez',
    email: 'juan.perez@inst.com',
    role: Role.INSTRUCTOR,
    dni: '11223344',
    active: true,
  },
  {
    id: 'INST002',
    name: 'Ana Gómez',
    email: 'ana.gomez@inst.com',
    role: Role.INSTRUCTOR,
    dni: '55667788',
    active: true,
  }
];