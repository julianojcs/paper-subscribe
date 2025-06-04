import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from '../../../../lib/db';

// GET /api/admin/users/[id] - Busca detalhes de um usuário específico (para admins)
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

    // Obter ID do usuário da URL
    const userId = context.params.id;

    // Buscar o usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            papers: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Remover senha e outros dados sensíveis
    const { password, ...safeUser } = user;

    // Adicionar contagem de papers ao usuário
    const userWithCounts = {
      ...safeUser,
      paperCount: user._count.papers
    };

    return NextResponse.json({ user: userWithCounts });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao processar requisição", details: error.message },
      { status: 500 }
    );
  }
}