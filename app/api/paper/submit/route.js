import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import prisma from '../../../lib/db';
import { authOptions } from '../../../api/auth/[...nextauth]/route';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    // Obter dados do formulário multipart
    const formData = await request.formData();

    console.log("Dados do formulário recebidos:", formData);
    return {};

    const title = formData.get('title');
    const authorsJson = formData.get('authors');
    const abstract = formData.get('abstract');
    const keywords = formData.get('keywords');
    const file = formData.get('file');
    const areaId = formData.get('areaId');
    const paperTypeId = formData.get('paperTypeId');
    const eventId = formData.get('eventId');
    
    // Validar campos obrigatórios
    if (!title || !authorsJson || !abstract || !keywords || !file) {
      return NextResponse.json(
        { message: "Todos os campos obrigatórios devem ser preenchidos" },
        { status: 400 }
      );
    }
    
    // Converter string JSON para objeto
    let authors;
    try {
      authors = JSON.parse(authorsJson);
      if (!Array.isArray(authors) || authors.length === 0) {
        throw new Error("Lista de autores inválida");
      }
    } catch (error) {
      return NextResponse.json(
        { message: "Formato de autores inválido", error: error.message },
        { status: 400 }
      );
    }
    
    // Obter o usuário atual
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }
    
    // Verificar se o evento existe (se foi fornecido)
    if (eventId) {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { areas: true, paperTypes: true }
      });
      
      if (!event) {
        return NextResponse.json({ message: "Evento não encontrado" }, { status: 404 });
      }
      
      // Verificar se o evento está aceitando submissões
      const now = new Date();
      if (event.submissionStart && now < new Date(event.submissionStart)) {
        return NextResponse.json(
          { message: "O período de submissão ainda não começou" },
          { status: 400 }
        );
      }
      
      if (event.submissionEnd && now > new Date(event.submissionEnd)) {
        return NextResponse.json(
          { message: "O período de submissão já terminou" },
          { status: 400 }
        );
      }
      
      // Validar área se fornecida
      if (areaId && !event.areas.some(area => area.id === areaId)) {
        return NextResponse.json(
          { message: "Área temática inválida para este evento" },
          { status: 400 }
        );
      }
      
      // Validar tipo de trabalho se fornecido
      if (paperTypeId && !event.paperTypes.some(type => type.id === paperTypeId)) {
        return NextResponse.json(
          { message: "Tipo de trabalho inválido para este evento" },
          { status: 400 }
        );
      }
    }

    // Verificar se o Firebase Storage está disponível
    if (!storage) {
      console.error("Firebase Storage não está inicializado corretamente");
      return NextResponse.json(
        { message: 'Erro interno de configuração de armazenamento' },
        { status: 500 }
      );
    }

    // Gerar UUID para o nome do arquivo
    const uniqueId = uuidv4();
    const originalFileName = file.name;
    const fileExt = originalFileName.split('.').pop().toLowerCase();
    const sanitizedFileName = `${uniqueId}.${fileExt}`;

    // Obter ano atual para a estrutura de pastas
    const currentYear = new Date().getFullYear();

    console.log("Tentando criar referência do Storage:", `JMR${currentYear}/Papers/${sanitizedFileName}`);

    try {
      // Criar referência para o arquivo no Firebase Storage
      const storageRef = ref(storage, `JMR${currentYear}/Papers/${sanitizedFileName}`);

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

      // Preparar os autores no formato esperado pelo Prisma
      const authorCreateObjects = authors.map(author => {
        return {
          name: author.name,
          email: author.email || null,
          institution: author.institution,
          city: author.city,
          stateId: author.state?.value || author.stateId || null,
          isMainAuthor: author.isMainAuthor || false, 
          isPresenter: author.isPresenter || false,
          lattes: author.lattes || null,
          orcid: author.orcid || null
        };
      });

      // Criar o paper no banco de dados - Usando objetos relacionais em vez de IDs diretos
      const paper = await prisma.paper.create({
        data: {
          title,
          abstract,
          keywords,
          userId: user.id,
          event: eventId ? {
            connect: { id: eventId }
          } : undefined,
          area: areaId ? {
            connect: { id: areaId }
          } : undefined,
          paperType: paperTypeId ? {
            connect: { id: paperTypeId }
          } : undefined,
          authors: {
            create: authorCreateObjects
          },
          fileUrl: downloadURL,
          fileName: originalFileName,
          fileStoragePath: `JMR${currentYear}/Papers/${sanitizedFileName}`,
          fileSize: file.size,
          status: 'pending', // Status inicial
        },
        include: {
          authors: true,
          area: true,
          paperType: true,
          event: true,
          user: true
        },
      });

      // Criar entrada no histórico de revisão
      await prisma.paperHistory.create({
        data: {
          paperId: paper.id,
          status: 'pending',
          comment: 'Trabalho recebido e aguardando análise inicial.',
        },
      });

      return NextResponse.json({ 
        message: "Trabalho enviado com sucesso",
        paperId: paper.id 
      });
    } catch (uploadError) {
      console.error("Erro no upload:", uploadError);
      return NextResponse.json(
        { message: 'Erro ao fazer upload do arquivo: ' + uploadError.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Erro ao submeter trabalho:", error);
    return NextResponse.json(
      { message: "Erro ao submeter trabalho", error: error.message },
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