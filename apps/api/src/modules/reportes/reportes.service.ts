import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';

const DIAS_EXPIRACION_LINK_PUBLICO = 45;
const ETAPAS_AGENDADO_O_MAS = ['AGENDADO', 'CONFIRMADO', 'ATENDIDO', 'CONTROL_PROGRAMADO', 'GANADO'] as const;

function numero(valor: unknown): number {
  return valor === null || valor === undefined ? 0 : Number(valor);
}

// Calculadora de rentabilidad + reportes periódicos con link público tokenizado
// (docs/Plan_de_Implementacion_Paso_a_Paso.md, Etapa 5, puntos 18-19).
// El margen por servicio y el gasto real de campaña son input manual (mientras no
// hay acceso a Meta Ads API) — todo lo demás se calcula de datos reales del sistema.
@Injectable()
export class ReportesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantsService: TenantsService,
  ) {}

  health() {
    return { modulo: 'reportes', estado: 'ok' };
  }

  async generarReporte(clinicaSlug: string, periodoInicioStr: string, periodoFinStr: string) {
    const clinica = await this.tenantsService.findBySlug(clinicaSlug);
    const periodoInicio = new Date(periodoInicioStr);
    const periodoFin = new Date(periodoFinStr);

    const metricas = await this.calcularMetricas(clinica.id, periodoInicio, periodoFin);

    const tokenPublico = randomBytes(24).toString('hex');
    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + DIAS_EXPIRACION_LINK_PUBLICO);

    return this.prisma.reporteAnalisis.create({
      data: {
        clinicaId: clinica.id,
        periodoInicio,
        periodoFin,
        metricasJson: metricas as object,
        tokenPublico,
        expiraEn,
      },
    });
  }

  private async calcularMetricas(clinicaId: string, periodoInicio: Date, periodoFin: Date) {
    const leads = await this.prisma.lead.findMany({
      where: { clinicaId, createdAt: { gte: periodoInicio, lte: periodoFin } },
      include: { campana: true },
    });

    const ventas = await this.prisma.venta.findMany({
      where: { lead: { clinicaId }, fecha: { gte: periodoInicio, lte: periodoFin } },
      include: { servicio: true, lead: true },
    });

    const embudo = {
      totalLeads: leads.length,
      porCategoria: {
        CALIENTE: leads.filter((l) => l.categoriaScore === 'CALIENTE').length,
        TIBIO: leads.filter((l) => l.categoriaScore === 'TIBIO').length,
        FRIO: leads.filter((l) => l.categoriaScore === 'FRIO').length,
        SIN_PUNTUAR: leads.filter((l) => !l.categoriaScore).length,
      },
      agendados: leads.filter((l) => (ETAPAS_AGENDADO_O_MAS as readonly string[]).includes(l.etapa)).length,
      atendidos: leads.filter((l) => l.etapa === 'ATENDIDO' || l.etapa === 'CONTROL_PROGRAMADO').length,
      noShow: leads.filter((l) => l.etapa === 'NO_SHOW').length,
      ganados: leads.filter((l) => l.etapa === 'GANADO').length,
      perdidos: leads.filter((l) => l.etapa === 'PERDIDO').length,
      tasaAgendamiento: leads.length
        ? leads.filter((l) => (ETAPAS_AGENDADO_O_MAS as readonly string[]).includes(l.etapa)).length / leads.length
        : 0,
    };

    const totalFacturado = ventas.reduce((acc, v) => acc + numero(v.monto), 0);
    const utilidadEstimada = ventas.reduce((acc, v) => {
      const margen = numero(v.servicio.margenPorcentaje) / 100;
      return acc + numero(v.monto) * margen;
    }, 0);

    const ventasPorServicioMapa = new Map<
      string,
      { servicio: string; cantidad: number; facturado: number; utilidad: number }
    >();
    for (const venta of ventas) {
      const clave = venta.servicioId;
      const actual = ventasPorServicioMapa.get(clave) ?? {
        servicio: venta.servicio.nombre,
        cantidad: 0,
        facturado: 0,
        utilidad: 0,
      };
      actual.cantidad += 1;
      actual.facturado += numero(venta.monto);
      actual.utilidad += numero(venta.monto) * (numero(venta.servicio.margenPorcentaje) / 100);
      ventasPorServicioMapa.set(clave, actual);
    }

    const rentabilidad = {
      totalFacturado,
      utilidadEstimada,
      ticketPromedio: ventas.length ? totalFacturado / ventas.length : 0,
      cantidadVentas: ventas.length,
      porServicio: [...ventasPorServicioMapa.values()],
      serviciosSinMargenConfigurado: [
        ...new Set(ventas.filter((v) => v.servicio.margenPorcentaje === null).map((v) => v.servicio.nombre)),
      ],
    };

    const leadIdsConVenta = new Set(ventas.map((v) => v.leadId));
    const campanasMapa = new Map<
      string,
      {
        nombre: string;
        leadsGenerados: number;
        gastoRealMensual: number;
        ventasAtribuidas: number;
        ingresoAtribuido: number;
      }
    >();
    for (const lead of leads) {
      if (!lead.campanaId || !lead.campana) continue;
      const actual = campanasMapa.get(lead.campanaId) ?? {
        nombre: lead.campana.nombre,
        leadsGenerados: 0,
        gastoRealMensual: numero(lead.campana.gastoRealMensual),
        ventasAtribuidas: 0,
        ingresoAtribuido: 0,
      };
      actual.leadsGenerados += 1;
      if (leadIdsConVenta.has(lead.id)) {
        actual.ventasAtribuidas += 1;
        actual.ingresoAtribuido += ventas.filter((v) => v.leadId === lead.id).reduce((a, v) => a + numero(v.monto), 0);
      }
      campanasMapa.set(lead.campanaId, actual);
    }

    const marketing = [...campanasMapa.values()].map((c) => ({
      ...c,
      cpl: c.leadsGenerados && c.gastoRealMensual ? c.gastoRealMensual / c.leadsGenerados : null,
      roi: c.gastoRealMensual ? (c.ingresoAtribuido - c.gastoRealMensual) / c.gastoRealMensual : null,
    }));

    return { periodoInicio, periodoFin, embudo, rentabilidad, marketing };
  }

  async listarPorClinica(clinicaSlug: string) {
    const clinica = await this.tenantsService.findBySlug(clinicaSlug);
    return this.prisma.reporteAnalisis.findMany({
      where: { clinicaId: clinica.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        periodoInicio: true,
        periodoFin: true,
        tokenPublico: true,
        expiraEn: true,
        createdAt: true,
        metricasJson: true,
      },
    });
  }

  async obtenerPorToken(token: string) {
    const reporte = await this.prisma.reporteAnalisis.findUnique({ where: { tokenPublico: token } });
    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado o el link ya no es válido');
    }
    if (reporte.expiraEn && reporte.expiraEn.getTime() < Date.now()) {
      throw new NotFoundException('Este link de reporte ya expiró');
    }
    return reporte;
  }

  // Genera el reporte quincenal automático (1 y 16 de cada mes) para todas las clínicas,
  // cubriendo el periodo que acaba de cerrar.
  async generarReportesQuincenales() {
    const clinicas = await this.prisma.clinica.findMany();
    const hoy = new Date();
    const esPrimeraQuincena = hoy.getDate() <= 15;

    const periodoFin = new Date(hoy);
    periodoFin.setDate(esPrimeraQuincena ? 0 : 15); // día 0 del mes actual = último día del mes anterior
    periodoFin.setHours(23, 59, 59, 999);

    const periodoInicio = new Date(periodoFin);
    periodoInicio.setDate(periodoInicio.getDate() - 14);
    periodoInicio.setHours(0, 0, 0, 0);

    for (const clinica of clinicas) {
      await this.generarReporte(clinica.slug, periodoInicio.toISOString(), periodoFin.toISOString());
    }
  }
}
