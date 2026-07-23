import { apiClient } from './apiClient';

export interface Clinica {
  id: string;
  slug: string;
  nombre: string;
}

export async function getClinicas(): Promise<Clinica[]> {
  const { data } = await apiClient.get<Clinica[]>('/tenants');
  return data;
}
