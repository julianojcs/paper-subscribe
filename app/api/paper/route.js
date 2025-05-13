import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import prisma from "../../lib/db";
import { authOptions } from "../auth/[...nextauth]/route";
import { v4 as uuidv4 } from 'uuid';
import { storage } from "../../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// GET /api/paper - Lista todos os papers do usuário autenticado com detalhes completos
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Permitir filtragem por query params
    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Construir objeto de filtro para a consulta
    const filter = {
      userId: session.user.id,
      ...(eventId ? { eventId } : {}),
      ...(session.user.role === 'MEMBER'
        ? { NOT: { status: 'WITHDRAWN' } }
        : ( status
            ? { status: status.toUpperCase() }
            : {}
        ))
    };

    // Buscar todos os papers do usuário com filtros aplicados
    const papers = await prisma.paper.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
      include: {
        // Incluir dados do usuário
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            institution: true,
          },
        },
        // Incluir dados do evento
        event: {
          select: {
            id: true,
            name: true,
            shortName: true,
            submissionEnd: true,
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
        // Incluir dados da área
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
        // Incluir todos os autores
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
        // Incluir valores de campos dinâmicos
        fieldValues: {
          select: {
            id: true,
            fieldId: true,
            value: true,
            field: {
              select: {
                id: true,
                label: true,
                fieldType: true,
              }
            }
          },
        },
        // Incluir histórico do paper
        history: {
          select: {
            id: true,
            status: true,
            comment: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Limitar apenas aos 10 últimos registros de histórico
        },
      },
    });

    // Contar o total de registros para paginação
    const totalCount = await prisma.paper.count({
      where: filter,
    });

    // Processar dados antes de retornar (formatação de datas, etc)
    const processedPapers = papers.map(paper => {
      // Formatar campos específicos se necessário
      return {
        ...paper,
        createdAt: paper.createdAt.toISOString(),
        updatedAt: paper.updatedAt.toISOString(),
        event: paper.event ? {
          ...paper.event,
          submissionEnd: paper.event.submissionEnd?.toISOString() || null,
        } : null,
        history: paper.history.map(h => ({
          ...h,
          createdAt: h.createdAt.toISOString(),
        })),
      };
    });

    return NextResponse.json({
      papers: processedPapers,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar papers:", error);
    return NextResponse.json(
      { error: "Falha ao recuperar trabalhos", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/paper - Cria um novo paper com transação
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Processar FormData
    const formData = await request.formData();
    console.log("FormData recebido:", Object.fromEntries(formData.entries()));

    // Extrair dados do FormData
    const title = formData.get('title');
    const keywords = formData.get('keywords');
    const areaId = formData.get('areaId');
    const paperTypeId = formData.get('paperTypeId');
    const eventId = formData.get('eventId');

    // Processar arrays que vêm como JSON string
    let authors = [];
    try {
      const authorsJson = formData.get('authors');
      authors = authorsJson ? JSON.parse(authorsJson) : [];
    } catch (error) {
      console.error("Erro ao processar autores:", error);
      return NextResponse.json(
        { error: "Formato de autores inválido" },
        { status: 400 }
      );
    }

    let paperFieldValues = [];
    try {
      const fieldsJson = formData.get('paperFieldValues');
      paperFieldValues = fieldsJson ? JSON.parse(fieldsJson) : [];
    } catch (error) {
      console.error("Erro ao processar campos customizados:", error);
      return NextResponse.json(
        { error: "Formato de campos customizados inválido" },
        { status: 400 }
      );
    }

    // Validações básicas antes de iniciar a transação
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

    // Obter o evento para verificar se precisa de arquivo
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        name: true,
        organizationId: true,
        maxFiles: true,
        maxFileSize: true
      }
    });
    const eventName = event?.name || 'Evento';

    // Dados do arquivo
    let fileData = {
      fileName: '',
      fileSize: 0,
      fileUrl: '',
      fileStoragePath: ''
    };

    // Processar arquivo antes de iniciar a transação de banco de dados
    const file = formData.get('file');
    if (file && file instanceof File && event && event.maxFiles > 0) {
      // Verificar tamanho do arquivo (em MB)
      const fileSizeMB = file.size / (1024 * 1024);
      if (event.maxFileSize && fileSizeMB > event.maxFileSize) {
        return NextResponse.json(
          { error: `O arquivo excede o tamanho máximo permitido de ${event.maxFileSize}MB` },
          { status: 400 }
        );
      }

      try {
        // Todo o código de upload para o Firebase Storage...
        // Gerar UUID para o nome do arquivo
        const uniqueId = uuidv4();
        const originalFileName = file.name;
        const fileExt = originalFileName.split('.').pop().toLowerCase();
        const sanitizedFileName = `${uniqueId}.${fileExt}`;

        // Obter ano atual para a estrutura de pastas
        const currentYear = new Date().getFullYear();
        const storagePath = `JMR${currentYear}/Papers/${sanitizedFileName}`;

        console.log("Tentando criar referência do Storage:", storagePath);

        // Criar referência para o arquivo no Firebase Storage
        const storageRef = ref(storage, storagePath);

        // Converter o arquivo para ArrayBuffer para upload
        const fileBuffer = await file.arrayBuffer();

        // Upload do arquivo para o Firebase Storage
        const snapshot = await uploadBytes(storageRef, fileBuffer, {
          contentType: file.type,
          customMetadata: {
            'originalName': originalFileName,
            'uploadedBy': session.user.email || 'unknown'
          }
        });

        // Obter URL de download do arquivo
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Atualizar dados do arquivo para salvar no banco
        fileData = {
          fileName: originalFileName,
          fileSize: file.size,
          fileUrl: downloadURL,
          fileStoragePath: storagePath
        };

        console.log("Arquivo enviado com sucesso:", fileData);
      } catch (uploadError) {
        console.error("Erro no upload do arquivo:", uploadError);
        return NextResponse.json(
          { error: 'Erro ao fazer upload do arquivo: ' + uploadError.message },
          { status: 500 }
        );
      }
    }

    // Verificar se o arquivo é obrigatório mas não foi enviado
    if (event && event.maxFiles > 0 && (!file || !(file instanceof File))) {
      return NextResponse.json(
        { error: `O evento "${eventName}" requer o upload de um arquivo PDF` },
        { status: 400 }
      );
    }

    // Iniciar a transação para todas as operações de banco de dados
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar paper no banco de dados
      const paper = await tx.paper.create({
        data: {
          title,
          keywords,
          areaId,
          paperTypeId,
          organizationId: event?.organizationId,
          eventId,
          status: 'DRAFT',
          userId: session.user.id,
          // Campos do arquivo, se existir
          fileName: fileData.fileName,
          fileSize: fileData.fileSize,
          fileUrl: fileData.fileUrl,
          fileStoragePath: fileData.fileStoragePath,
        },
      });

      // 2. Criar os autores associados
      if (authors && authors.length > 0) {
        console.log("Criando autores para o paper:", authors);

        // Como o createMany não retorna os registros criados, usamos um loop para criar cada um
        const paperAuthors = [];
        for (const author of authors) {
          const paperAuthor = await tx.paperAuthor.create({
            data: {
              paperId: paper.id,
              userId: author.userId || null,
              name: author.name,
              institution: author.institution,
              city: author.city,
              stateId: author.state?.value || author.stateId || null,
              // Observando que isMainAuthor foi comentado por não existir no schema
              isPresenter: author.isPresenter || false,
              authorOrder: author.authorOrder
            }
          });
          paperAuthors.push(paperAuthor);
        }
      }

      // 3. Criar os valores dos campos dinâmicos
      const fieldValues = [];
      if (paperFieldValues && Array.isArray(paperFieldValues) && paperFieldValues.length > 0) {
        for (const field of paperFieldValues) {
          const fieldValue = await tx.paperFieldValue.create({
            data: {
              paperId: paper.id,
              fieldId: field.fieldId,
              value: field.value
            }
          });
          fieldValues.push(fieldValue);
        }
      }

      // Retornar o paper criado e seus relacionamentos para uso após a transação
      return {
        paper,
        fieldValues
      };
    }, {
      // Configurações da transação, se necessário
      maxWait: 5000, // 5 segundos máximo de espera
      timeout: 10000 // 10 segundos timeout
    });

    return NextResponse.json({
      success: true,
      paper: result.paper,
      message: "Trabalho criado com sucesso"
    }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar paper:", error);

    // Se o erro for de uma transação, podemos ter mensagens mais específicas
    let errorMessage = "Falha ao criar trabalho";
    if (error.meta && error.meta.cause) {
      errorMessage += `: ${error.meta.cause}`;
    } else if (error.message) {
      errorMessage += `: ${error.message}`;
    }

    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 500 }
    );
  }
}

// Aumentar o limite de tamanho do payload para permitir uploads de arquivos maiores
export const config = {
  api: {
    bodyParser: false,
  },
};