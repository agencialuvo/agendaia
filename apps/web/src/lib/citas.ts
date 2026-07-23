import { apiClient } from './apiClient';
import type { Cita } from '../types';

export async function getCitasPorRango(clinicaSlug: string, desde: string, hasta: string): Promise<Cita[]> {
  const { data } = await apiClient.get<Cita[]>(`/clinicas/${clinicaSlug}/citas`, { params: { desde, hasta } });
  return data;
}

export async function getCitasPorLead(leadId: string): Promise<Cita[]> {
  const { data } = await apiClient.get<Cita[]>(`/leads/${leadId}/citas`);
  return data;
}
