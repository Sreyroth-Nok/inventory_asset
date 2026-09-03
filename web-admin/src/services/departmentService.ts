import { apiClient } from './api';
import type { Department, DepartmentCreate } from '../types/department';

export const departmentService = {
  getDepartments: async (): Promise<Department[]> => {
    const response = await apiClient.get<Department[]>('/departments');
    return response.data;
  },

  createDepartment: async (data: DepartmentCreate): Promise<Department> => {
    const response = await apiClient.post<Department>('/departments', data);
    return response.data;
  },

  updateDepartment: async (id: number, data: Partial<DepartmentCreate>): Promise<Department> => {
    const response = await apiClient.put<Department>(`/departments/${id}`, data);
    return response.data;
  },

  deleteDepartment: async (id: number): Promise<void> => {
    await apiClient.delete(`/departments/${id}`);
  }
};
