import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getReportePorToken } from '../../lib/reportes';
import ReporteVista from './ReporteVista';

export default function ReportePublicoPage() {
  const { token = '' } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['reporte-publico', token],
    queryFn: () => getReportePorToken(token),
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-1 text-lg font-bold text-indigo-700">AGENDA IA</h1>
        <p className="mb-6 text-sm text-gray-500">Reporte de resultados</p>

        {isLoading && <p className="text-sm text-gray-500">Cargando reporte...</p>}
        {isError && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            Este link no es válido o el reporte ya expiró.
          </p>
        )}
        {data && <ReporteVista reporte={data} />}
      </div>
    </div>
  );
}
