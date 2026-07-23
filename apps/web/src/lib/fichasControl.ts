import { apiClient } from './apiClient';
import type { FichaControl } from '../types';

export async function getFichasControlPorLead(leadId: string): Promise<FichaControl[]> {
  const { data } = await apiClient.get<FichaControl[]>(`/leads/${leadId}/fichas-control`);
  return data;
}
