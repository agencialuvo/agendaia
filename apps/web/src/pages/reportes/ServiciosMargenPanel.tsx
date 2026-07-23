import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getServicios, actualizarMargen } from '../../lib/servicios';

const CLINICA_SLUG = 'velia';

export default function ServiciosMargenPanel() {
  const queryClient = useQueryClient();
  const { data: servicios = [] } = useQuery({
    queryKey: ['servicios', CLINICA_SLUG],
    queryFn: () => getServicios(CLINICA_SLUG),
  });
  const [valores, setValores] = useState<Record<string, string>>({});

  const mutacion = useMutation({
    mutationFn: ({ id, margen }: { id: string; margen: number }) => actualizarMargen(id, margen),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicios', CLINICA_SLUG] }),
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-1 text-sm font-semibold text-gray-700">Margen por servicio</h3>
      <p className="mb-3 text-xs text-gray-400">
        Input manual — se usa para calcular la utilidad estimada en los reportes.
      </p>
      <div className="space-y-2">
        {servicios.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-700">{s.nombre}</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={100}
                placeholder={s.margenPorcentaje ?? '—'}
                value={valores[s.id] ?? s.margenPorcentaje ?? ''}
                onChange={(e) => setValores((v) => ({ ...v, [s.id]: e.target.value }))}
                className="w-20 rounded-md border border-gray-300 px-2 py-1 text-right text-sm"
              />
              <span className="text-gray-400">%</span>
              <button
                onClick={() => {
                  const margen = Number(valores[s.id]);
                  if (!Number.isNaN(margen)) mutacion.mutate({ id: s.id, margen });
                }}
                className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
              >
                Guardar
              </button>
            </div>
          </div>
        ))}
        {servicios.length === 0 && <p className="text-sm text-gray-400">Sin servicios cargados.</p>}
      </div>
    </div>
  );
}
