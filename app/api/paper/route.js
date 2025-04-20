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
    const { 
      title, 
      authors, 
      keywords, 
      abstract, 
      areaId, 
      paperTypeId, 
      eventId,
      paperFieldValues 
    } = await request.json();

    // Validação básica
    if (!title) {
      return NextResponse.json(
        { error: "Título do trabalho é obrigatório" },
        { status: 400 }
      );
    }

    if (!authors || !Array.isArray(authors) || authors.length === 0) {
      return NextResponse.json(
        { error: "É necessário informar pelo menos um autor" },
        { status: 400 }
      );
    }

    if (!keywords) {
      return NextResponse.json(
        { error: "Palavras-chave são obrigatórias" },
        { status: 400 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        { error: "ID do evento é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o usuário logado está entre os autores
    const currentUserIsAuthor = authors.some(author => author.userId === session.user.id);
    if (!currentUserIsAuthor) {
      return NextResponse.json(
        { error: "O usuário logado deve ser um dos autores do trabalho" },
        { status: 400 }
      );
    }

    // Criar paper no banco de dados
    const paper = await prisma.paper.create({
      data: {
        title,
        keywords,
        areaId,
        paperTypeId,
        eventId,
        status: 'draft', // Status inicial como rascunho
        userId: session.user.id, // Usuário que está submetendo o trabalho
        // Campos opcionais ou que terão valores padrão
        abstract: abstract || '',
        fileUrl: '',
        fileName: '',
        fileStoragePath: '',
        fileSize: 0,
      },
    });

    // Após criar o paper, criar os autores associados
    if (authors && authors.length > 0) {
      await prisma.paperAuthor.createMany({
        data: authors.map(author => ({
          paperId: paper.id,
          userId: author.userId || null,
          name: author.name,
          institution: author.institution,
          city: author.city,
          stateId: author.stateId,
          isPresenter: author.isPresenter || false,
          authorOrder: author.authorOrder || 0
        }))
      });
    }

    // Após criar o paper e os autores, criar os valores dos campos dinâmicos
    if (paperFieldValues && Array.isArray(paperFieldValues) && paperFieldValues.length > 0) {
      await prisma.paperFieldValue.createMany({
        data: paperFieldValues.map(field => ({
          paperId: paper.id,
          fieldId: field.fieldId,
          value: field.value
        }))
      });
    }

    return NextResponse.json({ 
      success: true, 
      paper,
      message: "Trabalho criado com sucesso"
    }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar paper:", error);
    return NextResponse.json(
      { error: "Falha ao criar trabalho", details: error.message },
      { status: 500 }
    );
  }
}