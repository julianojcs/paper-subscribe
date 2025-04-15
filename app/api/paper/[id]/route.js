import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import prisma from "../../../lib/db";
import { authOptions } from "../../../lib/auth";

// GET /api/paper/[id] - Recupera um paper específico pelo ID
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "ID do trabalho não fornecido" },
        { status: 400 }
      );
    }

    // Buscar o paper pelo ID
    const paper = await prisma.paper.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        history: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    // Verificar se o paper existe
    if (!paper) {
      return NextResponse.json(
        { error: "Trabalho não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem permissão para acessar este paper
    if (paper.userId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: "Você não tem permissão para acessar este trabalho" },
        { status: 403 }
      );
    }

    return NextResponse.json({ paper }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar paper por ID:", error);
    return NextResponse.json(
      { error: "Falha ao recuperar o trabalho" },
      { status: 500 }
    );
  }
}

// PUT /api/paper/[id] - Atualiza um paper existente
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;
    
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

    if (existingPaper.userId !== session.user.id && !session.user.isAdmin) {
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
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;

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

    if (existingPaper.userId !== session.user.id && !session.user.isAdmin) {
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