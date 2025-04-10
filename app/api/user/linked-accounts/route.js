import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }
  
  try {
    // Buscar os métodos de login do usuário
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        password: true,
        accounts: {
          select: {
            provider: true,
            providerAccountId: true
          }
        }
      }
    });
    
    const accounts = [
      // Se o usuário tem senha, adicionar método de credenciais
      ...(user.password ? [{ type: 'credentials', provider: 'credentials' }] : []),
      // Adicionar contas sociais vinculadas
      ...user.accounts.map(account => ({
        type: 'oauth',
        provider: account.provider
      }))
    ];
    
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Erro ao buscar contas vinculadas:", error);
    return NextResponse.json(
      { message: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}