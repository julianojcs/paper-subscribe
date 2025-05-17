import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "/app/lib/db";

/**
 * Endpoint para verificar se um token é válido
 * POST /api/token/validate
 * Body: { token: "token-string" }
 */
// Retorno:
// {
// 	"valid": true,
// 	"active": true,
// 	"organization": {
// 		"id": "c4b47eeb63945d0da252915ce",
// 		"name": "Sociedade Mineira de Radiologia"
// 	},
// 	"event": {
// 		"id": "cac5c8cd5447baace99183d47",
// 		"name": "JMR & CIM 2025",
// 		"submissionStart": "2025-04-15T03:00:00.000Z",
// 		"submissionEnd": "2025-05-15T03:00:00.000Z"
// 	},
// 	"expiresAt": "2025-06-30T00:00:00.000Z"
// }
export async function POST(request) {
  try {
    // Obter o token do corpo da requisição
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({
        valid: false,
        message: "Token não fornecido."
      }, { status: 400 });
    }

    // Verificar se o token existe e está ativo
    const organizationToken = await prisma.organizationToken.findUnique({
      where: {
        token: token,
        isActive: true,
        expiresAt: {
          gt: new Date() // Token não expirado
        }
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            shortName: true,
            isActive: true
          }
        },
        event: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            shortName: true,
            isActive: true,
            timelines: {
              select: {
                type: true,
                date: true
              }
            }
          }
        }
      }
    });

    // Se o token não existir ou não estiver ativo
    if (!organizationToken) {
      return NextResponse.json({
        valid: false,
        message: "Token inválido ou expirado."
      });
    }

    // Verificar se a organização está ativa
    if (!organizationToken.organization.isActive) {
      return NextResponse.json({
        valid: false,
        message: `A organização ${organizationToken.organization.shortName} está inativa.`
      });
    }

    // Se chegou até aqui, o token é válido
    return NextResponse.json({
      valid: true,
      active: true,
      organization: {
        id: organizationToken.organization.id,
        name: organizationToken.organization.name
      },
      event: organizationToken.event ? {
        id: organizationToken.event.id,
        name: organizationToken.event.name,
        logoUrl: organizationToken.event.logoUrl,
        shortName: organizationToken.event.shortName,
        // Obter as datas da timeline
        submissionStart: organizationToken.event.timelines?.find(t => t.type === 'SUBMISSION_START')?.date || null,
        submissionEnd: organizationToken.event.timelines?.find(t => t.type === 'SUBMISSION_END')?.date || null,
        reviewStart: organizationToken.event.timelines?.find(t => t.type === 'REVIEW_START')?.date || null,
        reviewEnd: organizationToken.event.timelines?.find(t => t.type === 'REVIEW_END')?.date || null,
        eventStart: organizationToken.event.timelines?.find(t => t.type === 'EVENT_START')?.date || null,
        eventEnd: organizationToken.event.timelines?.find(t => t.type === 'EVENT_END')?.date || null,
        // Incluir todas as datas da timeline para flexibilidade
        timelines: organizationToken.event.timelines?.map(t => ({
          type: t.type,
          date: t.date
        })) || []
      } : null,
      expiresAt: organizationToken.expiresAt
    });

  } catch (error) {
    console.error("Erro ao validar token:", error);
    return NextResponse.json({
      valid: false,
      message: "Erro ao processar o token."
    }, { status: 500 });
  }
}