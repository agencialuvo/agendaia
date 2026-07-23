import { apiClient } from './apiClient';
import type { Campana } from '../types';

export async function getCampanas(clinicaSlug: string): Promise<Campana[]> {
  const { data } = await apiClient.get<Campana[]>(`/clinicas/${clinicaSlug}/campanas`);
  return data;
}

export async function actualizarGasto(campanaId: string, gastoRealMensual: number): Promise<Campana> {
  const { data } = await apiClient.patch<Campana>(`/campanas/${campanaId}/gasto`, { gastoRealMensual });
  return data;
}
