import { NextResponse } from 'next/server';
import { prisma } from '/app/lib/db';

export async function POST(req) {
  try {
    const { email, provider } = await req.json();

    // Se não tiver email, retorne erro
    if (!email) {
      return NextResponse.json({
        exists: false,
        message: 'Email é obrigatório'
      }, { status: 400 });
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    // Verificar se existe uma conta relacionada com esse provedor
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: existingUser?.id,
        provider,
      },
    });

    return NextResponse.json({
      exists: !!existingUser, // Converte para booleano
      hasProvider: !!existingAccount,
      email
    });

  } catch (error) {
    console.error('Erro ao verificar conta:', error);
    return NextResponse.json({
      exists: false,
      message: 'Erro ao verificar conta'
    }, { status: 500 });
  }
}