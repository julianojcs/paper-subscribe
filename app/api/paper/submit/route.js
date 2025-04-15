import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import prisma from '../../../lib/db';
import { authOptions } from '../../../api/auth/[...nextauth]/route';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function POST(request) {
  try {
    // Verificar se o usuário está autenticado
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se o Firebase Storage está disponível
    if (!storage) {
      console.error("Firebase Storage não está inicializado corretamente");
      return NextResponse.json(
        { error: 'Erro interno de configuração de armazenamento' },
        { status: 500 }
      );
    }

    // Processar FormData
    const formData = await request.formData();

    // Extrair dados do formulário
    const title = formData.get('title');
    const authors = formData.get('authors');
    const abstract = formData.get('abstract');
    const keywords = formData.get('keywords');
    const file = formData.get('file');

    // Validar dados
    if (!title || !authors || !abstract || !keywords || !file) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar tipo do arquivo
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'O arquivo deve estar em formato PDF' },
        { status: 400 }
      );
    }

    // Verificar tamanho do arquivo (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'O arquivo não deve exceder 10MB' },
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

      // Criar o paper no banco de dados
      const paper = await prisma.paper.create({
        data: {
          title,
          authors,
          abstract,
          keywords,
          fileUrl: downloadURL,
          fileName: originalFileName,
          fileStoragePath: `JMR${currentYear}/Papers/${sanitizedFileName}`,
          fileSize: file.size,
          status: 'pending', // Status inicial
          userId: session.user.id,
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
        success: true,
        paper: {
          id: paper.id,
          title: paper.title,
          status: paper.status,
          createdAt: paper.createdAt
        }
      });
    } catch (uploadError) {
      console.error("Erro no upload:", uploadError);
      return NextResponse.json(
        { error: 'Erro ao fazer upload do arquivo: ' + uploadError.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro ao submeter paper completo:', error);
    return NextResponse.json(
      { error: "Falha ao processar o envio do trabalho: " + error.message },
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