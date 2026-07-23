import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy } from 'lucide-react';
import { generarReporte, getReportesPorClinica } from '../../lib/reportes';
import ReporteVista from './ReporteVista';
import ServiciosMargenPanel from './ServiciosMargenPanel';
import CampanasGastoPanel from './CampanasGastoPanel';

const CLINICA_SLUG = 'velia';

function primerYUltimoDiaDelMes(): { inicio: string; fin: string } {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  return { inicio: inicio.toISOString().slice(0, 10), fin: fin.toISOString().slice(0, 10) };
}

export default function ReportesPage() {
  const queryClient = useQueryClient();
  const defaults = primerYUltimoDiaDelMes();
  const [periodoInicio, setPeriodoInicio] = useState(defaults.inicio);
  const [periodoFin, setPeriodoFin] = useState(defaults.fin);
  const [reporteSeleccionadoId, setReporteSeleccionadoId] = useState<string | null>(null);

  const { data: reportes = [] } = useQuery({
    queryKey: ['reportes', CLINICA_SLUG],
    queryFn: () => getReportesPorClinica(CLINICA_SLUG),
  });

  const mutacionGenerar = useMutation({
    mutationFn: () => generarReporte(CLINICA_SLUG, periodoInicio, periodoFin),
    onSuccess: (reporte) => {
      queryClient.invalidateQueries({ queryKey: ['reportes', CLINICA_SLUG] });
      setReporteSeleccionadoId(reporte.id);
    },
  });

  const reporteActivo = reportes.find((r) => r.id === reporteSeleccionadoId) ?? reportes[0];

  function copiarLinkPublico(token: string) {
    const url = `${window.location.origin}/reportes/publico/${token}`;
    navigator.clipboard.writeText(url);
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Reportes y rentabilidad</h1>

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Desde</label>
          <input
            type="date"
            value={periodoInicio}
            onChange={(e) => setPeriodoInicio(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Hasta</label>
          <input
            type="date"
            value={periodoFin}
            onChange={(e) => setPeriodoFin(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          onClick={() => mutacionGenerar.mutate()}
          disabled={mutacionGenerar.isPending}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {mutacionGenerar.isPending ? 'Generando...' : 'Generar reporte'}
        </button>

        <div className="ml-auto">
          <label className="mb-1 block text-xs font-medium text-gray-500">Reportes generados</label>
          <select
            value={reporteActivo?.id ?? ''}
            onChange={(e) => setReporteSeleccionadoId(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            {reportes.map((r) => (
              <option key={r.id} value={r.id}>
                {new Date(r.periodoInicio).toLocaleDateString('es-PE')} — {new Date(r.periodoFin).toLocaleDateString('es-PE')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {reporteActivo ? (
        <>
          <button
            onClick={() => copiarLinkPublico(reporteActivo.tokenPublico)}
            className="mb-4 flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <Copy size={14} /> Copiar link público de este reporte
          </button>
          <ReporteVista reporte={reporteActivo} />
        </>
      ) : (
        <p className="mb-6 text-sm text-gray-500">Todavía no hay reportes generados para esta clínica.</p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <ServiciosMargenPanel />
        <CampanasGastoPanel />
      </div>
    </div>
  );
}
