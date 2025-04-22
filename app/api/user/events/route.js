import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { authOptions } from "../../auth/[...nextauth]/route";

/**
 * @swagger
 * /api/user/events:
 *   get:
 *     description: Retorna todos os eventos relacionados ao usuário autenticado
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filtrar apenas eventos ativos (padrão true)
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filtrar por papel do usuário na organização (ADMIN, REVIEWER, EDITOR)
 *     responses:
 *       200:
 *         description: Lista de eventos relacionados ao usuário
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Não autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Extrair parâmetros de consulta
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active') !== 'false'; // Default: true
    const role = searchParams.get('role'); // Opcional: filtrar por papel

    // Construir query base
    const whereClause = {
      user: {
        id: userId,
      },
    };

    // Adicionar filtro de papel se especificado
    if (role) {
      whereClause.role = role;
    }

    // Buscar organizações do usuário através de OrganizationMember
    const organizationMembers = await prisma.organizationMember.findMany({
      where: whereClause,
      select: {
        organization: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            events: {
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
                    maxWords: true,
                    minWords: true,
                    sortOrder: true,
                  },
                  orderBy: {
                    sortOrder: 'asc'
                  }
                },
                _count: {
                  select: {
                    areas: true,
                    paperTypes: true,
                    papers: true,
                    eventFields: true,
                  }
                }
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
        role: true,
      },
    });

    // Extrair e formatar os eventos
    const now = new Date();
    const events = [];

    // Processar os resultados para formar uma lista plana de eventos com metadados
    organizationMembers.forEach(member => {
      const organizationId = member.organization.id;
      const organizationName = member.organization.name;
      const organizationLogo = member.organization.logoUrl;
      const userRole = member.role;

      member.organization.events.forEach(event => {
        // Adicionar status de submissão
        let submissionStatus;
        if (!event.submissionStart || !event.submissionEnd) {
          submissionStatus = 'unknown';
        } else if (now < new Date(event.submissionStart)) {
          submissionStatus = 'upcoming';
        } else if (now <= new Date(event.submissionEnd)) {
          submissionStatus = 'open';
        } else {
          submissionStatus = 'closed';
        }

        // Calcular dias restantes
        let daysRemaining = null;
        if (submissionStatus === 'open' && event.submissionEnd) {
          const endDate = new Date(event.submissionEnd);
          const timeDiff = endDate.getTime() - now.getTime();
          daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
        } else if (submissionStatus === 'upcoming' && event.submissionStart) {
          const startDate = new Date(event.submissionStart);
          const timeDiff = startDate.getTime() - now.getTime();
          daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
        }

        events.push({
          ...event,
          organization: {
            id: organizationId,
            name: organizationName,
            logoUrl: organizationLogo
          },
          userRole,
          submissionStatus,
          daysRemaining
        });
      });
    });

    // Ordenar eventos: abertos primeiro, depois próximos, depois fechados
    // E dentro de cada grupo, pelo início da submissão
    const sortedEvents = events.sort((a, b) => {
      const statusOrder = { open: 0, upcoming: 1, closed: 2, unknown: 3 };

      // Primeiro ordenar por status
      if (statusOrder[a.submissionStatus] !== statusOrder[b.submissionStatus]) {
        return statusOrder[a.submissionStatus] - statusOrder[b.submissionStatus];
      }

      // Depois por data de início da submissão (mais recentes primeiro)
      const dateA = a.submissionStart ? new Date(a.submissionStart) : new Date(0);
      const dateB = b.submissionStart ? new Date(b.submissionStart) : new Date(0);
      return dateB - dateA;
    });

    return NextResponse.json(sortedEvents);
  } catch (error) {
    console.error("Erro ao buscar eventos do usuário:", error);
    return NextResponse.json(
      { message: "Erro ao processar a solicitação", error: error.message },
      { status: 500 }
    );
  }
}