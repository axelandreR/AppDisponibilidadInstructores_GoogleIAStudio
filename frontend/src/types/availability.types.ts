export interface AcademicPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isOpenForSubmission: boolean;
}

export interface AvailabilityVersion {
  id: string;
  instructorId: string;
  periodId: string;
  slots: string[]; // ["Lunes-07:30", "Martes-09:00"]
  comments?: string;
  isFinal: boolean;
  createdAt: string;
}

export interface CreateAvailabilityDto {
  periodId: string;
  slots: string[];
  comments?: string;
}
