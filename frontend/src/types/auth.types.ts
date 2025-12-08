export enum Role {
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface UserPermissions {
  canManageInstructors?: boolean;
  canViewDashboard?: boolean;
  canManageConfig?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  permissions?: UserPermissions;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}