import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { authOptions } from "../../../auth/[...nextauth]/route";

/**
 * @swagger
 * /api/user/events/{id}:
 *   get:
 *     description: Retorna detalhes de um evento específico, verificando se o usuário tem acesso a ele
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
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão para acessar este evento
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
      return NextResponse.json({ message: "ID do evento não fornecido" }, { status: 400 });
    }

    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Não autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Primeiro, verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: {
        id: id,
      },
      include: {
        organization: true,
      },
    });

    if (!event) {
      return NextResponse.json({ message: "Evento não encontrado" }, { status: 404 });
    }

    // Verificar se o usuário tem acesso a este evento através da organização
    const membershipCheck = await prisma.organizationMember.findFirst({
      where: {
        userId: userId,
        organizationId: event.organizationId,
      },
      select: {
        role: true,
      },
    });

    // Se não existir uma associação, o usuário não tem permissão
    if (!membershipCheck) {
      // Verificamos se o evento é público antes de negar acesso
      if (!event.isActive) {
        return NextResponse.json({ message: "Sem permissão para acessar este evento" }, { status: 403 });
      }
    }

    // Buscar detalhes completos do evento
    const eventDetails = await prisma.event.findUnique({
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
            description: true,
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

    // Adicionar informações sobre o papel do usuário neste evento
    const userRole = membershipCheck?.role || 'VISITOR';

    // Calcular status atual do evento
    const now = new Date();
    let submissionStatus;

    if (!eventDetails.submissionStart || !eventDetails.submissionEnd) {
      submissionStatus = 'unknown';
    } else if (now < new Date(eventDetails.submissionStart)) {
      submissionStatus = 'upcoming';
    } else if (now <= new Date(eventDetails.submissionEnd)) {
      submissionStatus = 'open';
    } else {
      submissionStatus = 'closed';
    }

    // Calcular dias restantes
    let daysRemaining = null;
    if (submissionStatus === 'open' && eventDetails.submissionEnd) {
      const endDate = new Date(eventDetails.submissionEnd);
      const timeDiff = endDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    } else if (submissionStatus === 'upcoming' && eventDetails.submissionStart) {
      const startDate = new Date(eventDetails.submissionStart);
      const timeDiff = startDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    // Verificar se o usuário tem trabalhos enviados para este evento
    const userSubmissions = await prisma.paper.count({
      where: {
        eventId: id,
        authors: {
          some: {
            userId: userId,
          }
        }
      }
    });

    // Construir resposta enriquecida com metadados
    const response = {
      ...eventDetails,
      userRole,
      submissionStatus,
      daysRemaining,
      userSubmissions,
      userCanSubmit: submissionStatus === 'open', // Simplificado, pode ter regras mais complexas
      userCanReview: ['ADMIN', 'REVIEWER', 'EDITOR'].includes(userRole) && 
                     eventDetails.reviewStart && now >= new Date(eventDetails.reviewStart),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`Erro ao buscar evento (ID: ${params?.id}):`, error);
    return NextResponse.json(
      { message: "Erro ao processar a solicitação", error: error.message },
      { status: 500 }
    );
  }
}