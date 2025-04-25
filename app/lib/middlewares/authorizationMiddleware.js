import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '/app/api/auth/[...nextauth]/route';
import permissionService from '../services/permissionService';

/**
 * Factory de middleware de autorização
 * @param {Function} permissionCheck - Função que verifica permissão específica
 * @returns {Function} - Middleware configurado
 */
export function createAuthorizationMiddleware(permissionCheck) {
  return async (request, params) => {
    // Verificar se o usuário está autenticado
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Não autorizado' },
          { status: 401 }
        )
      };
    }

    // Executar a verificação de permissão específica
    const hasPermission = await permissionCheck(session.user.id, params);
    if (!hasPermission) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Sem permissão para executar esta ação' },
          { status: 403 }
        )
      };
    }

    // Autorizado
    return {
      success: true,
      user: session.user
    };
  };
}

/**
 * Middlewares de autorização comuns pré-configurados
 */
export const authorizationMiddlewares = {
  /**
   * Middleware para verificar permissão de gerenciamento de evento
   */
  eventManager: createAuthorizationMiddleware(async (userId, params) => {
    const eventId = params?.id || params?.eventId;
    return await permissionService.canManageEvent(userId, eventId);
  }),

  /**
   * Middleware para verificar permissão de gerenciamento de organização
   */
  organizationManager: createAuthorizationMiddleware(async (userId, params) => {
    const organizationId = params?.id || params?.organizationId;
    return await permissionService.canManageOrganization(userId, organizationId);
  }),

  /**
   * Middleware para verificar se é administrador do sistema
   */
  systemAdmin: createAuthorizationMiddleware(async (userId) => {
    return await permissionService.isSystemAdmin(userId);
  }),

  /**
   * Middleware para verificar permissão de gerenciamento de paper
   */
  paperManager: createAuthorizationMiddleware(async (userId, params) => {
    const paperId = params?.id || params?.paperId;
    return await permissionService.canManagePaper(userId, paperId);
  })
};