import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../lib/db";

export async function GET(request) {
  try {
    // Parâmetros de query para paginação e filtros
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    const roleFilter = searchParams.get("role"); // Filtro por papel (ADMIN, MEMBER, etc)

    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Verificar se o usuário é admin de alguma organização
    const adminMembership = await prisma.organizationMember.findFirst({
      where: {
        userId: userId,
        role: "ADMIN"
      },
      include: {
        organization: true
      }
    });

    if (!adminMembership) {
      return NextResponse.json(
        { error: "Permissão negada. Apenas administradores de organizações podem acessar estes dados." },
        { status: 403 }
      );
    }

    const organizationId = adminMembership.organizationId;

    // Buscar evento ativo da organização
    const activeEvent = await prisma.event.findFirst({
      where: {
        organizationId: organizationId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        logoUrl: true
      }
    });

    // Construir condição WHERE para filtros
    const whereCondition = {
      organizationId: organizationId,
      ...(roleFilter ? { role: roleFilter } : {}),
      user: {
        OR: search ? [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { cpf: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ] : undefined
      }
    };

    // Contar total de registros para paginação
    const totalUsers = await prisma.organizationMember.count({
      where: whereCondition
    });

    // Verificar se estamos ordenando por papersCount (que precisa de tratamento especial)
    const isOrderingByPapers = sortBy === 'papersCount';

    // Para ordenação normal (campos diretos), usamos a consulta Prisma padrão
    // Para ordenação por papersCount, buscamos todos e ordenamos em memória
    const organizationUsers = await prisma.organizationMember.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            cpf: true,
            phone: true,
            createdAt: true,
            papers: {
              where: activeEvent?.id ? { eventId: activeEvent.id } : {}
            }
          }
        }
      },
      // Se estamos ordenando por papersCount, não ordenamos aqui, faremos depois
      ...(!isOrderingByPapers ? {
        orderBy: {
          user: {
            [sortBy]: sortOrder
          }
        },
        skip: (page - 1) * limit,
        take: limit
      } : {
        // Se estamos ordenando por papersCount, trazemos todos os registros
        // e faremos a paginação depois de ordenar manualmente
      })
    });

    // Formatar dados para resposta
    let formattedUsers = organizationUsers.map(member => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      cpf: member.user.cpf || "",
      phone: member.user.phone || "",
      createdAt: member.user.createdAt,
      papersCount: member.user.papers.length,
      role: member.role,
      joinedAt: member.createdAt
    }));

    // Se estamos ordenando por papersCount, ordenamos manualmente e aplicamos paginação
    if (isOrderingByPapers) {
      formattedUsers.sort((a, b) => {
        if (sortOrder === 'asc') {
          return a.papersCount - b.papersCount;
        } else {
          return b.papersCount - a.papersCount;
        }
      });

      // Aplicar paginação após ordenação
      formattedUsers = formattedUsers.slice((page - 1) * limit, page * limit);
    }

    // Retornar os dados estruturados com metadados de paginação
    return NextResponse.json({
      organization: {
        id: adminMembership.organization.id,
        name: adminMembership.organization.name
      },
      activeEvent: activeEvent || null,
      users: formattedUsers,
      pagination: {
        total: totalUsers,
        page,
        limit,
        pages: Math.ceil(totalUsers / limit)
      }
    });

  } catch (error) {
    console.error("Erro ao buscar usuários da organização:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}