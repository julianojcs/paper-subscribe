import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';
import prisma from "../../../lib/db";
import { storage } from "../../../lib/firebase";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Verificar se o Firebase Storage está disponível
    if (!storage) {
      console.error("Firebase Storage não está inicializado corretamente");
      return NextResponse.json(
        { error: "Erro interno de configuração de armazenamento" },
        { status: 500 }
      );
    }

    // Processar FormData
    const formData = await request.formData();
    
    // Extrair dados do formulário
    const paperId = formData.get('paperId'); // ID do paper ao qual o arquivo pertence
    const file = formData.get('file');       // O arquivo PDF

    // Validações
    if (!paperId || !file) {
      return NextResponse.json(
        { error: "ID do trabalho e arquivo são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o paper existe e pertence ao usuário
    const existingPaper = await prisma.paper.findUnique({
      where: { id: paperId },
    });

    if (!existingPaper) {
      return NextResponse.json(
        { error: "Trabalho não encontrado" },
        { status: 404 }
      );
    }

    if (existingPaper.userId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: "Você não tem permissão para atualizar este trabalho" },
        { status: 403 }
      );
    }

    // Verificar tipo do arquivo
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: "O arquivo deve estar em formato PDF" },
        { status: 400 }
      );
    }

    // Verificar tamanho do arquivo (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "O arquivo não deve exceder 10MB" },
        { status: 400 }
      );
    }

    // Gerar UUID para o nome do arquivo
    const uniqueId = uuidv4();
    const originalFileName = file.name;
    const fileExt = originalFileName.split('.').pop().toLowerCase();
    const sanitizedFileName = `${uniqueId}.${fileExt}`;
    
    // Obter ano atual para a estrutura de pastas
    const currentYear = new Date().getFullYear();
    
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
          'uploadedBy': session.user.email || 'unknown',
          'paperId': paperId
        }
      });
      
      // Obter URL de download do arquivo
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Atualizar o paper com as informações do arquivo
      const updatedPaper = await prisma.paper.update({
        where: { id: paperId },
        data: {
          fileUrl: downloadURL,
          fileName: originalFileName,
          fileStoragePath: `JMR${currentYear}/Papers/${sanitizedFileName}`,
          fileSize: file.size,
          status: existingPaper.status === 'draft' ? 'pending' : existingPaper.status,
          updatedAt: new Date()
        },
      });

      // Se o status mudou de draft para pending, adicionar entrada no histórico
      if (existingPaper.status === 'draft' && updatedPaper.status === 'pending') {
        await prisma.paperHistory.create({
          data: {
            paperId: paperId,
            status: 'pending',
            comment: 'Arquivo enviado e trabalho submetido para revisão.',
          },
        });
      } else {
        // Apenas atualização de arquivo
        await prisma.paperHistory.create({
          data: {
            paperId: paperId,
            status: updatedPaper.status,
            comment: 'Arquivo atualizado pelo autor.',
          },
        });
      }

      return NextResponse.json({ 
        success: true, 
        paper: {
          id: updatedPaper.id,
          title: updatedPaper.title,
          status: updatedPaper.status,
          fileUrl: updatedPaper.fileUrl
        } 
      });
      
    } catch (uploadError) {
      console.error("Erro no upload:", uploadError);
      return NextResponse.json(
        { error: "Erro ao fazer upload do arquivo: " + uploadError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao submeter arquivo:', error);
    return NextResponse.json(
      { error: "Falha ao processar o envio do arquivo: " + error.message },
      { status: 500 }
    );
  }
}