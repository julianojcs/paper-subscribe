import { NextResponse } from 'next/server';
import { prisma } from '../../lib/db';

/**
 * @swagger
 * /api/states:
 *   get:
 *     description: Retorna todos os estados do Brasil da tabela State
 *     responses:
 *       200:
 *         description: Lista de estados do Brasil
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET() {
  try {
    // Buscar todos os estados ordenados por nome
    const states = await prisma.state.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        flag: true
      },
    });



    return NextResponse.json(states);
  } catch (error) {
    console.error('Erro ao buscar estados:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar estados do Brasil' },
      { status: 500 }
    );
  }
}