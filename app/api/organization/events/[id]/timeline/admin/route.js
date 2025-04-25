import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/db';
import { authorizationMiddlewares } from '/app/lib/middlewares/authorizationMiddleware';
/**
 * Rota de API para administração da timeline de eventos
 * Retorna todos os itens da timeline, incluindo os não públicos
 */
export async function GET(request, context) {
  try {
    const params = await context.params;
    // Aplicar middleware de autorização
    const auth = await authorizationMiddlewares.eventManager(request, params);
    if (!auth.success) {
      return auth.response;
    }

    const { id: eventId } = params;

    // Buscar todos os itens da timeline, incluindo os não públicos
    const timeline = await prisma.eventTimeline.findMany({
      where: {
        eventId: eventId
      },
      orderBy: [
        { sortOrder: 'asc' },
        { date: 'asc' }
      ]
    });

    // Buscar informações do evento para contexto
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        shortName: true,
        isActive: true
      }
    });

    return NextResponse.json({
      timeline,
      event
    });

  } catch (error) {
    console.error('Erro ao buscar timeline para administração:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar timeline' },
      { status: 500 }
    );
  }
}