import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from '../../../lib/db';

// GET /api/admin/papers - Retorna todos os papers do sistema com filtros
export async function GET(request, context) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 });
    }

    // Verificar permissões (apenas admin ou manager)
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
    }

    // Extrair parâmetros de consulta
    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');
    const areaIds = url.searchParams.getAll('areaId');
    const paperTypeIds = url.searchParams.getAll('paperTypeId');
    const statuses = url.searchParams.getAll('status');

    // Se nenhum status for especificado, não aplicar filtro de status (todos os papers)

    console.log('Admin papers API - Filters received:', {
      eventId,
      areaIds,
      paperTypeIds,
      statuses
    });

    // Construir filtros dinamicamente
    const whereClause = {
      ...(eventId && { eventId }),
      ...(areaIds.length > 0 && { areaId: { in: areaIds } }),
      ...(paperTypeIds.length > 0 && { paperTypeId: { in: paperTypeIds } }),
      ...(statuses.length > 0 && { status: { in: statuses.map(s => s.toUpperCase()) } })
    };

    console.log('Admin papers API - Where clause:', whereClause);

    const papersData = await prisma.paper.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, institution: true } },
        event: { select: { id: true, name: true, shortName: true } },
        area: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        paperType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        authors: {
          select: {
            id: true,
            userId: true,
            name: true,
            institution: true,
            city: true,
            stateId: true,
            isPresenter: true,
            isMainAuthor: true,
            authorOrder: true,
            user: {  // Incluir dados do usuário relacionado
              select: {
                id: true,
                name: true,
                email: true,
                institution: true
              }
            }
          },
          orderBy: { authorOrder: 'asc' },
        },
        fieldValues: {
          select: {
            id: true,
            fieldId: true,
            value: true,
            field: {
              select: {
                id: true,
                label: true,
                fieldType: true,
              }
            }
          },
        },
        history: {
          select: {
            status: true,
            createdAt: true,
            comment: true
          }
        }
      },
    });
    const papers = papersData.map(paper => {
      return {
        ...paper,
        authors: paper.authors.map(author => ({
          ...author,
          email: author.user?.email || null,  // Incluir email do usuário relacionado
          isMainAuthor: author.userId || false,
        })),
        id: paper.id,
        userId: paper.userId,
        title: paper.title || '',
        // createdAt: paper.createdAt.toISOString(),
        // updatedAt: paper.updatedAt ? paper.updatedAt.toISOString() : null,
        keywordsList: paper.keywords ? paper.keywords.split(',').map(keyword => keyword.trim()) : [],
        eventName: paper.event.name,
        resume: paper.fieldValues.find(field => field.field.label === 'Resumo')?.value || '',
        areaName: paper.area.name,
        paperTypeName: paper.paperType.name,
      };
    });
    return NextResponse.json({ papers }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar papers pendentes:', error);
    return NextResponse.json({ error: 'Erro ao buscar papers pendentes', details: error.message }, { status: 500 });
  }
}
