import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import prisma from "../../lib/db";
import { authOptions } from "../auth/[...nextauth]/route";

// GET /api/paper - Lista todos os papers do usuário autenticado
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Verificar se o modelo Paper existe
    if (!prisma.paper) {
      console.error('Modelo Paper não encontrado no Prisma');
      return NextResponse.json(
        { error: 'Erro interno do servidor - modelo não disponível' },
        { status: 500 }
      );
    }

    // Buscar todos os papers do usuário
    const papers = await prisma.paper.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ papers }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar papers:", error);
    return NextResponse.json(
      { error: "Falha ao recuperar trabalhos" },
      { status: 500 }
    );
  }
}

// POST /api/paper - Cria um novo paper (sem upload de arquivo)
export async function POST(request) {
  try {
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

    // Criar paper no banco de dados
    const paper = await prisma.paper.create({
      data: {
        title,
        abstract,
        authors,
        keywords,
        status: 'draft', // Status inicial como rascunho
        userId: session.user.id,
        // Esses campos podem ser atualizados posteriormente quando o arquivo for enviado
        fileUrl: '',
        fileName: '',
        fileStoragePath: '',
        fileSize: 0,
      },
    });

    return NextResponse.json({ success: true, paper }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar paper:", error);
    return NextResponse.json(
      { error: "Falha ao criar trabalho" },
      { status: 500 }
    );
  }
}