import { apiClient } from './api';
import type { Role, RoleCreate } from '../types/role';

export const roleService = {
  getRoles: async (): Promise<Role[]> => {
    const response = await apiClient.get<Role[]>('/roles');
    return response.data;
  },

  createRole: async (roleData: RoleCreate): Promise<Role> => {
    const response = await apiClient.post<Role>('/roles', roleData);
    return response.data;
  },

  updateRole: async (id: number, roleData: Partial<RoleCreate>): Promise<Role> => {
    const response = await apiClient.put<Role>(`/roles/${id}`, roleData);
    return response.data;
  },

  deleteRole: async (id: number): Promise<void> => {
    await apiClient.delete(`/roles/${id}`);
  }
};
