import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import prisma from "../../../lib/db";
import { authOptions } from "../../auth/[...nextauth]/route";

// GET /api/paper/[id] - Recupera um paper específico pelo ID
export async function GET(request, context) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);

    // Certifique-se de que params existe e tenha sido completamente processado
    if (!params || !params.id) {
      return NextResponse.json({ error: "ID do paper não fornecido" }, { status: 400 });
    }

    const id = params.id;

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Autenticação necessária" },
        { status: 401 }
      );
    }

    // Buscar o paper pelo ID fornecido
    const paper = await prisma.paper.findUnique({
      where: { id },
      include: {
        history: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!paper) {
      return NextResponse.json(
        { error: "Paper não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissão - apenas o dono ou admin pode ver os detalhes
    if (paper.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Você não tem permissão para visualizar este trabalho" },
        { status: 403 }
      );
    }

    return NextResponse.json({ paper });
  } catch (error) {
    console.error("Erro ao buscar paper:", error);
    return NextResponse.json(
      { error: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}

// PUT /api/paper/[id] - Atualiza um paper existente
export async function PUT(request, context) {
  try {
    // Obtenha os parâmetros de forma assíncrona
    const params = await context.params;

    // Assegure-se de que params esteja completamente disponível
    if (!params || !params.id) {
      return NextResponse.json({ error: "ID do paper não fornecido" }, { status: 400 });
    }

    const id = params.id;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Extrair dados do corpo da requisição
    const { title, abstract, authors, keywords } = await request.json();

    // Validação básica
    if (!title || !abstract || !authors || !keywords) {
      return NextResponse.json(
        { error: "Campos obrigatórios não preenchidos" },
        { status: 400 }
      );
    }

    // Verificar se o paper existe e pertence ao usuário
    const existingPaper = await prisma.paper.findUnique({
      where: { id },
    });

    if (!existingPaper) {
      return NextResponse.json(
        { error: "Trabalho não encontrado" },
        { status: 404 }
      );
    }

    if (existingPaper.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Você não tem permissão para editar este trabalho" },
        { status: 403 }
      );
    }

    // Atualizar o paper
    const updatedPaper = await prisma.paper.update({
      where: { id },
      data: {
        title,
        abstract,
        authors,
        keywords,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, paper: updatedPaper }, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar paper:", error);
    return NextResponse.json(
      { error: "Falha ao atualizar o trabalho" },
      { status: 500 }
    );
  }
}

// DELETE /api/paper/[id] - Remove um paper
export async function DELETE(request, context) {
  try {
    // Obtenha os parâmetros de forma assíncrona
    const params = await context.params;

    // Assegure-se de que params esteja completamente disponível
    if (!params || !params.id) {
      return NextResponse.json({ error: "ID do paper não fornecido" }, { status: 400 });
    }

    const id = params.id;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Verificar se o paper existe e pertence ao usuário
    const existingPaper = await prisma.paper.findUnique({
      where: { id },
    });

    if (!existingPaper) {
      return NextResponse.json(
        { error: "Trabalho não encontrado" },
        { status: 404 }
      );
    }

    if (existingPaper.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Você não tem permissão para excluir este trabalho" },
        { status: 403 }
      );
    }

    // Remover o paper
    await prisma.paper.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erro ao excluir paper:", error);
    return NextResponse.json(
      { error: "Falha ao excluir o trabalho" },
      { status: 500 }
    );
  }
}