// Tipos compartidos del frontend — idealmente sincronizados con los DTOs del backend.

export type CategoriaScore = 'CALIENTE' | 'TIBIO' | 'FRIO';

export type EtapaLead =
  | 'CREATED'
  | 'PUNTUADO'
  | 'CONTACTADO'
  | 'EN_CONVERSACION'
  | 'AGENDADO'
  | 'CONFIRMADO'
  | 'ATENDIDO'
  | 'NO_SHOW'
  | 'CONTROL_PROGRAMADO'
  | 'GANADO'
  | 'PERDIDO'
  | 'EN_RETARGETING'
  | 'REQUIERE_HUMANO';

export interface Campana {
  id: string;
  nombre: string;
  plataforma?: string | null;
  esOrganico: boolean;
  presupuestoMensual?: string | null;
  gastoRealMensual?: string | null;
}

export interface Lead {
  id: string;
  nombreCompleto?: string | null;
  telefono: string;
  score?: number | null;
  categoriaScore?: CategoriaScore | null;
  etapa: EtapaLead;
  origen?: string | null;
  respuestasFormulario?: Record<string, string> | null;
  campana?: Campana | null;
  createdAt: string;
}

export type TipoCita = 'EVALUACION' | 'TRATAMIENTO_DIRECTO';
export type EstadoCita = 'PROGRAMADA' | 'REPROGRAMADA' | 'CONFIRMADA' | 'ATENDIDA' | 'NO_SHOW' | 'CANCELADA';

export interface Servicio {
  id: string;
  slug: string;
  nombre: string;
  servicioPrincipal: boolean;
  requiereEvaluacionPrevia: boolean;
  margenPorcentaje?: string | null;
  activo: boolean;
}

export interface Doctor {
  id: string;
  nombre: string;
}

export interface Cita {
  id: string;
  leadId: string;
  lead?: Lead;
  servicioId: string;
  servicio?: Servicio;
  doctorId?: string | null;
  doctor?: Doctor | null;
  motivoConsulta: string;
  fecha: string;
  hora: string;
  tipo: TipoCita;
  estado: EstadoCita;
  googleCalendarEventId?: string | null;
}

export interface Mensaje {
  id: string;
  conversacionId: string;
  remitente: string;
  texto?: string | null;
  generadoPor: 'ia' | 'humano' | 'sistema';
  timestamp: string;
}

export interface Conversacion {
  id: string;
  leadId: string;
  canal: string;
  modo: 'BOT' | 'HUMANO';
  createdAt: string;
  mensajes: Mensaje[];
}

export interface FichaControl {
  id: string;
  citaId: string;
  leadId: string;
  documentoIdentidad?: string | null;
  alergias?: string | null;
  enfermedadesRelevantes?: string | null;
  medicacionActual?: string | null;
  consentimientoInformado: boolean;
  autorizaUsoImagenMarketing: boolean;
  productoMarca?: string | null;
  numeroLote?: string | null;
  unidadesDosis?: string | null;
  zonasTratadas?: string | null;
  reaccionesAdversas?: string | null;
  indicacionesPostTratamiento?: string | null;
  fechaProximoControl?: string | null;
  resultadoControl?: string | null;
  montoCobrado?: string | null;
  formaPago?: string | null;
  createdAt: string;
  cita?: Cita;
}

export interface Venta {
  id: string;
  leadId: string;
  servicioId: string;
  servicio?: Servicio;
  lead?: Lead;
  marca?: string | null;
  monto: string;
  fecha: string;
}

export interface MetricasReporte {
  periodoInicio: string;
  periodoFin: string;
  embudo: {
    totalLeads: number;
    porCategoria: { CALIENTE: number; TIBIO: number; FRIO: number; SIN_PUNTUAR: number };
    agendados: number;
    atendidos: number;
    noShow: number;
    ganados: number;
    perdidos: number;
    tasaAgendamiento: number;
  };
  rentabilidad: {
    totalFacturado: number;
    utilidadEstimada: number;
    ticketPromedio: number;
    cantidadVentas: number;
    porServicio: { servicio: string; cantidad: number; facturado: number; utilidad: number }[];
    serviciosSinMargenConfigurado: string[];
  };
  marketing: {
    nombre: string;
    leadsGenerados: number;
    gastoRealMensual: number;
    ventasAtribuidas: number;
    ingresoAtribuido: number;
    cpl: number | null;
    roi: number | null;
  }[];
}

export interface ReporteAnalisis {
  id: string;
  periodoInicio: string;
  periodoFin: string;
  tokenPublico: string;
  expiraEn?: string | null;
  createdAt: string;
  metricasJson?: MetricasReporte;
}

export type TipoUsuario = 'PLATAFORMA' | 'CLINICA';
export type RolPlataforma = 'ADMIN_MASTER' | 'SUPERVISOR' | 'SOPORTE';
export type RolClinica = 'ADMIN_MASTER' | 'ADMIN' | 'ASESOR' | 'DOCTOR' | 'RECEPCION';

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  tipoUsuario: TipoUsuario;
  rolPlataforma?: RolPlataforma | null;
  rolClinica?: RolClinica | null;
  clinicaId?: string | null;
  createdAt: string;
}

// Orden y etiquetas de las columnas del Kanban (ver docs/Arquitectura_Sistema_VELIA_CRM_IA.md §5).
export const ETAPAS: { value: EtapaLead; label: string }[] = [
  { value: 'CREATED', label: 'Nuevos' },
  { value: 'PUNTUADO', label: 'Puntuados' },
  { value: 'CONTACTADO', label: 'Contactados' },
  { value: 'EN_CONVERSACION', label: 'En conversación' },
  { value: 'REQUIERE_HUMANO', label: 'Requiere humano' },
  { value: 'AGENDADO', label: 'Agendados' },
  { value: 'CONFIRMADO', label: 'Confirmados' },
  { value: 'ATENDIDO', label: 'Atendidos' },
  { value: 'NO_SHOW', label: 'No-show' },
  { value: 'CONTROL_PROGRAMADO', label: 'Control' },
  { value: 'EN_RETARGETING', label: 'Retargeting' },
  { value: 'GANADO', label: 'Ganados' },
  { value: 'PERDIDO', label: 'Perdidos' },
];

export const COLOR_CATEGORIA: Record<CategoriaScore, string> = {
  CALIENTE: 'bg-red-100 text-red-700 border-red-300',
  TIBIO: 'bg-amber-100 text-amber-700 border-amber-300',
  FRIO: 'bg-sky-100 text-sky-700 border-sky-300',
};
