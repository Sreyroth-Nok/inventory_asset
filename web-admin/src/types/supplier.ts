export interface Supplier {
  supplier_id: number;
  supplier_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierCreate {
  supplier_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: string;
}
