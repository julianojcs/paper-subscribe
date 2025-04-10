import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/db";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: "Não autorizado" },
        { status: 401 }
      );
    }

    // Extrair parâmetros de paginação da query string
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Calcular offset para paginação
    const skip = (page - 1) * limit;
    
    // Buscar logs de login do usuário
    const loginLogs = await prisma.loginLog.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
    });
    
    // Contar total de registros para paginação
    const total = await prisma.loginLog.count({
      where: {
        userId: session.user.id
      }
    });
    
    return NextResponse.json({
      loginLogs,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
    
  } catch (error) {
    console.error("Erro ao buscar histórico de login:", error);
    return NextResponse.json(
      { message: "Erro ao buscar histórico de login" },
      { status: 500 }
    );
  }
}