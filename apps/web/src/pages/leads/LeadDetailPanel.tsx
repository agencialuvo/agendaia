import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { getConversacionesPorLead } from '../../lib/conversaciones';
import { getCitasPorLead } from '../../lib/citas';
import { getVentasPorLead } from '../../lib/ventas';
import { getFichasControlPorLead } from '../../lib/fichasControl';
import { COLOR_CATEGORIA, type Lead } from '../../types';

function bloque(titulo: string, children: React.ReactNode) {
  return (
    <div className="mb-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{titulo}</h3>
      {children}
    </div>
  );
}

export default function LeadDetailPanel({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { data: conversaciones = [] } = useQuery({
    queryKey: ['conversaciones', lead.id],
    queryFn: () => getConversacionesPorLead(lead.id),
  });
  const { data: citas = [] } = useQuery({ queryKey: ['citas-lead', lead.id], queryFn: () => getCitasPorLead(lead.id) });
  const { data: ventas = [] } = useQuery({ queryKey: ['ventas-lead', lead.id], queryFn: () => getVentasPorLead(lead.id) });
  const { data: fichas = [] } = useQuery({
    queryKey: ['fichas-lead', lead.id],
    queryFn: () => getFichasControlPorLead(lead.id),
  });

  const mensajes = conversaciones.flatMap((c) => c.mensajes);

  return (
    <div className="fixed inset-0 z-20 flex justify-end bg-black/20" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{lead.nombreCompleto ?? 'Sin nombre'}</h2>
            <p className="text-sm text-gray-500">{lead.telefono}</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        {bloque(
          'Datos generales',
          <div className="space-y-1 text-sm text-gray-700">
            <p>
              Categoría:{' '}
              {lead.categoriaScore ? (
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${COLOR_CATEGORIA[lead.categoriaScore]}`}
                >
                  {lead.categoriaScore}
                </span>
              ) : (
                'Sin puntuar'
              )}
              {lead.score !== null && lead.score !== undefined && <span className="ml-2 text-gray-400">({lead.score} pts)</span>}
            </p>
            <p>Etapa: {lead.etapa}</p>
            <p>Origen: {lead.origen === 'meta_lead_ads' ? 'Meta Lead Ads' : lead.origen === 'whatsapp_organico' ? 'WhatsApp orgánico' : (lead.origen ?? '—')}</p>
            {lead.campana && <p>Campaña: {lead.campana.nombre}</p>}
            <p>Creado: {new Date(lead.createdAt).toLocaleString('es-PE')}</p>
          </div>,
        )}

        {lead.respuestasFormulario &&
          bloque(
            'Respuestas del formulario',
            <div className="space-y-1 text-sm text-gray-700">
              {Object.entries(lead.respuestasFormulario).map(([clave, valor]) => (
                <p key={clave}>
                  <span className="text-gray-400">{clave}:</span> {valor}
                </p>
              ))}
            </div>,
          )}

        {bloque(
          `Conversación (${mensajes.length})`,
          mensajes.length === 0 ? (
            <p className="text-sm text-gray-400">Sin mensajes todavía.</p>
          ) : (
            <div className="space-y-2">
              {mensajes.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    m.remitente === 'lead' ? 'bg-gray-100 text-gray-800' : 'bg-indigo-50 text-indigo-900'
                  }`}
                >
                  <p>{m.texto}</p>
                  <p className="mt-1 text-[10px] text-gray-400">
                    {m.remitente} · {new Date(m.timestamp).toLocaleString('es-PE')}
                  </p>
                </div>
              ))}
            </div>
          ),
        )}

        {bloque(
          `Citas (${citas.length})`,
          citas.length === 0 ? (
            <p className="text-sm text-gray-400">Sin citas registradas.</p>
          ) : (
            <div className="space-y-2">
              {citas.map((c) => (
                <div key={c.id} className="rounded-lg border border-gray-200 p-2 text-sm">
                  <p className="font-medium text-gray-800">{c.servicio?.nombre ?? c.motivoConsulta}</p>
                  <p className="text-gray-500">
                    {new Date(c.fecha).toLocaleDateString('es-PE')} · {c.hora} · {c.estado}
                  </p>
                </div>
              ))}
            </div>
          ),
        )}

        {bloque(
          `Fichas de control (${fichas.length})`,
          fichas.length === 0 ? (
            <p className="text-sm text-gray-400">Sin fichas registradas.</p>
          ) : (
            <div className="space-y-2">
              {fichas.map((f) => (
                <div key={f.id} className="rounded-lg border border-gray-200 p-2 text-sm">
                  <p className="font-medium text-gray-800">{f.productoMarca ?? 'Tratamiento aplicado'}</p>
                  {f.fechaProximoControl && (
                    <p className="text-gray-500">
                      Próximo control: {new Date(f.fechaProximoControl).toLocaleDateString('es-PE')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ),
        )}

        {bloque(
          `Ventas (${ventas.length})`,
          ventas.length === 0 ? (
            <p className="text-sm text-gray-400">Sin ventas registradas.</p>
          ) : (
            <div className="space-y-2">
              {ventas.map((v) => (
                <div key={v.id} className="flex justify-between rounded-lg border border-gray-200 p-2 text-sm">
                  <span>{v.servicio?.nombre ?? 'Servicio'}</span>
                  <span className="font-medium">S/ {v.monto}</span>
                </div>
              ))}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
