import { prisma } from '../db';
import { UserRole } from '@prisma/client'; // Importar o enum UserRole
import { Prisma } from '@prisma/client'; // Importar o Prisma para acessar o dmmf

/**
 * Serviço centralizado para verificação de permissões
 */
const permissionService = {
  /**
   * Verifica se um usuário tem permissão para gerenciar um evento
   * @param {string} userId - ID do usuário
   * @param {string} eventId - ID do evento
   * @returns {Promise<boolean>} - Retorna true se tiver permissão
   */
  async canManageEvent(userId, eventId) {
    if (!userId || !eventId) return false;

    try {
      // Buscar o evento para obter o organizationId
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { organizationId: true }
      });

      if (!event?.organizationId) return false;

      // Verificar se o usuário é um administrador na organização do evento
      const orgMembership = await prisma.organizationMember.findFirst({
        where: {
          userId: userId,
          organizationId: event.organizationId,
          role: { in: [UserRole.ADMIN] } // Usar o enum corretamente
          // role: { in: [UserRole.ADMIN, UserRole.MANAGER] } // Usar o enum corretamente
          // role: 'ADMIN'
        }
      });

      // Se o usuário for admin ou manager na organização, tem permissão
      if (orgMembership) return true;

      // Verificar se o usuário é um administrador global do sistema
      const isSystemAdmin = await this.isSystemAdmin(userId);
      return isSystemAdmin;

    } catch (error) {
      console.error('Erro ao verificar permissão de evento:', error);
      return false;
    }
  },

  /**
   * Verifica se um usuário tem permissão para gerenciar uma organização
   * @param {string} userId - ID do usuário
   * @param {string} organizationId - ID da organização
   * @returns {Promise<boolean>} - Retorna true se tiver permissão
   */
  async canManageOrganization(userId, organizationId) {
    if (!userId || !organizationId) return false;

    try {
      // Verificar se o usuário é admin ou manager na organização
      const orgMembership = await prisma.organizationMember.findFirst({
        where: {
          userId: userId,
          organizationId: organizationId,
          role: { in: [UserRole.ADMIN] } // Usar o enum corretamente
          // role: { in: [UserRole.ADMIN, UserRole.MANAGER] } // Usar o enum corretamente
        }
      });

      if (orgMembership) return true;

      // Verificar se é admin de sistema
      return await this.isSystemAdmin(userId);

    } catch (error) {
      console.error('Erro ao verificar permissão de organização:', error);
      return false;
    }
  },

  /**
   * Verifica se um usuário é administrador do sistema
   * @param {string} userId - ID do usuário
   * @returns {Promise<boolean>} - Retorna true se for admin do sistema
   */
  async isSystemAdmin(userId) {
    if (!userId) return false;

    try {
      // Verificar se o usuário faz parte da organização system como ADMIN
      const systemOrgMembership = await prisma.organizationMember.findFirst({
        where: {
          userId: userId,
          organization: {
            shortName: 'system'
          },
          role: UserRole.ADMIN // Usar o enum corretamente
        }
      });

      return !!systemOrgMembership;

    } catch (error) {
      console.error('Erro ao verificar administrador do sistema:', error);
      return false;
    }
  },

  /**
   * Verifica se um usuário pode gerenciar um paper específico
   * @param {string} userId - ID do usuário
   * @param {string} paperId - ID do paper
   * @returns {Promise<boolean>} - Retorna true se tiver permissão
   */
  async canManagePaper(userId, paperId) {
    if (!userId || !paperId) return false;

    try {
      // Verificar se o usuário é autor ou coautor do paper
      const paper = await prisma.paper.findUnique({
        where: { id: paperId },
        include: {
          authors: {
            where: { userId: userId }
          },
          event: {
            select: { organizationId: true }
          }
        }
      });

      if (!paper) return false;

      // Se for autor, tem permissão
      if (paper.authors.length > 0) return true;

      // Se não for autor, verificar se tem permissão na organização do evento
      if (paper.event?.organizationId) {
        return await this.canManageOrganization(userId, paper.event.organizationId);
      }

      return false;

    } catch (error) {
      console.error('Erro ao verificar permissão de paper:', error);
      return false;
    }
  }
};

export default permissionService;