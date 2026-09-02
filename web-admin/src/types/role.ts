export interface Role {
  role_id: number;
  role_name: string;
  description?: string;
}

export interface RoleCreate {
  role_name: string;
  description?: string;
}

export interface RoleUpdate {
  role_name?: string;
  description?: string;
}
