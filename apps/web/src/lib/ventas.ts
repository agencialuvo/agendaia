import { apiClient } from './apiClient';
import type { Venta } from '../types';

export async function getVentasPorLead(leadId: string): Promise<Venta[]> {
  const { data } = await apiClient.get<Venta[]>(`/leads/${leadId}/ventas`);
  return data;
}

export async function crearVenta(leadId: string, servicioId: string, monto: number, marca?: string): Promise<Venta> {
  const { data } = await apiClient.post<Venta>(`/leads/${leadId}/ventas`, { servicioId, monto, marca });
  return data;
}
