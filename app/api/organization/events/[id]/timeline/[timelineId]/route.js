import { NextResponse } from 'next/server';
import { prisma } from '/app/lib/db';
import { authorizationMiddlewares } from '/app/lib/middlewares/authorizationMiddleware';

/**
 * Atualiza um item específico da timeline
 */
export async function PATCH(request, context) {
  try {
    const params = await context.params;
    const eventId = params.id;
    const timelineId = params.timelineId;

    // Usar o middleware de autorização para verificar permissões
    const auth = await authorizationMiddlewares.eventManager(request, { id: eventId });
    if (!auth.success) {
      return auth.response;
    }

    const updates = await request.json();

    // Verificar se o item existe e pertence ao evento
    const existingItem = await prisma.eventTimeline.findFirst({
      where: {
        id: timelineId,
        eventId: eventId
      }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item da timeline não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar o item
    const updatedItem = await prisma.eventTimeline.update({
      where: { id: timelineId },
      data: {
        name: updates.name !== undefined ? updates.name : undefined,
        description: updates.description !== undefined ? updates.description : undefined,
        date: updates.date !== undefined ? new Date(updates.date) : undefined,
        isPublic: updates.isPublic !== undefined ? updates.isPublic : undefined,
        sortOrder: updates.sortOrder !== undefined ? updates.sortOrder : undefined,
        isCompleted: updates.isCompleted !== undefined ? updates.isCompleted : undefined,
        type: updates.type !== undefined ? updates.type : undefined
      }
    });

    return NextResponse.json({ timeline: updatedItem });

  } catch (error) {
    console.error('Erro ao atualizar item da timeline:', error);
    return NextResponse.json(
      { error: 'Erro interno ao atualizar item' },
      { status: 500 }
    );
  }
}

/**
 * Remove um item específico da timeline
 */
export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const eventId = params.id;
    const timelineId = params.timelineId;

    // Usar o middleware de autorização para verificar permissões
    const auth = await authorizationMiddlewares.eventManager(request, { id: eventId });
    if (!auth.success) {
      return auth.response;
    }

    // Verificar se o item existe e pertence ao evento
    const existingItem = await prisma.eventTimeline.findFirst({
      where: {
        id: timelineId,
        eventId: eventId
      }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item da timeline não encontrado' },
        { status: 404 }
      );
    }

    // Excluir o item
    await prisma.eventTimeline.delete({
      where: { id: timelineId }
    });

    // Reordenar os itens restantes
    const remainingItems = await prisma.eventTimeline.findMany({
      where: { eventId },
      orderBy: [
        { sortOrder: 'asc' },
        { date: 'asc' }
      ]
    });

    // Atualizar sortOrder para evitar lacunas
    for (let i = 0; i < remainingItems.length; i++) {
      await prisma.eventTimeline.update({
        where: { id: remainingItems[i].id },
        data: { sortOrder: i + 1 }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro ao excluir item da timeline:', error);
    return NextResponse.json(
      { error: 'Erro interno ao excluir item' },
      { status: 500 }
    );
  }
}