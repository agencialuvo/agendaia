import { Test } from '@nestjs/testing';
import { CategoriaScore } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ScoringService } from './scoring.service';

const guionVelia = JSON.parse(
  readFileSync(join(__dirname, '../../../../../config/guiones/velia.json'), 'utf-8'),
);

function crearLeadFalso(respuestasFormulario: Record<string, string>) {
  return {
    id: 'lead-1',
    respuestasFormulario,
    clinica: { nombre: 'VELIA Centro Estético', guionConfig: guionVelia },
  };
}

describe('ScoringService', () => {
  let service: ScoringService;
  const prismaMock = {
    lead: {
      findUnique: jest.fn(),
      update: jest.fn((args: { data: Record<string, unknown> }) => args.data),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [ScoringService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = moduleRef.get(ScoringService);
  });

  it('clasifica como CALIENTE cuando responde el máximo puntaje (6-7)', async () => {
    prismaMock.lead.findUnique.mockResolvedValue(
      crearLeadFalso({
        pregunta_1: 'Esta semana',
        pregunta_2: 'Sí, estoy de acuerdo',
        pregunta_3: 'Sí, puedo asistir',
      }),
    );

    const resultado = await service.puntuarLead('lead-1');

    expect(resultado.score).toBe(7);
    expect(resultado.categoriaScore).toBe(CategoriaScore.CALIENTE);
    expect(resultado.etapa).toBe('PUNTUADO');
  });

  it('clasifica como TIBIO en un puntaje intermedio (3-5)', async () => {
    prismaMock.lead.findUnique.mockResolvedValue(
      crearLeadFalso({
        pregunta_1: 'La próxima semana si hay disponibilidad',
        pregunta_2: 'Sí, estoy de acuerdo',
        pregunta_3: 'Necesito confirmar disponibilidad',
      }),
    );

    const resultado = await service.puntuarLead('lead-1');

    expect(resultado.score).toBe(4);
    expect(resultado.categoriaScore).toBe(CategoriaScore.TIBIO);
  });

  it('clasifica como FRIO cuando todas las respuestas son de menor intención (0-2)', async () => {
    prismaMock.lead.findUnique.mockResolvedValue(
      crearLeadFalso({
        pregunta_1: 'Necesito que me indiquen horarios',
        pregunta_2: 'Necesito que me expliquen antes de agendar',
        pregunta_3: 'Necesito confirmar disponibilidad',
      }),
    );

    const resultado = await service.puntuarLead('lead-1');

    expect(resultado.score).toBe(1);
    expect(resultado.categoriaScore).toBe(CategoriaScore.FRIO);
  });

  it('ignora respuestas faltantes en vez de fallar (formulario incompleto)', async () => {
    prismaMock.lead.findUnique.mockResolvedValue(
      crearLeadFalso({ pregunta_1: 'Esta semana' }),
    );

    const resultado = await service.puntuarLead('lead-1');

    expect(resultado.score).toBe(3);
    expect(resultado.categoriaScore).toBe(CategoriaScore.TIBIO);
  });
});
