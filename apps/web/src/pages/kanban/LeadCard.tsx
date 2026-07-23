import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { COLOR_CATEGORIA, type Lead } from '../../types';

function tiempoRelativo(iso: string): string {
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return 'ahora mismo';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  return `hace ${Math.floor(horas / 24)} d`;
}

export default function LeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-gray-900">
          {lead.nombreCompleto ?? 'Sin nombre'}
        </span>
        {lead.categoriaScore && (
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${COLOR_CATEGORIA[lead.categoriaScore]}`}
          >
            {lead.categoriaScore}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-500">{lead.telefono}</p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
        <span>{lead.origen === 'meta_lead_ads' ? 'Meta Lead Ads' : 'WhatsApp orgánico'}</span>
        <span>{tiempoRelativo(lead.createdAt)}</span>
      </div>
    </div>
  );
}
