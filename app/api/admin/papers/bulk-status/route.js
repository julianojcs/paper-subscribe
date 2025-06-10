import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from '../../../../lib/db';
import * as Statuses from '../../../../utils/statuses';

// PUT /api/admin/papers/bulk-status - Atualiza o status de múltiplos papers
export async function PUT(request) {
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

    const { paperIds, newStatus, comment, historyDate } = await request.json();

    // Validações
    if (!paperIds || !Array.isArray(paperIds) || paperIds.length === 0) {
      return NextResponse.json(
        { error: "Lista de IDs de papers é obrigatória" },
        { status: 400 }
      );
    }

    if (!newStatus) {
      return NextResponse.json(
        { error: "Novo status é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o status é válido
    if (!Statuses.statusExists(newStatus)) {
      return NextResponse.json(
        { error: "Status inválido" },
        { status: 400 }
      );
    }

    const statusPtBR = Statuses.getStatusPtBR(newStatus);

    // Verificar se os papers existem
    const existingPapers = await prisma.paper.findMany({
      where: {
        id: { in: paperIds }
      },
      select: {
        id: true,
        title: true,
        status: true
      }
    });

    if (existingPapers.length !== paperIds.length) {
      const foundIds = existingPapers.map(p => p.id);
      const missingIds = paperIds.filter(id => !foundIds.includes(id));
      return NextResponse.json(
        { error: `Papers não encontrados: ${missingIds.join(', ')}` },
        { status: 404 }
      );
    }

    // Usar transação para garantir consistência
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar status dos papers
      const updatedPapers = await tx.paper.updateMany({
        where: {
          id: { in: paperIds }
        },
        data: {
          status: newStatus,
          updatedAt: new Date()
        }
      });

      // Criar entradas no histórico para cada paper
      const historyEntries = paperIds.map(paperId => ({
        paperId,
        status: newStatus,
        userId: session.user.id,
        comment: comment || `Status alterado em lote para ${statusPtBR} pelo administrador`,
        createdAt: historyDate ? new Date(historyDate) : new Date()
      }));

      await tx.paperHistory.createMany({
        data: historyEntries
      });

      return {
        updatedCount: updatedPapers.count,
        paperIds
      };
    });

    return NextResponse.json({
      success: true,
      message: `Status de ${result.updatedCount} trabalho(s) atualizado(s) para ${statusPtBR}`,
      updatedCount: result.updatedCount,
      paperIds: result.paperIds
    }, { status: 200 });

  } catch (error) {
    console.error('Erro ao atualizar status em lote:', error);
    return NextResponse.json(
      { error: "Erro ao atualizar status dos trabalhos", details: error.message },
      { status: 500 }
    );
  }
}
