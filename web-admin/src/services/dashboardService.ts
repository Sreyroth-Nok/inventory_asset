import { apiClient } from './api';

export interface DashboardStats {
  total_users: number;
  total_employees: number;
  total_departments: number;
  total_suppliers: number;
  asset_summary: {
    total_assets: number;
    available_assets: number;
    assigned_assets: number;
    under_maintenance_assets: number;
    damaged_assets: number;
  };
  inventory_summary: {
    total_items: number;
    available_items: number;
    low_stock_items: number;
    out_of_stock_items: number;
  };
  recent_transactions: any[];
  recent_assignments: any[];
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats');
    return response.data;
  }
};
