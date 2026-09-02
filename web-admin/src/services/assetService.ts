import { apiClient } from './api';
import type { Asset, AssetCreate } from '../types/asset';

export const assetService = {
  getAssets: async (search?: string): Promise<Asset[]> => {
    const params = search ? { search } : {};
    const response = await apiClient.get<Asset[]>('/assets', { params });
    return response.data;
  },

  createAsset: async (assetData: AssetCreate): Promise<Asset> => {
    const response = await apiClient.post<Asset>('/assets', assetData);
    return response.data;
  },

  updateAsset: async (id: number, assetData: Partial<AssetCreate>): Promise<Asset> => {
    const response = await apiClient.put<Asset>(`/assets/${id}`, assetData);
    return response.data;
  },

  deleteAsset: async (id: number): Promise<void> => {
    await apiClient.delete(`/assets/${id}`);
  }
};
