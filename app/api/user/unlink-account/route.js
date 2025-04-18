import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: "Não autorizado" },
        { status: 401 }
      );
    }
    
    const { provider } = await request.json();
    
    if (!provider) {
      return NextResponse.json(
        { message: "Provedor não especificado" },
        { status: 400 }
      );
    }

    // Buscar informações do usuário para verificar métodos de login disponíveis
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        password: true,
        accounts: {
          select: {
            id: true,
            provider: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Contar métodos de login disponíveis
    let loginMethodsCount = 0;
    
    // Verificar se tem senha (login com credenciais)
    if (user.password) loginMethodsCount++;
    
    // Contar provedores sociais
    loginMethodsCount += user.accounts.length;

    // Se o usuário está tentando remover o único método de login
    if (loginMethodsCount <= 1) {
      return NextResponse.json(
        { message: "Não é possível remover seu único método de login. Adicione outro método antes de remover este." },
        { status: 400 }
      );
    }
    
    // Se for para remover credenciais (senha)
    if (provider === "credentials") {
      // Remover a senha
      await prisma.user.update({
        where: { id: session.user.id },
        data: { password: null }
      });
      
      return NextResponse.json({
        message: "Login com senha removido com sucesso"
      });
    }
    
    // Se for para remover um provedor social
    const accountToDelete = user.accounts.find(acc => acc.provider === provider);
    
    if (!accountToDelete) {
      return NextResponse.json(
        { message: "Provedor não encontrado para este usuário" },
        { status: 404 }
      );
    }
    
    // Remover a conta social
    await prisma.account.delete({
      where: {
        id: accountToDelete.id
      }
    });
    
    return NextResponse.json({
      message: "Provedor de login removido com sucesso"
    });
    
  } catch (error) {
    console.error("Erro ao desvincular conta:", error);
    return NextResponse.json(
      { message: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}