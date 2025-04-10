import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/db";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: "Não autorizado" },
        { status: 401 }
      );
    }
    
    // Extrair dados do request
    const { provider, providerAccountId, providerEmail } = await request.json();
    
    if (!provider || !providerAccountId) {
      return NextResponse.json(
        { message: "Dados de provedor insuficientes" },
        { status: 400 }
      );
    }
    
    // Verificar se o email do provedor corresponde ao email da conta atual
    if (providerEmail && providerEmail !== session.user.email) {
      return NextResponse.json(
        { message: "O email da conta social não corresponde ao email da sua conta atual" },
        { status: 400 }
      );
    }
    
    // Verificar se a conta já está vinculada a outro usuário
    const existingAccount = await prisma.account.findFirst({
      where: {
        provider,
        providerAccountId,
      }
    });
    
    if (existingAccount && existingAccount.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Esta conta já está vinculada a outro usuário" },
        { status: 400 }
      );
    }
    
    // Se a conta não estiver vinculada, criar vinculação
    if (!existingAccount) {
      await prisma.account.create({
        data: {
          userId: session.user.id,
          type: "oauth",
          provider,
          providerAccountId,
          // Outros campos necessários...
        }
      });
    }
    
    return NextResponse.json({
      message: `Conta ${provider} vinculada com sucesso!`
    });
    
  } catch (error) {
    console.error("Erro ao vincular conta:", error);
    return NextResponse.json(
      { message: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}