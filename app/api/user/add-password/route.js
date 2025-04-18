import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  try {
    const { password } = await request.json();

    if (!password || password.length < 6) {
      return NextResponse.json(
        { message: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Atualizar o usuário usando o ID da sessão atual
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword }
    });

    return NextResponse.json({
      message: "Senha adicionada com sucesso"
    });
  } catch (error) {
    console.error("Erro ao adicionar senha:", error);
    return NextResponse.json(
      { message: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}