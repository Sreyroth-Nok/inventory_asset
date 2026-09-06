export interface AssetCategory {
  category_id: number;
  category_name: string;
  description?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface AssetCategoryCreate {
  category_name: string;
  description?: string;
  status?: string;
}
