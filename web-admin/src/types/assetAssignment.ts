import type { Asset } from './asset';
import type { Employee } from './employee';

/** Dates are plain ISO dates (YYYY-MM-DD). */
export interface AssetAssignPayload {
  asset_id: number;
  employee_id: number;
  assigned_date?: string;          // defaults to today on the server
  expected_return_date?: string;   // optional due-back date
  condition_on_assignment?: string;
  remarks?: string;
}

export interface AssetReturnPayload {
  returned_date?: string;          // defaults to today on the server
  condition_on_return?: string;
  status_on_return?: string;
  remarks?: string;
}

export interface AssetAssignmentUpdatePayload {
  expected_return_date?: string | null;
  remarks?: string;
}

export interface AssetAssignmentResponse {
  assignment_id: number;
  asset_id: number;
  employee_id: number;
  assigned_by: number;
  assigned_date: string;
  expected_return_date?: string | null;
  condition_on_assignment?: string;
  returned_date?: string | null;
  condition_on_return?: string;
  status: 'Assigned' | 'Returned' | string;
  is_overdue: boolean;
  remarks?: string;
  created_at: string;
  updated_at: string;
  asset?: Asset;
  employee?: Employee & { department?: { department_name: string } };
  assigner?: { username: string };
}

export interface AssignmentFilters {
  status_filter?: 'Assigned' | 'Returned' | 'Overdue';
  employee_id?: number;
  asset_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
}
