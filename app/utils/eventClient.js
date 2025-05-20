/**
 * Busca todos os eventos ativos
 * @param {boolean} activeOnly - Se true, retorna apenas eventos ativos
 * @returns {Promise<Array>} Lista de eventos
 */
export async function fetchEvents(activeOnly = true) {
  try {
    const response = await fetch(`/api/events?active=${activeOnly}`);

    if (!response.ok) {
      throw new Error('Falha ao buscar eventos');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    throw error;
  }
}

/**
 * Busca detalhes de um evento específico
 * @param {string} eventId - ID do evento
 * @returns {Promise<Object>} Detalhes do evento
 */
export async function fetchEventDetails(eventId) {
  try {
    const response = await fetch(`/api/organization/events/${eventId}`);

    if (!response.ok) {
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

/**
 * Busca eventos com inscrições abertas ou prestes a abrir
 * @param {boolean} includeUpcoming - Se true, inclui eventos que começarão em breve
 * @returns {Promise<Array>} Lista de eventos atuais
 */
export async function fetchCurrentEvents(includeUpcoming = true) {
  try {
    const response = await fetch(`/api/events/current?upcoming=${includeUpcoming}`);

    if (!response.ok) {
      throw new Error('Falha ao buscar eventos atuais');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar eventos atuais:', error);
    throw error;
  }
}