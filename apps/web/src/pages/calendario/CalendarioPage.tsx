import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCitasPorRango } from '../../lib/citas';
import type { Cita, EstadoCita } from '../../types';

const CLINICA_SLUG = 'velia';
const DIAS_LABEL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const COLOR_ESTADO: Record<EstadoCita, string> = {
  PROGRAMADA: 'bg-sky-100 text-sky-700 border-sky-300',
  CONFIRMADA: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  REPROGRAMADA: 'bg-amber-100 text-amber-700 border-amber-300',
  ATENDIDA: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  NO_SHOW: 'bg-red-100 text-red-700 border-red-300',
  CANCELADA: 'bg-gray-100 text-gray-500 border-gray-300',
};

function inicioDeSemana(fecha: Date): Date {
  const dia = new Date(fecha);
  const diff = dia.getDay() === 0 ? -6 : 1 - dia.getDay(); // semana empieza en lunes
  dia.setDate(dia.getDate() + diff);
  dia.setHours(0, 0, 0, 0);
  return dia;
}

function claveDia(fechaISO: string): string {
  return fechaISO.slice(0, 10);
}

export default function CalendarioPage() {
  const [referencia, setReferencia] = useState(new Date());
  const inicioSemana = useMemo(() => inicioDeSemana(referencia), [referencia]);
  const dias = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Date(inicioSemana.getFullYear(), inicioSemana.getMonth(), inicioSemana.getDate() + i)),
    [inicioSemana],
  );

  const desde = dias[0].toISOString().slice(0, 10);
  const hasta = dias[6].toISOString().slice(0, 10);

  const { data: citas = [], isLoading } = useQuery({
    queryKey: ['citas-rango', CLINICA_SLUG, desde, hasta],
    queryFn: () => getCitasPorRango(CLINICA_SLUG, desde, hasta),
  });

  const citasPorDia = useMemo(() => {
    const mapa = new Map<string, Cita[]>();
    for (const cita of citas) {
      const clave = claveDia(cita.fecha);
      mapa.set(clave, [...(mapa.get(clave) ?? []), cita]);
    }
    return mapa;
  }, [citas]);

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Calendario</h1>
          <p className="text-sm text-gray-500">
            {dias[0].toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} —{' '}
            {dias[6].toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReferencia((r) => new Date(r.getFullYear(), r.getMonth(), r.getDate() - 7))}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setReferencia(new Date())}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Hoy
          </button>
          <button
            onClick={() => setReferencia((r) => new Date(r.getFullYear(), r.getMonth(), r.getDate() + 7))}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Cargando citas...</p>
      ) : (
        <div className="grid flex-1 grid-cols-7 gap-2 overflow-y-auto">
          {dias.map((dia) => {
            const clave = dia.toISOString().slice(0, 10);
            const citasDelDia = (citasPorDia.get(clave) ?? []).sort((a, b) => a.hora.localeCompare(b.hora));
            const esHoy = clave === new Date().toISOString().slice(0, 10);
            return (
              <div key={clave} className={`flex flex-col rounded-lg border ${esHoy ? 'border-indigo-300 bg-indigo-50/40' : 'border-gray-200'}`}>
                <div className="border-b border-gray-200 px-2 py-1.5 text-center">
                  <p className="text-xs font-medium text-gray-500">{DIAS_LABEL[dia.getDay()]}</p>
                  <p className={`text-sm font-semibold ${esHoy ? 'text-indigo-700' : 'text-gray-800'}`}>{dia.getDate()}</p>
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-1.5" style={{ minHeight: '60vh' }}>
                  {citasDelDia.map((cita) => (
                    <div key={cita.id} className={`rounded border px-2 py-1 text-xs ${COLOR_ESTADO[cita.estado]}`}>
                      <p className="font-semibold">{cita.hora}</p>
                      <p className="truncate">{cita.lead?.nombreCompleto ?? 'Sin nombre'}</p>
                      <p className="truncate opacity-80">{cita.servicio?.nombre}</p>
                    </div>
                  ))}
                  {citasDelDia.length === 0 && <p className="mt-2 text-center text-[11px] text-gray-300">Sin citas</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
