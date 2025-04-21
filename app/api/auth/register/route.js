import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "../../../lib/db";

export async function POST(request) {
  try {
    // Extrair dados da requisição
    const { name, email, password, eventToken } = await request.json();

    // Validação básica
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar eventToken e obter o organizationId associado
    let organizationId = null;
    if (eventToken) {
      const tokenRecord = await prisma.organizationToken.findFirst({
        where: { 
          token: eventToken,
          expiresAt: {
            gte: new Date() // Verificar se o token não expirou
          }
        }
      });

      if (!tokenRecord) {
        return NextResponse.json(
          { message: "Token do evento inválido ou expirado" },
          { status: 400 }
        );
      }

      organizationId = tokenRecord.organizationId;
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

      // Se foi obtido um organizationId do eventToken, associar este usuário à organização
      if (organizationId) {
        // Verificar se já existe uma associação
        const existingMembership = await prisma.organizationMember.findFirst({
          where: {
            userId: existingUser.id,
            organizationId
          }
        });

        if (!existingMembership) {
          // Criar associação com a organização
          await prisma.organizationMember.create({
            data: {
              userId: existingUser.id,
              organizationId,
              role: "MEMBER" // Definindo papel padrão como membro
            }
          });
        }
      }

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

    // Usar uma transação para garantir que ambos os registros sejam criados ou nenhum seja
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar usuário
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      // 2. Se organizationId foi obtido do eventToken, criar associação com a organização
      if (organizationId) {
        await tx.organizationMember.create({
          data: {
            userId: newUser.id,
            organizationId,
            role: "MEMBER" // Definindo papel padrão como membro
          }
        });
      } else {
        // Se não foi fornecido um eventToken válido, podemos tentar encontrar uma organização padrão
        const defaultOrg = await tx.organization.findFirst({
          where: { isDefault: true }
        });

        if (defaultOrg) {
          await tx.organizationMember.create({
            data: {
              userId: newUser.id,
              organizationId: defaultOrg.id,
              role: "MEMBER"
            }
          });
        }
      }

      return newUser;
    });

    // Retornar resposta sem expor a senha
    const { password: _, ...userWithoutPassword } = result;

    return NextResponse.json(
      { 
        user: userWithoutPassword, 
        message: "Usuário registrado com sucesso e associado à organização" 
      },
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