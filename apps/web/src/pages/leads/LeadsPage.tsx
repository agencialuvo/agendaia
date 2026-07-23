import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLeads } from '../../lib/leads';
import { COLOR_CATEGORIA, ETAPAS, type CategoriaScore, type EtapaLead, type Lead } from '../../types';
import LeadDetailPanel from './LeadDetailPanel';

const CLINICA_SLUG = 'velia';

function tiempoRelativo(iso: string): string {
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return 'ahora mismo';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  return `hace ${Math.floor(horas / 24)} d`;
}

export default function LeadsPage() {
  const [filtroEtapa, setFiltroEtapa] = useState<EtapaLead | 'TODAS'>('TODAS');
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaScore | 'TODAS'>('TODAS');
  const [leadSeleccionado, setLeadSeleccionado] = useState<Lead | null>(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', CLINICA_SLUG],
    queryFn: () => getLeads(CLINICA_SLUG),
  });

  const leadsFiltrados = useMemo(
    () =>
      leads.filter(
        (l) =>
          (filtroEtapa === 'TODAS' || l.etapa === filtroEtapa) &&
          (filtroCategoria === 'TODAS' || l.categoriaScore === filtroCategoria),
      ),
    [leads, filtroEtapa, filtroCategoria],
  );

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500">{leadsFiltrados.length} de {leads.length} leads</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filtroEtapa}
            onChange={(e) => setFiltroEtapa(e.target.value as EtapaLead | 'TODAS')}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="TODAS">Todas las etapas</option>
            {ETAPAS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value as CategoriaScore | 'TODAS')}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="TODAS">Todas las categorías</option>
            <option value="CALIENTE">Caliente</option>
            <option value="TIBIO">Tibio</option>
            <option value="FRIO">Frío</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Cargando leads...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Nombre</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Teléfono</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Categoría</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Etapa</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Origen</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {leadsFiltrados.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setLeadSeleccionado(lead)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="px-4 py-2 font-medium text-gray-900">{lead.nombreCompleto ?? 'Sin nombre'}</td>
                  <td className="px-4 py-2 text-gray-500">{lead.telefono}</td>
                  <td className="px-4 py-2">
                    {lead.categoriaScore ? (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${COLOR_CATEGORIA[lead.categoriaScore]}`}
                      >
                        {lead.categoriaScore}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-700">{ETAPAS.find((e) => e.value === lead.etapa)?.label ?? lead.etapa}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {lead.origen === 'meta_lead_ads' ? 'Meta Lead Ads' : lead.origen === 'whatsapp_organico' ? 'WhatsApp' : (lead.origen ?? '—')}
                  </td>
                  <td className="px-4 py-2 text-gray-400">{tiempoRelativo(lead.createdAt)}</td>
                </tr>
              ))}
              {leadsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                    No hay leads que coincidan con el filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {leadSeleccionado && <LeadDetailPanel lead={leadSeleccionado} onClose={() => setLeadSeleccionado(null)} />}
    </div>
  );
}
