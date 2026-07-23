import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { ReporteAnalisis } from '../../types';

const COLORES_CATEGORIA = { CALIENTE: '#ef4444', TIBIO: '#f59e0b', FRIO: '#0ea5e9', SIN_PUNTUAR: '#9ca3af' };

function tarjeta(titulo: string, valor: string, nota?: string) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{valor}</p>
      {nota && <p className="mt-1 text-xs text-gray-400">{nota}</p>}
    </div>
  );
}

export default function ReporteVista({ reporte }: { reporte: ReporteAnalisis }) {
  const m = reporte.metricasJson;
  if (!m) return <p className="text-sm text-gray-500">Este reporte no tiene métricas calculadas.</p>;

  const datosCategoria = Object.entries(m.embudo.porCategoria)
    .filter(([, valor]) => valor > 0)
    .map(([nombre, value]) => ({ nombre, value }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-500">
          Periodo: {new Date(m.periodoInicio).toLocaleDateString('es-PE')} —{' '}
          {new Date(m.periodoFin).toLocaleDateString('es-PE')}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tarjeta('Leads captados', String(m.embudo.totalLeads))}
        {tarjeta('Tasa de agendamiento', `${(m.embudo.tasaAgendamiento * 100).toFixed(0)}%`)}
        {tarjeta('Facturado', `S/ ${m.rentabilidad.totalFacturado.toFixed(2)}`)}
        {tarjeta('Utilidad estimada', `S/ ${m.rentabilidad.utilidadEstimada.toFixed(2)}`)}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Leads por categoría</h3>
          {datosCategoria.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos en este periodo.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={datosCategoria} dataKey="value" nameKey="nombre" outerRadius={70} label>
                  {datosCategoria.map((d) => (
                    <Cell key={d.nombre} fill={COLORES_CATEGORIA[d.nombre as keyof typeof COLORES_CATEGORIA]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Facturación por servicio</h3>
          {m.rentabilidad.porServicio.length === 0 ? (
            <p className="text-sm text-gray-400">Sin ventas en este periodo.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={m.rentabilidad.porServicio}>
                <XAxis dataKey="servicio" tick={{ fontSize: 10 }} hide />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="facturado" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Embudo del periodo</h3>
        <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 sm:grid-cols-6">
          <p>Agendados: <b>{m.embudo.agendados}</b></p>
          <p>Atendidos: <b>{m.embudo.atendidos}</b></p>
          <p>No-show: <b>{m.embudo.noShow}</b></p>
          <p>Ganados: <b>{m.embudo.ganados}</b></p>
          <p>Perdidos: <b>{m.embudo.perdidos}</b></p>
          <p>Ticket prom.: <b>S/ {m.rentabilidad.ticketPromedio.toFixed(2)}</b></p>
        </div>
      </div>

      {m.rentabilidad.serviciosSinMargenConfigurado.length > 0 && (
        <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-700">
          Sin margen configurado (utilidad no calculada): {m.rentabilidad.serviciosSinMargenConfigurado.join(', ')}
        </p>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Marketing por campaña</h3>
        {m.marketing.length === 0 ? (
          <p className="text-sm text-gray-400">Sin campañas con leads en este periodo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-400">
                  <th className="py-1 pr-4">Campaña</th>
                  <th className="py-1 pr-4">Leads</th>
                  <th className="py-1 pr-4">Gasto</th>
                  <th className="py-1 pr-4">CPL</th>
                  <th className="py-1 pr-4">Ventas</th>
                  <th className="py-1 pr-4">ROI</th>
                </tr>
              </thead>
              <tbody>
                {m.marketing.map((c) => (
                  <tr key={c.nombre} className="border-t border-gray-100">
                    <td className="py-1.5 pr-4">{c.nombre}</td>
                    <td className="py-1.5 pr-4">{c.leadsGenerados}</td>
                    <td className="py-1.5 pr-4">S/ {c.gastoRealMensual.toFixed(2)}</td>
                    <td className="py-1.5 pr-4">{c.cpl ? `S/ ${c.cpl.toFixed(2)}` : '—'}</td>
                    <td className="py-1.5 pr-4">{c.ventasAtribuidas}</td>
                    <td className="py-1.5 pr-4">{c.roi !== null ? `${(c.roi * 100).toFixed(0)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
