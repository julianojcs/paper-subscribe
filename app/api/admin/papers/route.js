import { NextResponse } from 'next/server';
import prisma from '../../../lib/db';

// GET /api/admin/papers - Retorna todos os papers do sistema com status 'PENDING'
export async function GET() {
  try {
    const papersData = await prisma.paper.findMany({
      where: { status: 'PENDING' },
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
      },
    });
    const papers = papersData.map(paper => {
      return {
        ...paper,
        authors: paper.authors.map(author => ({
          ...author,
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
