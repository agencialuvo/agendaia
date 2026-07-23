import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCampanas, actualizarGasto } from '../../lib/campanas';

const CLINICA_SLUG = 'velia';

export default function CampanasGastoPanel() {
  const queryClient = useQueryClient();
  const { data: campanas = [] } = useQuery({
    queryKey: ['campanas', CLINICA_SLUG],
    queryFn: () => getCampanas(CLINICA_SLUG),
  });
  const [valores, setValores] = useState<Record<string, string>>({});

  const mutacion = useMutation({
    mutationFn: ({ id, gasto }: { id: string; gasto: number }) => actualizarGasto(id, gasto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campanas', CLINICA_SLUG] }),
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-1 text-sm font-semibold text-gray-700">Gasto real por campaña</h3>
      <p className="mb-3 text-xs text-gray-400">
        Input manual mientras no hay acceso a Meta Ads API — se usa para calcular el CPL y el ROI.
      </p>
      <div className="space-y-2">
        {campanas.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-gray-700">{c.nombre}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">S/</span>
              <input
                type="number"
                min={0}
                placeholder={c.gastoRealMensual ?? '—'}
                value={valores[c.id] ?? c.gastoRealMensual ?? ''}
                onChange={(e) => setValores((v) => ({ ...v, [c.id]: e.target.value }))}
                className="w-24 rounded-md border border-gray-300 px-2 py-1 text-right text-sm"
              />
              <button
                onClick={() => {
                  const gasto = Number(valores[c.id]);
                  if (!Number.isNaN(gasto)) mutacion.mutate({ id: c.id, gasto });
                }}
                className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
              >
                Guardar
              </button>
            </div>
          </div>
        ))}
        {campanas.length === 0 && <p className="text-sm text-gray-400">Sin campañas registradas todavía.</p>}
      </div>
    </div>
  );
}
