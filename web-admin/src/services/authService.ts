import { apiClient } from './api';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
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
    let token = localStorage.getItem('token');
    if (!token) {
      const res = await authService.login({ username: 'admin', password: '123456' });
      token = res.access_token;
    }
    return token;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  }
};
