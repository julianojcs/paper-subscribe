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
            shortName: true,
            logoUrl: true,
            website: true,
            description: true,
            startDate: true,
            endDate: true,
            submissionStart: true,
            submissionEnd: true,
            reviewStart: true,
            reviewEnd: true,
            maxAuthors: true,
            maxKeywords: true,
            minKeywords: true,
            maxFiles: true,
            maxFileSize: true,
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

    // Token válido - retornamos os dados completos do evento e da organização
    return NextResponse.json({
      valid: true,
      message: 'Token válido',
      eventData: {
        id: orgToken.event.id,
        name: orgToken.event.name,
        shortName: orgToken.event.shortName,
        logoUrl: orgToken.event.logoUrl,
        website: orgToken.event.website,
        description: orgToken.event.description,
        startDate: orgToken.event.startDate,
        endDate: orgToken.event.endDate,
        submissionPeriod: {
          start: orgToken.event.submissionStart,
          end: orgToken.event.submissionEnd
        },
        reviewPeriod: {
          start: orgToken.event.reviewStart,
          end: orgToken.event.reviewEnd
        },
        limits: {
          maxAuthors: orgToken.event.maxAuthors || 10,
          maxKeywords: orgToken.event.maxKeywords || 5,
          minKeywords: orgToken.event.minKeywords || 3,
          maxFiles: orgToken.event.maxFiles || 3,
          maxFileSize: orgToken.event.maxFileSize || 5, // em MB
        }
      },
      organizationData: {
        id: orgToken.organization.id,
        name: orgToken.organization.name,
        shortName: orgToken.organization.shortName
      }
    });
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return NextResponse.json({
      valid: false,
      message: 'Erro ao validar token'
    }, { status: 500 });
  }
}