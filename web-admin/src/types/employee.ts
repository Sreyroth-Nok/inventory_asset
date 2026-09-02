export interface Employee {
  employee_id: number;
  department_id?: number;
  employee_code: string;
  employee_name: string;
  email?: string;
  phone?: string;
  position?: string;
  status: 'Active' | 'Inactive' | 'Resigned';
  department_name?: string;
}

export interface EmployeeCreate {
  employee_code: string;
  employee_name: string;
  department_id?: number;
  email?: string;
  phone?: string;
  position?: string;
  status?: 'Active' | 'Inactive' | 'Resigned';
}

export interface Department {
  department_id: number;
  department_name: string;
  description?: string;
  status: string;
}
