import { apiClient } from './api';
import type { AssetCategory, AssetCategoryCreate } from '../types/category';

export const categoryService = {
  getCategories: async (): Promise<AssetCategory[]> => {
    const response = await apiClient.get<AssetCategory[]>('/categories');
    return response.data;
  },

  getCategory: async (id: number): Promise<AssetCategory> => {
    const response = await apiClient.get<AssetCategory>(`/categories/${id}`);
    return response.data;
  },

  createCategory: async (categoryData: AssetCategoryCreate): Promise<AssetCategory> => {
    const response = await apiClient.post<AssetCategory>('/categories', categoryData);
    return response.data;
  },

  updateCategory: async (id: number, categoryData: Partial<AssetCategoryCreate>): Promise<AssetCategory> => {
    const response = await apiClient.put<AssetCategory>(`/categories/${id}`, categoryData);
    return response.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  }
};
