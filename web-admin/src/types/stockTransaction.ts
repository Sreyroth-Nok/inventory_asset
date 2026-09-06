export interface StockInRequest {
  inventory_id: number;
  quantity: number;
  reference?: string;
  reason?: string;
  remarks?: string;
}

export interface StockOutRequest {
  inventory_id: number;
  quantity: number;
  reference?: string;
  reason?: string;
  remarks?: string;
}

export interface StockTransaction {
  transaction_id: number;
  inventory_id: number;
  user_id: number;
  transaction_type: 'Stock In' | 'Stock Out';
  quantity: number;
  transaction_date: string;
  reference?: string;
  reason?: string;
  remarks?: string;
  created_at: string;
}
