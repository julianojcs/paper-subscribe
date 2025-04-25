import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import { authorizationMiddlewares } from '/app/lib/middlewares/authorizationMiddleware';

/**
 * Rota GET para buscar itens da timeline (versão pública)
 * Não requer autenticação pois exibe apenas itens públicos
 */
export async function GET(request, context) {
  try {
    const params = await context.params;
    const eventId = params.id;

    if (!eventId) {
      return NextResponse.json(
        { error: 'ID do evento não fornecido' },
        { status: 400 }
      );
    }

    // Buscar apenas itens públicos (para frontend público)
    const timeline = await prisma.eventTimeline.findMany({
      where: {
        eventId,
        isPublic: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { date: 'asc' }
      ]
    });

    // Processar data atual para determinar itens completados
    const now = new Date();
    const processedTimeline = timeline.map(item => ({
      ...item,
      isCompleted: item.isCompleted || new Date(item.date) < now
    }));

    return NextResponse.json({ timeline: processedTimeline });
  } catch (error) {
    console.error('Erro ao buscar timeline:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar timeline' },
      { status: 500 }
    );
  }
}

/**
 * Rota POST para adicionar item à timeline (admin)
 * Requer autenticação e autorização
 */
export async function POST(request, context) {
  try {
    const params = await context.params;
    const eventId = params.id;

    // Usar o middleware de autorização para verificar permissões
    const auth = await authorizationMiddlewares.eventManager(request, { id: eventId });
    if (!auth.success) {
      return auth.response;
    }

    const data = await request.json();

    // Validar dados obrigatórios
    if (!eventId || !data.name || !data.date || !data.type) {
      return NextResponse.json(
        { error: 'Dados incompletos para criar item na timeline' },
        { status: 400 }
      );
    }

    // Determinar o próximo sortOrder (se não for fornecido)
    let sortOrder = data.sortOrder;
    if (sortOrder === undefined) {
      const lastItem = await prisma.eventTimeline.findFirst({
        where: { eventId },
        orderBy: { sortOrder: 'desc' }
      });
      sortOrder = lastItem ? lastItem.sortOrder + 1 : 1;
    }

    // Criar o novo item na timeline
    const newItem = await prisma.eventTimeline.create({
      data: {
        eventId,
        name: data.name,
        description: data.description || null,
        date: new Date(data.date),
        type: data.type,
        isPublic: data.isPublic !== undefined ? data.isPublic : true,
        sortOrder,
        isCompleted: data.isCompleted || false
      }
    });

    return NextResponse.json({ timeline: newItem }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar item na timeline:', error);
    return NextResponse.json(
      { error: 'Erro interno ao criar item na timeline' },
      { status: 500 }
    );
  }
}

/**
 * Rota PUT para atualizar a ordem de múltiplos itens da timeline
 * Útil para reordenar a timeline por drag-and-drop
 */
export async function PUT(request, context) {
  try {
    const params = await context.params;
    const eventId = params.id;

    // Usar o middleware de autorização para verificar permissões
    const auth = await authorizationMiddlewares.eventManager(request, { id: eventId });
    if (!auth.success) {
      return auth.response;
    }

    const data = await request.json();

    if (!Array.isArray(data.items)) {
      return NextResponse.json(
        { error: 'Formato inválido. Esperado array de itens com id e sortOrder' },
        { status: 400 }
      );
    }

    // Verificar se todos os itens pertencem ao evento
    const itemIds = data.items.map(item => item.id);
    const existingItems = await prisma.eventTimeline.findMany({
      where: {
        id: { in: itemIds },
        eventId
      },
      select: { id: true }
    });

    if (existingItems.length !== itemIds.length) {
      return NextResponse.json(
        { error: 'Alguns itens não pertencem a este evento' },
        { status: 400 }
      );
    }

    // Atualizar a ordem de cada item
    const updates = [];
    for (const item of data.items) {
      updates.push(
        prisma.eventTimeline.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder }
        })
      );
    }

    // Executar todas as atualizações em paralelo
    await prisma.$transaction(updates);

    // Buscar e retornar a timeline atualizada
    const updatedTimeline = await prisma.eventTimeline.findMany({
      where: { eventId },
      orderBy: [
        { sortOrder: 'asc' },
        { date: 'asc' }
      ]
    });

    return NextResponse.json({ timeline: updatedTimeline });
  } catch (error) {
    console.error('Erro ao reordenar timeline:', error);
    return NextResponse.json(
      { error: 'Erro interno ao reordenar timeline' },
      { status: 500 }
    );
  }
}