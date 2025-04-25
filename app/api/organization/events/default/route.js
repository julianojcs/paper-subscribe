import { NextResponse } from 'next/server';
import { prisma } from '/app/lib/db';

/**
 * Manipulador da rota GET para buscar o evento padrão/ativo
 * Esta API retorna o evento mais recente ativo para uso quando nenhum evento específico é selecionado
 */
export async function GET() {
  try {
    // Buscar o evento mais recente que está ativo
    const event = await prisma.event.findFirst({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        shortName: true
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Nenhum evento ativo encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Erro ao buscar evento padrão:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar evento padrão' },
      { status: 500 }
    );
  }
}