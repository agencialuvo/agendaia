import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CategoriaScore } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

interface PreguntaClave {
  pregunta: string;
  puntajes: Record<string, number>;
}

interface GuionScoringConfig {
  scoring: {
    preguntas_clave: PreguntaClave[];
    rangos: Record<'caliente' | 'tibio' | 'frio', { min: number; max: number }>;
  };
}

// Motor de puntaje caliente/tibio/frío — replica exacta de la tabla de puntos
// del guión de ventas, leída desde Clinica.guionConfig (ver config/guiones/*.json).
// Convención de campos del formulario: "pregunta_1", "pregunta_2", "pregunta_3",
// en el mismo orden que scoring.preguntas_clave en el guión.
@Injectable()
export class ScoringService {
  constructor(private readonly prisma: PrismaService) {}

  async puntuarLead(leadId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { clinica: true },
    });
    if (!lead) {
      throw new NotFoundException(`No existe un lead con id "${leadId}"`);
    }

    const guionConfig = lead.clinica.guionConfig as unknown as GuionScoringConfig | null;
    if (!guionConfig?.scoring) {
      throw new BadRequestException(
        `La clínica "${lead.clinica.nombre}" no tiene reglas de scoring cargadas en su guionConfig`,
      );
    }

    const respuestas = (lead.respuestasFormulario as Record<string, string> | null) ?? {};
    const { preguntas_clave, rangos } = guionConfig.scoring;

    let score = 0;
    preguntas_clave.forEach((pregunta, index) => {
      const respuesta = respuestas[`pregunta_${index + 1}`];
      if (respuesta && pregunta.puntajes[respuesta] !== undefined) {
        score += pregunta.puntajes[respuesta];
      }
    });

    const categoria = this.categorizar(score, rangos);

    return this.prisma.lead.update({
      where: { id: leadId },
      data: { score, categoriaScore: categoria, etapa: 'PUNTUADO' },
    });
  }

  private categorizar(
    score: number,
    rangos: GuionScoringConfig['scoring']['rangos'],
  ): CategoriaScore {
    if (score >= rangos.caliente.min && score <= rangos.caliente.max) return CategoriaScore.CALIENTE;
    if (score >= rangos.tibio.min && score <= rangos.tibio.max) return CategoriaScore.TIBIO;
    return CategoriaScore.FRIO;
  }
}
