import { apiClient } from './api';
import type { StockInRequest, StockOutRequest, StockTransaction } from '../types/stockTransaction';

export const stockTransactionService = {
  getTransactions: async (inventoryId?: number, transactionType?: string): Promise<StockTransaction[]> => {
    const params: any = {};
    if (inventoryId) params.inventory_id = inventoryId;
    if (transactionType) params.transaction_type = transactionType;
    const response = await apiClient.get<StockTransaction[]>('/stock-transactions', { params });
    return response.data;
  },

  performStockIn: async (payload: StockInRequest): Promise<StockTransaction> => {
    const response = await apiClient.post<StockTransaction>('/stock-transactions/stock-in', payload);
    return response.data;
  },

  performStockOut: async (payload: StockOutRequest): Promise<StockTransaction> => {
    const response = await apiClient.post<StockTransaction>('/stock-transactions/stock-out', payload);
    return response.data;
  }
};
