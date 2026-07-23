import { apiClient } from './apiClient';
import type { Servicio } from '../types';

export async function getServicios(clinicaSlug: string): Promise<Servicio[]> {
  const { data } = await apiClient.get<Servicio[]>(`/clinicas/${clinicaSlug}/servicios`);
  return data;
}

export async function actualizarMargen(servicioId: string, margenPorcentaje: number): Promise<Servicio> {
  const { data } = await apiClient.patch<Servicio>(`/servicios/${servicioId}/margen`, { margenPorcentaje });
  return data;
}
