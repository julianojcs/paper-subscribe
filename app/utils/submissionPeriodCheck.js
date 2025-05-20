import { fetchEventDetails } from './eventClient';

/**
 * Verifica se o período de submissão está encerrado para um evento
 * @param {string} eventId - ID do evento
 * @returns {Promise<boolean>} - true se o período estiver encerrado, false caso contrário
 */
export async function isSubmissionPeriodClosed(eventId) {
  try {
    const {event: eventData} = await fetchEventDetails(eventId);

    if (!eventData) {
      console.error('Evento não encontrado:', eventId);
      // Se o evento não existir, consideramos como período encerrado por segurança
      return true;
    }

    // Verificar se o período está explicitamente encerrado
    if (eventData.isSubmissionClosed || eventData.isReviewPhase || eventData.isEventFinished) {
      return true;
    }

    // Verificar se a data de término de submissão passou
    if (eventData.submissionEndDate && new Date(eventData.submissionEndDate) < new Date()) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Erro ao verificar período de submissão:', error);
    // Em caso de erro, bloquear por segurança
    return true;
  }
}