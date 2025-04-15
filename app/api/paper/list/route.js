import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import prisma from '../../../lib/db';
import { authOptions } from '../../../api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se prisma existe
    if (!prisma) {
      console.error('Prisma client não está inicializado');
      return NextResponse.json(
        { error: 'Erro interno do servidor - DB client não disponível' },
        { status: 500 }
      );
    }

    // Verificar quais modelos estão disponíveis
    // console.log('Modelos disponíveis:', Object.keys(prisma));

    // Tentar acessar o modelo paper
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

    return NextResponse.json({ papers });
  } catch (error) {
    console.error('Erro ao listar papers:', error);
    console.error('Detalhes do prisma:', prisma ? 'Prisma existe' : 'Prisma é undefined');
    if (prisma) {
      console.error('Modelos disponíveis:', Object.keys(prisma));
    }
    return NextResponse.json(
      { error: 'Erro ao buscar trabalhos: ' + error.message },
      { status: 500 }
    );
  }
}