import { apiClient } from './apiClient';
import type { ReporteAnalisis } from '../types';

export async function getReportesPorClinica(clinicaSlug: string): Promise<ReporteAnalisis[]> {
  const { data } = await apiClient.get<ReporteAnalisis[]>(`/clinicas/${clinicaSlug}/reportes`);
  return data;
}

export async function generarReporte(
  clinicaSlug: string,
  periodoInicio: string,
  periodoFin: string,
): Promise<ReporteAnalisis> {
  const { data } = await apiClient.post<ReporteAnalisis>(`/clinicas/${clinicaSlug}/reportes/generar`, {
    periodoInicio,
    periodoFin,
  });
  return data;
}

export async function getReportePorToken(token: string): Promise<ReporteAnalisis> {
  const { data } = await apiClient.get<ReporteAnalisis>(`/reportes/publico/${token}`);
  return data;
}
