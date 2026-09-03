import { apiClient } from './api';
import type { AssetAssignPayload, AssetReturnPayload, AssetAssignmentResponse } from '../types/assetAssignment';

export const assetAssignmentService = {
  assignAsset: async (payload: AssetAssignPayload): Promise<AssetAssignmentResponse> => {
    const response = await apiClient.post<AssetAssignmentResponse>('/asset-assignments/assign', payload);
    return response.data;
  },

  returnAsset: async (assignmentId: number, payload: AssetReturnPayload): Promise<AssetAssignmentResponse> => {
    const response = await apiClient.post<AssetAssignmentResponse>(`/asset-assignments/${assignmentId}/return`, payload);
    return response.data;
  },

  getActiveAssignments: async (): Promise<AssetAssignmentResponse[]> => {
    const response = await apiClient.get<AssetAssignmentResponse[]>('/asset-assignments/active');
    return response.data;
  }
};
