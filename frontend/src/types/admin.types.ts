import { User } from './auth.types';

export interface DashboardStats {
  totalInstructors: number;
  submittedFinal: number; // Instructores con versión final
  draftOnly: number; // Instructores con borrador pero sin final
  pending: number; // Instructores sin ninguna versión
}

export interface InstructorRow extends User {
  hasFinalVersion: boolean;
  hasDraft: boolean;
  lastUpdate?: string;
}

export type FilterStatus = 'ALL' | 'FINAL' | 'DRAFT' | 'PENDING';
