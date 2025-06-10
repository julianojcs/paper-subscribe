import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import prisma from '../../../../../lib/db';

// GET /api/admin/users/[id]/papers - Busca trabalhos de um usuário específico (para admins)
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

    const params = await context.params;
    if (!params || !params.id) {
      return NextResponse.json({ error: "ID do usuário é obrigatório" }, { status: 400 });
    }
    const userId = params?.id;

    // Obter parâmetros de paginação e filtros
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '10', 10)));
    const skip = Math.max(0, (page - 1) * limit);
    const status = url.searchParams.get('status'); // Parâmetro opcional para filtrar por status

    // Construir filtro base
    const baseWhere = {
      OR: [
        { userId },
        { authors: { some: { userId } } }
      ]
    };

    // Adicionar filtro de status se especificado
    if (status) {
      baseWhere.status = status;
    }

    // Contar total de trabalhos do usuário
    const total = await prisma.paper.count({
      where: baseWhere
    });

    // Buscar trabalhos do usuário (como autor principal ou colaborador)
    const queryOptions = {
      where: baseWhere,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            city: true,
            stateId: true,
            institution: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
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
            name: true,
            institution: true,
            isMainAuthor: true,
            isPresenter: true,
            authorOrder: true,
          },
          orderBy: {
            authorOrder: 'asc',
          },
        },
        // files: {
        //   select: {
        //     id: true,
        //     fileName: true,
        //     fileUrl: true,
        //     fileSize: true,
        //     mimeType: true,
        //     isPrimary: true,
        //   },
        //   orderBy: {
        //     createdAt: 'desc',
        //   },
        //   take: 1,
        // },
      },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    };

    const papers = await prisma.paper.findMany(queryOptions);

    // Formatar datas para ISO string
    const formattedPapers = papers.map(paper => ({
      ...paper,
      createdAt: paper.createdAt.toISOString(),
      updatedAt: paper.updatedAt.toISOString(),
    }));

    // Retornar papers e informações de paginação
    return NextResponse.json({
      papers: formattedPapers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Erro ao buscar trabalhos do usuário:", error);
    return NextResponse.json(
      { error: "Erro ao processar requisição", details: error.message },
      { status: 500 }
    );
  }
}