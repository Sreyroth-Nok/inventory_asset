export interface InventoryItem {
  inventory_id: number;
  supplier_id?: number;
  item_code: string;
  item_name: string;
  category?: string;
  unit?: string;
  quantity: number;
  minimum_stock: number;
  status: 'Available' | 'Low Stock' | 'Out of Stock' | 'Discontinued';
  unit_price?: number;
  description?: string;
  supplier_name?: string;
}

export interface InventoryItemCreate {
  item_code: string;
  item_name: string;
  supplier_id?: number;
  category?: string;
  unit?: string;
  quantity: number;
  minimum_stock: number;
  unit_price?: number;
  status?: string;
  description?: string;
}

export interface StockTransaction {
  transaction_id: number;
  inventory_id: number;
  user_id: number;
  transaction_type: 'Stock In' | 'Stock Out' | 'Adjustment';
  quantity: number;
  reference?: string;
  reason?: string;
  remarks?: string;
  transaction_date: string;
  item_name?: string;
  username?: string;
}
