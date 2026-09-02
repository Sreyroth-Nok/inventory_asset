import { apiClient } from './api';
import type { Employee, EmployeeCreate } from '../types/employee';

export const employeeService = {
  getEmployees: async (): Promise<Employee[]> => {
    const response = await apiClient.get<Employee[]>('/employees');
    return response.data;
  },

  createEmployee: async (empData: EmployeeCreate): Promise<Employee> => {
    const response = await apiClient.post<Employee>('/employees', empData);
    return response.data;
  },

  updateEmployee: async (id: number, empData: Partial<EmployeeCreate>): Promise<Employee> => {
    const response = await apiClient.put<Employee>(`/employees/${id}`, empData);
    return response.data;
  },

  deleteEmployee: async (id: number): Promise<void> => {
    await apiClient.delete(`/employees/${id}`);
  }
};
