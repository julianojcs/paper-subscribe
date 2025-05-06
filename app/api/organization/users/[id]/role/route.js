import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import prisma from '../../../../../lib/db';
import { verifyPassword } from '../../../../../lib/auth';

export async function PUT(request, context) {
  try {
    const params = context.params;
    const userId = params.id;
    const session = await getServerSession(authOptions);

    // Verifica se está autenticado
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificações de segurança e autorização
    const validationResult = await validateRequest(session, userId);
    if (validationResult.error) {
      return NextResponse.json({ error: validationResult.error }, { status: validationResult.status });
    }

    const { organizationId } = validationResult;
    const { newRole, password } = await request.json();

    // Verifica se o papel é válido
    const validRoles = ['ADMIN', 'MEMBER', 'MANAGER', 'REVIEWER'];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Papel inválido' }, { status: 400 });
    }

    // Verifica a senha do usuário que está fazendo a alteração
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const passwordValid = await verifyPassword(password, currentUser.password);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
    }

    // Busca o usuário e seu papel atual na organização
    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizationMemberships: {
          where: { organizationId }
        }
      }
    });

    if (!userToUpdate) {
      return NextResponse.json({ error: 'Usuário a ser editado não encontrado' }, { status: 404 });
    }

    if (userToUpdate.organizationMemberships.length === 0) {
      return NextResponse.json({
        error: 'Usuário não pertence à sua organização'
      }, { status: 404 });
    }

    const currentRole = userToUpdate.organizationMemberships[0].role;

    // Se o papel é o mesmo, retorna sem fazer alterações
    if (currentRole === newRole) {
      return NextResponse.json({
        success: false,
        message: 'O usuário já possui este papel'
      });
    }

    // Usamos uma transação para garantir que ambas as operações sejam atômicas
    const result = await prisma.$transaction(async (tx) => {
      // 1. Atualiza o papel do usuário na organização
      await tx.organizationMember.updateMany({
        where: {
          userId,
          organizationId
        },
        data: {
          role: newRole,
          updatedAt: new Date()
        }
      });

      // 2. Busca os dados atualizados
      const updatedMembership = await tx.organizationMember.findFirst({
        where: {
          userId,
          organizationId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // 3. Registra a ação no log do sistema
      // const systemLog = await tx.systemLog.create({
      //   data: {
      //     action: 'USER_ROLE_UPDATE',
      //     description: `Alteração de papel do usuário ${userToUpdate.name} (${userToUpdate.email}) de ${currentRole} para ${newRole}`,
      //     userId: session.user.id,
      //     metadata: {
      //       targetUserId: userId,
      //       organizationId,
      //       previousRole: currentRole,
      //       newRole
      //     }
      //   }
      // });

      // return { updatedMembership, systemLog };
      return { updatedMembership };
    });

    // Retorna a resposta de sucesso com os dados atualizados
    return NextResponse.json({
      success: true,
      message: 'Papel do usuário alterado com sucesso',
      user: {
        id: result.updatedMembership.user.id,
        name: result.updatedMembership.user.name,
        email: result.updatedMembership.user.email,
        role: result.updatedMembership.role,
        organizationId: result.updatedMembership.organizationId
      },
      // logId: result.systemLog.id
    });

  } catch (error) {
    console.error('Erro ao alterar papel de usuário:', error);
    return NextResponse.json({
      error: 'Erro ao processar a solicitação: ' + error.message
    }, { status: 500 });
  }
}

/**
 * Função auxiliar para validar a requisição
 */
async function validateRequest(session, userId) {
  // Verificar se o usuário logado tem uma organização associada
  const currentUserMembership = await prisma.organizationMember.findFirst({
    where: {
      userId: session.user.id,
      role: 'ADMIN'
    },
    select: {
      organizationId: true
    }
  });

  if (!currentUserMembership) {
    return {
      error: 'Você não está associado a uma organização como administrador',
      status: 403
    };
  }

  // Só admin pode alterar papel de usuários
  if (session.user.role !== 'ADMIN') {
    return {
      error: 'Você não tem permissão para alterar papéis de usuários.',
      status: 403
    };
  }

  // O usuário não pode alterar seu próprio papel
  if (session.user.id === userId) {
    return {
      error: 'Você não pode alterar seu próprio papel.',
      status: 403
    };
  }

  return { organizationId: currentUserMembership.organizationId };
}