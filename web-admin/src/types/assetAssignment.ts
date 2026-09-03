export interface AssetAssignPayload {
  asset_id: number;
  employee_id: number;
  assigned_date?: string;
  condition_on_assignment?: string;
  remarks?: string;
}

export interface AssetReturnPayload {
  returned_date?: string;
  condition_on_return?: string;
  status_on_return?: string;
  remarks?: string;
}

export interface AssetAssignmentResponse {
  assignment_id: number;
  asset_id: number;
  employee_id: number;
  assigned_by: number;
  assigned_date: string;
  condition_on_assignment?: string;
  returned_date?: string;
  condition_on_return?: string;
  status: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}
