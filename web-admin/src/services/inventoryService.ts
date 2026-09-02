import { apiClient } from './api';
import type { InventoryItem, InventoryItemCreate } from '../types/inventory';

export const inventoryService = {
  getInventoryItems: async (search?: string): Promise<InventoryItem[]> => {
    const params = search ? { search } : {};
    const response = await apiClient.get<InventoryItem[]>('/inventory', { params });
    return response.data;
  },

  createInventoryItem: async (itemData: InventoryItemCreate): Promise<InventoryItem> => {
    const response = await apiClient.post<InventoryItem>('/inventory', itemData);
    return response.data;
  },

  updateInventoryItem: async (id: number, itemData: Partial<InventoryItemCreate>): Promise<InventoryItem> => {
    const response = await apiClient.put<InventoryItem>(`/inventory/${id}`, itemData);
    return response.data;
  },

  deleteInventoryItem: async (id: number): Promise<void> => {
    await apiClient.delete(`/inventory/${id}`);
  }
};
