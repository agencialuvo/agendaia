import { useDroppable } from '@dnd-kit/core';
import type { EtapaLead, Lead } from '../../types';
import LeadCard from './LeadCard';

export default function KanbanColumn({
  etapa,
  label,
  leads,
}: {
  etapa: EtapaLead;
  label: string;
  leads: Lead[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-lg border ${isOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <h2 className="text-sm font-semibold text-gray-700">{label}</h2>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
          {leads.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2" style={{ maxHeight: '70vh' }}>
        {leads.length === 0 && (
          <p className="mt-4 text-center text-xs text-gray-400">Sin leads en esta etapa</p>
        )}
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}
