import type { Role } from './role';

export interface User {
  user_id: number;
  role_id?: number;
  employee_id?: number;
  username: string;
  email: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  phone?: string;
  gender?: string;
  created_at: string;
  updated_at: string;
  role?: Role | string;
}

export interface UserCreate {
  username: string;
  password: string;
  email: string;
  role?: string;
  role_id?: number;
  employee_id?: number;
  status?: string;
  phone?: string;
  gender?: string;
}

export interface UserUpdate {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  role_id?: number;
  employee_id?: number;
  status?: string;
  phone?: string;
  gender?: string;
}
