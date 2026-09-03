import { apiClient } from './api';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserProfile {
  user_id: number;
  username: string;
  email: string;
  phone?: string;
  gender?: string;
  status: string;
  role?: string | {
    role_id?: number;
    role_name?: string;
    description?: string;
  };
  employee?: {
    employee_id: number;
    employee_code: string;
    employee_name: string;
    position?: string;
  };
}


export const authService = {
  login: async (credentials: LoginPayload): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/login/json', credentials);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },

  ensureAuthenticated: async (): Promise<string> => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error("User is not authenticated. Please log in.");
    }
    return token;
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  }
};
