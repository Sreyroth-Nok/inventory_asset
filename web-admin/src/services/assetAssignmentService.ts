import { apiClient } from './api';
import type {
  AssetAssignPayload, AssetReturnPayload, AssetAssignmentResponse,
  AssetAssignmentUpdatePayload, AssignmentFilters,
} from '../types/assetAssignment';

export const assetAssignmentService = {
  getAssignments: async (filters: AssignmentFilters = {}): Promise<AssetAssignmentResponse[]> => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''));
    const response = await apiClient.get<AssetAssignmentResponse[]>('/asset-assignments', { params });
    return response.data;
  },

  assignAsset: async (payload: AssetAssignPayload): Promise<AssetAssignmentResponse> => {
    const response = await apiClient.post<AssetAssignmentResponse>('/asset-assignments/assign', payload);
    return response.data;
  },

  returnAsset: async (assignmentId: number, payload: AssetReturnPayload): Promise<AssetAssignmentResponse> => {
    const response = await apiClient.post<AssetAssignmentResponse>(`/asset-assignments/${assignmentId}/return`, payload);
    return response.data;
  },

  updateAssignment: async (assignmentId: number, payload: AssetAssignmentUpdatePayload): Promise<AssetAssignmentResponse> => {
    const response = await apiClient.put<AssetAssignmentResponse>(`/asset-assignments/${assignmentId}`, payload);
    return response.data;
  },

  getActiveAssignments: async (): Promise<AssetAssignmentResponse[]> => {
    const response = await apiClient.get<AssetAssignmentResponse[]>('/asset-assignments/active');
    return response.data;
  }
};
