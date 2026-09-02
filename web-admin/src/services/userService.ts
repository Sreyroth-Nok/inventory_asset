import { apiClient } from './api';
import type { User, UserCreate } from '../types/user';

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/users');
    return response.data;
  },

  createUser: async (userData: UserCreate): Promise<User> => {
    const response = await apiClient.post<User>('/users', userData);
    return response.data;
  },

  updateUser: async (id: number, userData: Partial<UserCreate>): Promise<User> => {
    const response = await apiClient.put<User>(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  }
};
