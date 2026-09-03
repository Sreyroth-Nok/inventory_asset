import { apiClient } from './api';

export interface AssetHistoryReportItem {
  assignment_id: number;
  asset_code: string;
  asset_name: string;
  employee_code: string;
  employee_name: string;
  department_name: string;
  assigned_by: string;
  assigned_date: string;
  condition_on_assignment: string;
  returned_date: string;
  condition_on_return: string;
  status: string;
  remarks: string;
}

export interface StockMovementReportItem {
  transaction_id: number;
  item_code: string;
  item_name: string;
  unit: string;
  transaction_type: string;
  quantity: number;
  reference: string;
  reason: string;
  recorded_by: string;
  remarks: string;
  created_at: string;
}

export interface DepartmentSummaryReportItem {
  department_id: number;
  department_name: string;
  status: string;
  employee_count: number;
  assigned_assets_count: number;
  total_asset_value: number;
}

export interface InventoryStatusReportItem {
  inventory_id: number;
  item_code: string;
  item_name: string;
  category: string;
  unit: string;
  quantity: number;
  minimum_stock: number;
  status: string;
  supplier_name: string;
  needs_reorder: boolean;
}

export const reportsService = {
  getAssetHistory: async (filters?: { start_date?: string; end_date?: string; status_filter?: string }): Promise<AssetHistoryReportItem[]> => {
    const response = await apiClient.get<AssetHistoryReportItem[]>('/reports/asset-history', { params: filters });
    return response.data;
  },

  getStockMovements: async (filters?: { start_date?: string; end_date?: string; transaction_type?: string }): Promise<StockMovementReportItem[]> => {
    const response = await apiClient.get<StockMovementReportItem[]>('/reports/stock-movements', { params: filters });
    return response.data;
  },

  getDepartmentSummary: async (): Promise<DepartmentSummaryReportItem[]> => {
    const response = await apiClient.get<DepartmentSummaryReportItem[]>('/reports/department-summary');
    return response.data;
  },

  getInventoryStatus: async (filters?: { status_filter?: string }): Promise<InventoryStatusReportItem[]> => {
    const response = await apiClient.get<InventoryStatusReportItem[]>('/reports/inventory-status', { params: filters });
    return response.data;
  }
};
