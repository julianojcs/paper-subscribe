/**
 * Busca todos os eventos relacionados ao usuário
 * @param {Object} options - Opções de consulta
 * @param {boolean} [options.activeOnly=true] - Se true, retorna apenas eventos ativos
 * @param {string} [options.role] - Filtrar por papel do usuário (ADMIN, REVIEWER, EDITOR)
 * @returns {Promise<Array>} Lista de eventos
 */
export async function fetchUserEvents(options = {}) {
  const { activeOnly = true, role = null } = options;

  try {
    let url = `/api/user/events?active=${activeOnly}`;

    if (role) {
      url += `&role=${encodeURIComponent(role)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Usuário não autenticado');
      }
      throw new Error('Falha ao buscar eventos');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar eventos do usuário:', error);
    throw error;
  }
}

/**
 * Busca detalhes de um evento específico do usuário
 * @param {string} eventId - ID do evento
 * @returns {Promise<Object>} Detalhes do evento
 */
export async function fetchUserEventDetails(eventId) {
  try {
    const response = await fetch(`/api/user/events/${eventId}`);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Usuário não autenticado');
      }
      if (response.status === 403) {
        throw new Error('Sem permissão para acessar este evento');
      }
      if (response.status === 404) {
        throw new Error('Evento não encontrado');
      }
      throw new Error('Falha ao buscar detalhes do evento');
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar detalhes do evento (ID: ${eventId}):`, error);
    throw error;
  }
}