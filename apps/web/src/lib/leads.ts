import { apiClient } from './apiClient';
import type { EtapaLead, Lead } from '../types';

export async function getLeads(clinicaSlug: string): Promise<Lead[]> {
  const { data } = await apiClient.get<Lead[]>(`/clinicas/${clinicaSlug}/leads`);
  return data;
}

export async function actualizarEtapaLead(
  clinicaSlug: string,
  leadId: string,
  etapa: EtapaLead,
): Promise<Lead> {
  const { data } = await apiClient.patch<Lead>(
    `/clinicas/${clinicaSlug}/leads/${leadId}/etapa`,
    { etapa },
  );
  return data;
}
