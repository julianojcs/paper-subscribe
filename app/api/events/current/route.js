import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';

/**
 * @swagger
 * /api/events/current:
 *   get:
 *     description: Retorna eventos com inscrições abertas ou prestes a abrir
 *     parameters:
 *       - in: query
 *         name: upcoming
 *         schema:
 *           type: boolean
 *         description: Incluir eventos que começarão em breve (padrão true)
 *     responses:
 *       200:
 *         description: Lista de eventos atuais
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeUpcoming = searchParams.get('upcoming') !== 'false';

    const now = new Date();
    // Considera prestes a abrir eventos que começarão em até 30 dias
    const upcomingDate = new Date(now);
    upcomingDate.setDate(now.getDate() + 30);

    const events = await prisma.event.findMany({
      where: {
        isActive: true,
        // OR: [
        //   // Eventos com submissão aberta atualmente
        //   {
        //     submissionStart: {
        //       lte: now,
        //     },
        //     submissionEnd: {
        //       gte: now,
        //     },
        //   },
        //   // Eventos que começarão em breve (se includeUpcoming for true)
        //   ...(includeUpcoming ? [{
        //     submissionStart: {
        //       gt: now,
        //       lte: upcomingDate,
        //     },
        //   }] : []),
        // ],
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
          }
        },
        paperTypes: {
          select: {
            id: true,
            name: true,
          }
        },
      },
      orderBy: {
        submissionStart: 'asc',
      },
    });

    // Adicionar status de inscrição para cada evento
    const eventsWithStatus = events.map(event => {
      let submissionStatus;
      
      if (now < new Date(event.submissionStart)) {
        submissionStatus = 'upcoming';
      } else if (now <= new Date(event.submissionEnd)) {
        submissionStatus = 'open';
      } else {
        submissionStatus = 'closed';
      }
      
      // Calcular dias restantes
      let daysRemaining = null;
      if (submissionStatus === 'open') {
        const endDate = new Date(event.submissionEnd);
        const timeDiff = endDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
      } else if (submissionStatus === 'upcoming') {
        const startDate = new Date(event.submissionStart);
        const timeDiff = startDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
      }

      return {
        ...event,
        submissionStatus,
        daysRemaining
      };
    });

    return NextResponse.json(eventsWithStatus);
  } catch (error) {
    console.error('Erro ao buscar eventos atuais:', error);
    return NextResponse.json({ message: 'Erro ao buscar eventos atuais' }, { status: 500 });
  }
}