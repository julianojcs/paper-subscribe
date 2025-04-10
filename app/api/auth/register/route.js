import { NextResponse } from "next/server";
import prisma from "../../../lib/db";
import bcrypt from "bcrypt";

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    // Validação básica
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true }
    });

    // Se o usuário existe, mas não tem senha (veio de login social)
    if (existingUser && !existingUser.password) {
      // Adicionar senha ao usuário existente
      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          // Atualizar nome se vier vazio do provedor social
          name: existingUser.name || name
        }
      });

      return NextResponse.json(
        {
          message: "Senha adicionada com sucesso à sua conta existente. Agora você pode fazer login com email e senha.",
          linkToExistingAccount: true
        },
        { status: 200 }
      );
    }

    // Se o usuário já existe com senha, não permitir novo registro
    if (existingUser && existingUser.password) {
      return NextResponse.json(
        { message: "Este email já está em uso" },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Retornar resposta sem expor a senha
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { user: userWithoutPassword, message: "Usuário registrado com sucesso" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return NextResponse.json(
      { message: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}