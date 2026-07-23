import { apiClient } from './apiClient';
import type { RolClinica, RolPlataforma, TipoUsuario, Usuario } from '../types';

export async function getUsuarios(): Promise<Usuario[]> {
  const { data } = await apiClient.get<Usuario[]>('/usuarios');
  return data;
}

export interface CrearUsuarioParams {
  nombre: string;
  correo: string;
  password: string;
  tipoUsuario: TipoUsuario;
  rolPlataforma?: RolPlataforma;
  rolClinica?: RolClinica;
  clinicaId?: string;
}

export async function crearUsuario(params: CrearUsuarioParams): Promise<Usuario> {
  const { data } = await apiClient.post<Usuario>('/usuarios', params);
  return data;
}

export async function eliminarUsuario(usuarioId: string, claveMaestraEliminacion?: string): Promise<void> {
  await apiClient.delete(`/usuarios/${usuarioId}`, { data: { claveMaestraEliminacion } });
}
