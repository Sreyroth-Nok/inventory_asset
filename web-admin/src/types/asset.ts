export interface Asset {
  asset_id: number;
  category_id?: number;
  supplier_id?: number;
  asset_code: string;
  asset_name: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number | string;
  condition?: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged';
  status: 'Available' | 'Assigned' | 'Under Maintenance' | 'Retired' | 'Disposed';
  description?: string;
  category_name?: string;
  supplier_name?: string;
}

export interface AssetCreate {
  asset_code: string;
  asset_name: string;
  category_id?: number;
  supplier_id?: number;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number | string;
  condition?: string;
  status?: string;
  description?: string;
}
