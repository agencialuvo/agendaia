import { apiClient } from './apiClient';
import type { Conversacion } from '../types';

export async function getConversacionesPorLead(leadId: string): Promise<Conversacion[]> {
  const { data } = await apiClient.get<Conversacion[]>(`/leads/${leadId}/conversaciones`);
  return data;
}
