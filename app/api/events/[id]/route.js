import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     description: Retorna detalhes de um evento específico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do evento
 *     responses:
 *       200:
 *         description: Detalhes do evento
 *       404:
 *         description: Evento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request, context) {
  try {
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: 'ID do evento não fornecido' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: {
        id: id,
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
        organizationId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          }
        },
        areas: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        },
        paperTypes: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        },
        eventFields: {
          select: {
            id: true,
            label: true,
            helperText: true,
            defaultValue: true,
            placeholder: true,
            isRequired: true,
            fieldType: true,
            fieldOptions: true,
            maxLength: true,
            minLength: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: 'asc'
          }
        },
        _count: {
          select: {
            papers: true,
          }
        }
      },
    });

    if (!event) {
      return NextResponse.json({ message: 'Evento não encontrado' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.log('Erro ao buscar evento:', error);
    return NextResponse.json({ message: 'Erro ao buscar evento' }, { status: 500 });
  }
}