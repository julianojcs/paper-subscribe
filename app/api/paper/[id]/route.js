import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import prisma from "../../../lib/db";
import { authOptions } from "../../auth/[...nextauth]/route";

// GET /api/paper/[id] - Recupera um paper específico pelo ID com todos seus dados relacionados
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

    // Buscar o paper pelo ID fornecido com todas as relações
    const paper = await prisma.paper.findUnique({
      where: { id },
      include: {
        // Incluir dados do usuário que criou o paper
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            institution: true,
            image: true,
          },
        },
        // Incluir dados do evento
        event: {
          select: {
            id: true,
            name: true,
            shortName: true,
            submissionStart: true,
            submissionEnd: true,
            reviewStart: true,
            reviewEnd: true,
            maxAuthors: true,
            maxFiles: true,
            maxFileSize: true,
            organization: {
              select: {
                id: true,
                name: true,
                shortName: true,
                logoUrl: true,
              }
            }
          },
        },
        // Incluir dados da área temática
        area: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        // Incluir dados do tipo de paper
        paperType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        // Incluir todos os autores com ordem de exibição correta
        authors: {
          select: {
            id: true,
            userId: true,
            name: true,
            institution: true,
            city: true,
            stateId: true,
            isPresenter: true,
            isMainAuthor: true,
            authorOrder: true,
          },
          orderBy: {
            authorOrder: 'asc',
          },
        },
        // Incluir valores de campos dinâmicos com seus detalhes
        fieldValues: {
          select: {
            id: true,
            fieldId: true,
            value: true,
            field: {
              select: {
                id: true,
                label: true,
                helperText: true,
                defaultValue: true,
                placeholder: true,
                isRequired: true,
                fieldType: true,
                fieldOptions: true,
                maxLength: true,
                minLength: true,
                maxWords: true,
                minWords: true,
                sortOrder: true
              }
            }
          },
        },
        // Incluir histórico completo
        history: {
          select: {
            id: true,
            status: true,
            comment: true,
            createdAt: true,
            reviewerId: true
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        // Incluir avaliações, se existirem no schema
        // reviews: {
        //   select: {
        //     id: true,
        //     reviewerId: true,
        //     score: true,
        //     comment: true,
        //     createdAt: true,
        //     updatedAt: true,
        //     reviewer: {
        //       select: {
        //         id: true,
        //         name: true,
        //       }
        //     }
        //   },
        //   orderBy: {
        //     createdAt: 'desc',
        //   },
        // },
      },
    });

    if (!paper) {
      return NextResponse.json(
        { error: "Paper não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissão - apenas o dono ou admin pode ver os detalhes completos
    if (paper.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Você não tem permissão para visualizar este trabalho" },
        { status: 403 }
      );
    }

    // Formatar datas para ISO string para facilitar o processamento no cliente
    const formattedPaper = {
      ...paper,
      createdAt: paper.createdAt.toISOString(),
      updatedAt: paper.updatedAt.toISOString(),
      history: paper.history.map(h => ({
        ...h, 
        createdAt: h.createdAt.toISOString()
      })),
      event: paper.event ? {
        ...paper.event,
        submissionStart: paper.event.submissionStart?.toISOString(),
        submissionEnd: paper.event.submissionEnd?.toISOString(),
        reviewStart: paper.event.reviewStart?.toISOString(),
        reviewEnd: paper.event.reviewEnd?.toISOString()
      } : null,
      reviews: paper.reviews ? paper.reviews.map(r => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString()
      })) : []
    };

    return NextResponse.json({ paper: formattedPaper });
  } catch (error) {
    console.error("Erro ao buscar paper:", error);
    return NextResponse.json(
      { error: "Erro ao processar requisição", details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/paper/[id] - Atualiza um paper existente
export async function PUT(request, context) {
  try {
    const params = await context.params;

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
      include: {
        authors: true,
        fieldValues: true,
      }
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

    // Processar dados do form - JSON para PUT ou multipart para PATCH
    const contentType = request.headers.get('content-type') || '';

    // Se o método for PUT, esperamos dados JSON
    let formData;
    
    if (contentType.includes('application/json')) {
      formData = await request.json();
    } else {
      return NextResponse.json(
        { error: "Formato de requisição inválido. Esperado: application/json" },
        { status: 400 }
      );
    }

    const { title, keywords, areaId, paperTypeId, authors, fieldValues } = formData;

    // Validação básica
    if (!title || !keywords) {
      return NextResponse.json(
        { error: "Título e palavras-chave são obrigatórios" },
        { status: 400 }
      );
    }

    // Usar transação para garantir que todas as operações sejam bem-sucedidas
    const result = await prisma.$transaction(async (tx) => {
      // 1. Atualizar o paper principal
      const updatedPaper = await tx.paper.update({
        where: { id },
        data: {
          title,
          keywords,
          areaId: areaId || undefined,
          paperTypeId: paperTypeId || undefined,
          updatedAt: new Date(),
        },
      });

      // 2. Se houver novos autores, atualizar
      if (authors && Array.isArray(authors)) {
        // Excluir autores existentes
        await tx.paperAuthor.deleteMany({
          where: { paperId: id }
        });

        // Criar novos autores
        await Promise.all(authors.map(author => 
          tx.paperAuthor.create({
            data: {
              paperId: id,
              userId: author.userId || null,
              name: author.name,
              institution: author.institution,
              city: author.city,
              stateId: author.stateId || author.state?.value || null,
              isPresenter: author.isPresenter || false,
              authorOrder: author.authorOrder
            }
          })
        ));
      }

      // 3. Se houver novos valores de campos, atualizar
      if (fieldValues && Array.isArray(fieldValues)) {
        // Excluir valores de campos existentes
        await tx.paperFieldValue.deleteMany({
          where: { paperId: id }
        });

        // Criar novos valores de campos
        await Promise.all(fieldValues.map(field => 
          tx.paperFieldValue.create({
            data: {
              paperId: id,
              fieldId: field.fieldId,
              value: field.value
            }
          })
        ));
      }

      // Buscar o paper atualizado com todos os relacionamentos
      return await tx.paper.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          authors: true,
          fieldValues: true,
          area: true,
          paperType: true,
        }
      });
    });

    return NextResponse.json({ 
      success: true, 
      paper: result,
      message: "Trabalho atualizado com sucesso"
    }, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar paper:", error);
    return NextResponse.json(
      { error: "Falha ao atualizar o trabalho", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/paper/[id] - Remove um paper
export async function DELETE(request, context) {
  try {
    const params = await context.params;
    
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

    // Usar transação para remover o paper e todos os relacionamentos
    await prisma.$transaction(async (tx) => {
      // Remove relacionamentos primeiro
      await tx.paperAuthor.deleteMany({ where: { paperId: id } });
      await tx.paperFieldValue.deleteMany({ where: { paperId: id } });
      await tx.paperHistory.deleteMany({ where: { paperId: id } });
      
      // Se o schema tiver revisões, remova-as também
      if (tx.paperReview) {
        await tx.paperReview.deleteMany({ where: { paperId: id } });
      }

      // Por fim, remova o paper
      await tx.paper.delete({ where: { id } });
    });

    return NextResponse.json({ 
      success: true,
      message: "Trabalho excluído com sucesso" 
    }, { status: 200 });
  } catch (error) {
    console.error("Erro ao excluir paper:", error);
    return NextResponse.json(
      { error: "Falha ao excluir o trabalho", details: error.message },
      { status: 500 }
    );
  }
}