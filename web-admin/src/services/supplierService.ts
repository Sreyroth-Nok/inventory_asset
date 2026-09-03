import { apiClient } from './api';
import type { Supplier, SupplierCreate } from '../types/supplier';

export const supplierService = {
  getSuppliers: async (search?: string): Promise<Supplier[]> => {
    const params = search ? { search } : {};
    const response = await apiClient.get<Supplier[]>('/suppliers', { params });
    return response.data;
  },

  createSupplier: async (data: SupplierCreate): Promise<Supplier> => {
    const response = await apiClient.post<Supplier>('/suppliers', data);
    return response.data;
  },

  updateSupplier: async (id: number, data: Partial<SupplierCreate>): Promise<Supplier> => {
    const response = await apiClient.put<Supplier>(`/suppliers/${id}`, data);
    return response.data;
  },

  deleteSupplier: async (id: number): Promise<void> => {
    await apiClient.delete(`/suppliers/${id}`);
  }
};
