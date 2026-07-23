import { apiClient } from './apiClient';
import { UsuarioSesion } from '../store/useAuthStore';

export interface LoginResponse {
  accessToken: string;
  usuario: UsuarioSesion;
}

export async function login(correo: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { correo, password });
  return data;
}
