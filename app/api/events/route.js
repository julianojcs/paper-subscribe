import { NextResponse } from 'next/server';
import { prisma } from '../../lib/db';

/**
 * @swagger
 * /api/events:
 *   get:
 *     description: Retorna todos os eventos ativos
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filtrar apenas eventos ativos (padrão true)
 *     responses:
 *       200:
 *         description: Lista de eventos
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeParam = searchParams.get('active');
    const active = activeParam !== 'false'; // Se não for explicitamente falso, retorna eventos ativos

    const events = await prisma.event.findMany({
      where: {
        isActive: active,
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        description: true,
        startDate: true,
        endDate: true,
        submissionStart: true,
        submissionEnd: true,
        reviewStart: true,
        reviewEnd: true,
        maxAuthors: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            areas: true,
            paperTypes: true,
            papers: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return NextResponse.json({ message: 'Erro ao buscar eventos' }, { status: 500 });
  }
}