import { prisma } from '/app/lib/db';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../[...nextauth]/route';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar autenticação
    if (!session) {
      return NextResponse.json({ 
        message: 'Não autorizado' 
      }, { status: 401 });
    }
    
    const { token } = await req.json();
    
    if (!token) {
      return NextResponse.json({ 
        message: 'Token não fornecido' 
      }, { status: 400 });
    }
    
    // Verificar se o token é válido
    const validToken = await prisma.organizationToken.findFirst({
      where: {
        token,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      }
    });
    
    if (!validToken) {
      return NextResponse.json({ 
        message: 'Token inválido ou expirado' 
      }, { status: 400 });
    }
    
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user) {
      return NextResponse.json({ 
        message: 'Usuário não encontrado' 
      }, { status: 404 });
    }
    
    // Associar token ao usuário (criando uma entrada em UserTokens ou tabela equivalente)
    await prisma.userToken.create({
      data: {
        userId: user.id,
        organizationTokenId: validToken.id,
      }
    });
    
    // Atualizar a sessão para incluir a verificação de token
    await prisma.session.updateMany({
      where: { userId: user.id },
      data: { eventTokenVerified: true }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Token verificado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao associar token:', error);
    return NextResponse.json({ 
      message: 'Erro ao processar solicitação' 
    }, { status: 500 });
  }
}