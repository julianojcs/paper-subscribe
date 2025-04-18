import { NextResponse } from 'next/server';
import { prisma } from '/app/lib/db';

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ valid: false, message: 'Token não fornecido' }, { status: 400 });
    }

    // Buscar o token no banco de dados
    const orgToken = await prisma.organizationToken.findFirst({
      where: {
        token: token,
        isActive: true,
        expiresAt: {
          gte: new Date() // Token ainda não expirou
        }
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            shortName: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            shortName: true
          }
        }
      }
    });

    if (!orgToken) {
      return NextResponse.json({ valid: false, message: 'Token inválido ou expirado' }, { status: 400 });
    }

    // Token válido
    return NextResponse.json({
      valid: true,
      message: 'Token válido',
      eventId: orgToken.eventId,
      eventName: orgToken.event?.name || 'Evento',
      organizationId: orgToken.organizationId,
      organizationName: orgToken.organization?.name || 'Organização'
    });
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return NextResponse.json({
      valid: false,
      message: 'Erro ao validar token'
    }, { status: 500 });
  }
}