export interface Department {
  department_id: number;
  department_name: string;
  description?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface DepartmentCreate {
  department_name: string;
  description?: string;
  status?: string;
}
