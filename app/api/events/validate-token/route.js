import { NextResponse } from 'next/server';
import { prisma } from '/app/lib/db';

// Retorno esperado:
// {
// 	"valid": true,
// 	"message": "Token válido",
// 	"eventData": {
// 		"id": "cac5c8cd5447baace99183d47",
// 		"name": "JMR & CIM 2025",
// 		"shortName": "JMR/CIM2025",
// 		"logoUrl": "https://firebasestorage.googleapis.com/v0/b/paper-submission-10013.firebasestorage.app/o/Events%2FJMR-CIM2025%2Fjmr2025.png?alt=media&token=a0bfa920-fb56-46f5-a92c-b11a97ecd03b",
// 		"website": "https://jornada.srmg.org.br/2025",
// 		"description": "Envie seu trabalho cientifico. Preencha os dados pessoais e dos coautores, selecione o tipo de trabalho e prossiga no envio do seu resumo.",
// 		"startDate": "2025-06-27T03:00:00.000Z",
// 		"endDate": "2025-06-28T03:00:00.000Z",
// 		"submissionPeriod": {
// 			"start": "2025-04-15T03:00:00.000Z",
// 			"end": "2025-05-15T03:00:00.000Z"
// 		},
// 		"reviewPeriod": {
// 			"start": "2025-06-05T03:00:00.000Z",
// 			"end": "2025-06-28T03:00:00.000Z"
// 		},
// 		"limits": {
// 			"maxAuthors": 6,
// 			"maxKeywords": 5,
// 			"minKeywords": 5,
// 			"maxFiles": 3,
// 			"maxFileSize": 3
// 		}
// 	},
// 	"organizationData": {
// 		"id": "c4b47eeb63945d0da252915ce",
// 		"name": "Sociedade Mineira de Radiologia",
// 		"shortName": "SRMG"
// 	}
// }

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