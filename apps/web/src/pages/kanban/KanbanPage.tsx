import { useMemo } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getLeads, actualizarEtapaLead } from '../../lib/leads';
import { ETAPAS, type EtapaLead, type Lead } from '../../types';
import KanbanColumn from './KanbanColumn';

// Embudo de ventas (Kanban) — reemplaza el Excel: los leads entran solos (webhook de
// Meta Lead Ads o WhatsApp orgánico) y se mueven de etapa solos (scoring, agendamiento)
// o a mano arrastrando la tarjeta (ver docs/Arquitectura_Sistema_VELIA_CRM_IA.md §4.3).
const CLINICA_SLUG = 'velia'; // piloto de un solo tenant — el selector multi-clínica viene en la Etapa 2 del plan

export default function KanbanPage() {
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data: leads = [], isLoading, isError } = useQuery({
    queryKey: ['leads', CLINICA_SLUG],
    queryFn: () => getLeads(CLINICA_SLUG),
    refetchInterval: 5000, // "tiempo real" pragmático mientras no hay push por WebSockets
  });

  const mutacionEtapa = useMutation({
    mutationFn: ({ leadId, etapa }: { leadId: string; etapa: EtapaLead }) =>
      actualizarEtapaLead(CLINICA_SLUG, leadId, etapa),
    onMutate: async ({ leadId, etapa }) => {
      await queryClient.cancelQueries({ queryKey: ['leads', CLINICA_SLUG] });
      const previos = queryClient.getQueryData<Lead[]>(['leads', CLINICA_SLUG]);
      queryClient.setQueryData<Lead[]>(['leads', CLINICA_SLUG], (actuales) =>
        actuales?.map((l) => (l.id === leadId ? { ...l, etapa } : l)),
      );
      return { previos };
    },
    onError: (_err, _vars, context) => {
      if (context?.previos) {
        queryClient.setQueryData(['leads', CLINICA_SLUG], context.previos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', CLINICA_SLUG] });
    },
  });

  const leadsPorEtapa = useMemo(() => {
    const mapa = new Map<EtapaLead, Lead[]>();
    for (const etapa of ETAPAS) mapa.set(etapa.value, []);
    for (const lead of leads) {
      mapa.get(lead.etapa)?.push(lead);
    }
    return mapa;
  }, [leads]);

  function manejarDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const leadId = String(active.id);
    const nuevaEtapa = over.id as EtapaLead;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.etapa === nuevaEtapa) return;

    mutacionEtapa.mutate({ leadId, etapa: nuevaEtapa });
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Embudo de ventas</h1>
          <p className="text-sm text-gray-500">
            {leads.length} leads · actualiza cada 5s · arrastra una tarjeta para cambiar de etapa
          </p>
        </div>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Cargando leads...</p>}
      {isError && (
        <p className="text-sm text-red-600">
          No se pudo conectar con la API. ¿Está corriendo en {import.meta.env.VITE_API_URL}?
        </p>
      )}

      {!isLoading && !isError && (
        <DndContext sensors={sensors} onDragEnd={manejarDragEnd}>
          <div className="flex flex-1 gap-3 overflow-x-auto pb-4">
            {ETAPAS.map(({ value, label }) => (
              <KanbanColumn key={value} etapa={value} label={label} leads={leadsPorEtapa.get(value) ?? []} />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}
