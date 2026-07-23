import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ConversacionesService } from '../conversaciones/conversaciones.service';
import { CitasService } from '../citas/citas.service';

interface GuionConfig {
  clinica: {
    nombre: string;
    agente_ia: { nombre: string; tono: string };
    ubicacion: { direccion: string };
  };
  guiones_primer_contacto: Record<string, { variantes: string[] }>;
  apertura_diagnostico: { variantes: string[] };
  objeciones: { disparador: string; respuesta: string }[];
  recordatorios: Record<string, string>;
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'consultar_disponibilidad',
    description:
      'Consulta los próximos horarios disponibles para agendar una cita, según la regla de horarios de la clínica. Úsala siempre antes de ofrecer una fecha — nunca inventes horarios de memoria.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'agendar_cita',
    description:
      'Agenda la cita una vez el lead confirmó fecha y hora de las opciones que le diste con consultar_disponibilidad.',
    input_schema: {
      type: 'object',
      properties: {
        servicio_nombre: {
          type: 'string',
          description: 'Nombre del servicio que pidió el lead (ej. "Bótox", "full face", "evaluación")',
        },
        fecha: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
        hora: { type: 'string', description: 'Hora en formato HH:mm' },
        motivo_consulta: { type: 'string', description: 'Zona o motivo que el lead quiere tratar' },
      },
      required: ['servicio_nombre', 'fecha', 'hora', 'motivo_consulta'],
    },
  },
  {
    name: 'escalar_a_humano',
    description:
      'Pausa el bot y notifica a un agente humano. Úsala si el lead expresa molestia, pide hablar con una persona, hace una pregunta médica fuera del guión de objeciones, o si no tienes confianza en cómo responder.',
    input_schema: {
      type: 'object',
      properties: { motivo: { type: 'string' } },
      required: ['motivo'],
    },
  },
];

// Motor conversacional: orquesta el contexto (guión, score, historial), llama a Claude
// con tool use, y ejecuta las tools (consultar_disponibilidad, agendar_cita, escalar_a_humano).
@Injectable()
export class IaService {
  private readonly logger = new Logger(IaService.name);
  private client: Anthropic | null = null;

  constructor(
    private readonly conversacionesService: ConversacionesService,
    private readonly citasService: CitasService,
  ) {}

  private getClient(): Anthropic {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        'ANTHROPIC_API_KEY no está configurada. Agrégala al .env para activar el motor conversacional.',
      );
    }
    if (!this.client) {
      this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return this.client;
  }

  private construirSystemPrompt(guion: GuionConfig, categoriaScore: string | null): string {
    const guionContacto = categoriaScore
      ? guion.guiones_primer_contacto[categoriaScore.toLowerCase()]
      : undefined;

    const objeciones = guion.objeciones
      .map((o) => `- Si dice algo como "${o.disparador}": ${o.respuesta}`)
      .join('\n');

    return `Eres ${guion.clinica.agente_ia.nombre}, agente comercial de ${guion.clinica.nombre} por WhatsApp.
Tono: ${guion.clinica.agente_ia.tono}.
Ubicación de la clínica: ${guion.clinica.ubicacion.direccion}.

Score del lead: ${categoriaScore ?? 'sin puntuar todavía'}.
${guionContacto ? `Variantes de primer contacto para este score:\n${guionContacto.variantes.map((v) => `- ${v}`).join('\n')}` : ''}

Banco de objeciones (usa la respuesta más cercana al mensaje del lead, no la copies literal si no calza):
${objeciones}

Reglas duras (no negociables):
- Nunca calcules horarios de memoria — siempre usa la tool consultar_disponibilidad antes de ofrecer una fecha.
- Nunca dés indicaciones médicas más allá del banco de objeciones — cualquier pregunta clínica fuera de eso, usa escalar_a_humano.
- Si el lead expresa molestia, pide hablar con una persona, o no tienes confianza en tu respuesta, usa escalar_a_humano de inmediato y no sigas escribiendo.
- Responde siempre en español, en mensajes cortos como los de WhatsApp (no párrafos largos).`;
  }

  async generarRespuesta(conversacionId: string): Promise<{ texto: string | null }> {
    const conversacion = await this.conversacionesService.findConversacionConContexto(conversacionId);

    if (conversacion.modo === 'HUMANO') {
      return { texto: null };
    }

    const { lead, mensajes } = conversacion;
    const guion = lead.clinica.guionConfig as unknown as GuionConfig;

    const historial: Anthropic.MessageParam[] = mensajes.map((m) => ({
      role: m.remitente === 'lead' ? 'user' : 'assistant',
      content: m.texto ?? '',
    }));

    const client = this.getClient();
    const model = process.env.IA_MODEL ?? 'claude-opus-4-8';
    const systemPrompt = this.construirSystemPrompt(guion, lead.categoriaScore);

    let messages = historial;
    let respuestaFinal: Anthropic.Message | null = null;
    const toolCallsRegistrados: unknown[] = [];

    for (let iteracion = 0; iteracion < 5; iteracion++) {
      const response = await client.messages.create({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        tools: TOOLS,
        messages,
      });

      respuestaFinal = response;

      if (response.stop_reason !== 'tool_use') {
        break;
      }

      messages = [...messages, { role: 'assistant', content: response.content }];

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;
        toolCallsRegistrados.push({ tool: block.name, input: block.input });
        const resultado = await this.ejecutarTool(block.name, block.input, {
          clinicaSlug: lead.clinica.slug,
          leadId: lead.id,
          conversacionId,
        });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(resultado),
        });
      }
      messages = [...messages, { role: 'user', content: toolResults }];
    }

    // Si escalar_a_humano se ejecutó, el bot no debe responder más en esta conversación.
    const conversacionActualizada = await this.conversacionesService.findConversacionConContexto(conversacionId);
    if (conversacionActualizada.modo === 'HUMANO') {
      return { texto: null };
    }

    const texto =
      respuestaFinal?.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? null;

    if (texto) {
      await this.conversacionesService.agregarMensaje(conversacionId, 'bot', texto, 'ia', toolCallsRegistrados);
    }

    return { texto };
  }

  private async ejecutarTool(
    nombre: string,
    input: unknown,
    ctx: { clinicaSlug: string; leadId: string; conversacionId: string },
  ): Promise<unknown> {
    switch (nombre) {
      case 'consultar_disponibilidad':
        return this.citasService.consultarDisponibilidad(ctx.clinicaSlug);

      case 'agendar_cita': {
        const params = input as {
          servicio_nombre: string;
          fecha: string;
          hora: string;
          motivo_consulta: string;
        };
        const cita = await this.citasService.agendarCita({
          clinicaSlug: ctx.clinicaSlug,
          leadId: ctx.leadId,
          servicioNombre: params.servicio_nombre,
          fecha: params.fecha,
          hora: params.hora,
          motivoConsulta: params.motivo_consulta,
        });
        return { agendada: true, citaId: cita.id };
      }

      case 'escalar_a_humano': {
        await this.conversacionesService.escalarAHumano(ctx.conversacionId);
        this.logger.warn(`Conversación ${ctx.conversacionId} escalada a humano: ${JSON.stringify(input)}`);
        return { escalado: true };
      }

      default:
        return { error: `Tool desconocida: ${nombre}` };
    }
  }
}
