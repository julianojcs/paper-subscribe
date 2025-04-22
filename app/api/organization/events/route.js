import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "/app/lib/db";
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado. É necessário estar logado." }, 
        { status: 401 }
      );
    }

    // Pegar query parameters
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") !== "false"; // padrão é true
    
    // Construir a query base
    let whereClause = {};
    
    // Filtrar eventos ativos se especificado
    if (activeOnly) {
      whereClause.isActive = true;
      
      // Adicionar lógica para considerar apenas eventos com data de término após hoje
      const today = new Date();
      whereClause.OR = [
        {
          endDate: {
            gte: today
          }
        },
        {
          endDate: null // Também incluir eventos sem data de término definida
        }
      ];
    }
    
    // Buscar eventos ativos do usuário logado
    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: [
        { startDate: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        organization: {
          include: {
            members: {
              select: {
                userId: true,
                role: true
              },
              where: {
                userId: session.user.id
              }
            }
          }
        },
        _count: {
          select: {
            papers: true
          }
        }
      }
    });
    
    // Transformar dados para o formato da resposta
    const formattedEvents = events.map(event => {
      const userMembership = event.organization?.members?.[0];
      
      return {
        id: event.id,
        name: event.name,
        description: event.description,
        logoUrl: event.logoUrl,
        website: event.website,
        endDate: event.endDate,
        submissionStart: event.submissionStart,
        submissionEnd: event.submissionEnd,
        reviewStart: event.reviewStart,
        reviewEnd: event.reviewEnd,
        maxAuthors: event.maxAuthors,
        minKeywords: event.minKeywords,
        maxKeywords: event.maxKeywords,
        maxFiles: event.maxFiles,
        maxFileSize: event.maxFileSize,
        isActive: event.isActive,
        organizationId: event.organizationId,
        organizationName: event.organization?.name,
        userRole: userMembership?.role || null,
        paperCount: event._count.papers,
        isMember: !!userMembership
      };
    });
    
    return NextResponse.json({ events: formattedEvents });
    
  } catch (error) {
    console.error("Erro ao buscar eventos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar eventos", details: error.message }, 
      { status: 500 }
    );
  }
}