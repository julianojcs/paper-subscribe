import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

// Atualiza o status de um paper
export async function PUT(request, context ) {
  try {
    const params = await context.params;
    const eventId = params.id;
    const { status, reason } = await request.json();

    // Verificar se o status é válido
    const validStatuses = [
      'DRAFT', 'PENDING', 'UNDER_REVIEW', 'REVISION_REQUIRED',
      'ACCEPTED', 'REJECTED', 'PUBLISHED', 'WITHDRAWN'
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: 'Status inválido' },
        { status: 400 }
      );
    }

    // Verificar a autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar o paper atual para verificar permissões
    const currentPaper = await prisma.paper.findUnique({
      where: { id },
      include: { authors: true }
    });

    if (!currentPaper) {
      return NextResponse.json(
        { message: 'Trabalho não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem permissão (é autor principal)
    const isAuthorized = currentPaper.authors.some(
      author => author.userId === session.user.id && author.isMainAuthor
    );

    if (!isAuthorized && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Você não tem permissão para modificar este trabalho' },
        { status: 403 }
      );
    }

    // Verificações de regras de negócio para transições de status
    if (status === 'PENDING' && currentPaper.status !== 'DRAFT') {
      return NextResponse.json(
        { message: 'Apenas trabalhos em rascunho podem ser submetidos' },
        { status: 400 }
      );
    }

    // Atualizar o status do paper
    const updatedPaper = await prisma.paper.update({
      where: { id },
      data: {
        status,
        // Se o status for WITHDRAWN, define deletedAt como a data atual
        ...(status === 'WITHDRAWN' ? { deletedAt: new Date() } : {})
      }
    });

    // Registrar a mudança no histórico
    await prisma.paperHistory.create({
      data: {
        paperId: id,
        status,
        userId: session.user.id,
        comment: reason || `Status alterado para ${status} pelo usuário`
      }
    });

    return NextResponse.json({
      paper: updatedPaper,
      message: 'Status atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar status do paper:', error);
    return NextResponse.json(
      { message: 'Erro ao atualizar status do trabalho', error: error.message },
      { status: 500 }
    );
  }
}