export enum Role {
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  dni?: string; // For password recovery
  password?: string; // Mock password
  active: boolean;
  permissions?: {
    canManageInstructors: boolean;
    canViewDashboard: boolean;
    canManageConfig: boolean;
  };
}

export interface SubmissionWindow {
  id: string;
  startDate: string;
  endDate: string;
  openedBy: string; // User ID
  createdAt: string;
}

export interface AcademicPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isOpen: boolean; // Master switch for submission
  submissionStart?: string;
  submissionEnd?: string;
  windowsHistory: SubmissionWindow[];
}

export interface TimeSlot {
  day: string; // "Lunes", "Martes", etc.
  startTime: string; // "07:30"
  id: string; // "Lunes-07:30"
}

export interface AvailabilityVersion {
  id: string;
  instructorId: string;
  periodId: string;
  timestamp: string;
  slots: string[]; // Array of TimeSlot IDs
  comments: string;
  isFinal: boolean;
}

export interface StatData {
  name: string;
  value: number;
}