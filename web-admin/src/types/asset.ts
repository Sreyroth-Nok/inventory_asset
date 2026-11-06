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
  status: 'Available' | 'Assigned' | 'Under Maintenance' | 'Damaged' | 'Lost' | 'Retired' | 'Disposed';
  description?: string;
  category_name?: string;
  supplier_name?: string;
  assigned_to?: {
    assignment_id: number;
    employee_id: number;
    employee_code: string;
    employee_name: string;
    assigned_date?: string;
    expected_return_date?: string | null;
    is_overdue?: boolean;
    condition_on_assignment?: string;
  };
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
