/**
 * Serviço para gerenciar dados de eventos, com verificação de múltiplas fontes:
 * - Contexto global
 * - Token de registro no localStorage
 * - Dados de evento no localStorage
 */
import { useDataContext } from '/context/DataContext';
import { useSession } from 'next-auth/react';
import * as tokenService from './tokenService';
import * as localStorageService from './localStorage'; // Importar o serviço de localStorage

// Constantes para chaves de armazenamento
const EVENT_TOKEN_KEY = 'event_registration_token';
const EVENT_DATA_KEY = 'event_data';

/**
 * Busca dados de um evento pelo ID
 * @param {string} eventId - ID do evento
 * @returns {Promise<object|null>} Dados do evento ou null
 */
export const fetchEventData = async (_eventId) => {
  const eventId = _eventId || session?.user?.eventId || contextEventData?.id;
  if (!eventId) {
    throw new Error('eventId é obrigatório');
  }

  try {
    // Buscar os dados básicos do evento
    const eventRes = await fetch(`/api/organization/events/${eventId}`);
    if (!eventRes.ok) {
      throw new Error(`Erro ao buscar evento: ${eventRes.status}`);
    }
    const eventData = await eventRes.json();

    // Buscar os dados da timeline do evento
    const timelineRes = await fetch(`/api/organization/events/${eventId}/timeline`);
    if (!timelineRes.ok) {
      throw new Error(`Erro ao buscar timeline: ${timelineRes.status}`);
    }
    const timelineData = await timelineRes.json();

    const eventDataWithTimeline = {
      event: eventData.event,
      timeline: timelineData.timeline || []
    };
    console.log('Dados do evento e timeline obtidos:', eventDataWithTimeline);
    return eventDataWithTimeline;
  } catch (error) {
    console.error(`Erro ao buscar dados do evento ${eventId}:`, error);
    throw error;
  }
};

const _saveEventDataToLocalStorage = (data) => {
  if (!data) {
    console.error('Tentativa de salvar dados inválidos no localStorage');
    return null;
  }

  const eventData = data.event || data;  // Suporta ambos os formatos

  try {
    // Determinar a data de expiração
    let expirationDate;

    if (eventData.endDate) {
      expirationDate = new Date(eventData.endDate).getTime();
    } else if (eventData.timelines && eventData.timelines.length > 0) {
      const endEvent = eventData.timelines.find(item => item.type === 'EVENT_END');
      if (endEvent && endEvent.date) {
        expirationDate = new Date(endEvent.date).getTime();
      }
    }

    // Se não encontrou data de fim ou já passou, usar 1 ano como padrão
    if (!expirationDate || expirationDate < Date.now()) {
      expirationDate = Date.now() + (365 * 24 * 60 * 60 * 1000); // 1 ano
    }

    const dataToSave = {
      event: eventData,
      expires: expirationDate
    };

    // Usar o serviço de localStorage
    localStorageService.setItem(EVENT_DATA_KEY, dataToSave);
    console.log('Dados do evento salvos no localStorage com expiração:', new Date(expirationDate).toISOString());

    return dataToSave;
  } catch (error) {
    console.error('Erro ao salvar dados do evento no localStorage:', error);
    return null;
  }
};

export const saveEventDataToLocalStorage = (data) => {
  const savedData = _saveEventDataToLocalStorage(data);

  return savedData;
}

/**
 * Hook para usar o serviço de dados do evento
 * Mantido para compatibilidade com código existente
 */
export const useEventDataService = () => {
  const { eventData: contextEventData, setEventData, fetchEvent } = useDataContext();
  const { data: session, status: authStatus } = useSession();

  /**
   * Função principal para carregar dados do evento de diversas fontes
   * @returns {Promise<Object>} Objeto contendo dados do evento e fonte
   */
  const getEventData = async () => {
    // Inicializar o objeto de retorno
    const result = {
      sourceDataEvent: null,
      dataEvent: null
    };

    // 1. Verificar se dados já existem no contexto
    if (contextEventData?.id) {
      console.log('Dados do evento encontrados no contexto');
      result.sourceDataEvent = 'context';
      result.dataEvent = contextEventData;
      return result;
    }

    // 2. Se o usuário estiver autenticado, usar o eventId da sessão
    if (authStatus === "authenticated" && session?.user?.eventId) {
      try {
        console.log('Tentando buscar dados do evento a partir da sessão:', session.user.eventId);
        // Usar a função fetchEvent do DataContext que já lida com timeline
        const eventData = await fetchEvent(session.user.eventId);

        if (eventData) {
          console.log('Dados do evento obtidos via API (eventId da sessão)');
          result.sourceDataEvent = 'session';
          result.dataEvent = eventData;
          return result;
        }
      } catch (error) {
        console.error('Erro ao buscar dados do evento a partir da sessão:', error);
      }
    }

    // 3. Verificar token no localStorage
    try {
      const tokenData = await getDataFromToken();
      if (tokenData) {
        console.log('Dados do evento obtidos via token');
        result.sourceDataEvent = 'token';
        result.dataEvent = tokenData;

        // Salvar no contexto global
        setEventData(tokenData.event);

        // Salvar no localStorage para uso futuro
        saveEventDataToLocalStorage(tokenData);

        return result;
      }
    } catch (error) {
      console.error('Erro ao obter dados via token:', error);
    }

    // 4. Verificar localStorage diretamente para dados do evento
    try {
      const localData = getDataFromLocalStorage();
      if (localData) {
        console.log('Dados do evento obtidos do localStorage');
        result.sourceDataEvent = 'localStorage';
        result.dataEvent = localData;

        // Atualizar o contexto global
        setEventData(localData.event);

        return result;
      }
    } catch (error) {
      console.error('Erro ao obter dados do localStorage:', error);
    }

    // 5. Se não encontrou nada, buscar dados do evento via API (último recurso)
    if (authStatus === "authenticated" && session?.user?.activeEventId) {
      try {
        const eventData = await fetchEventData(session.user.activeEventId);
        if (eventData) {
          console.log('Dados do evento obtidos via API (activeEventId)');
          result.sourceDataEvent = 'api';
          result.dataEvent = eventData;

          // Atualizar o contexto global
          setEventData(eventData.event);

          // Salvar no localStorage
          saveEventDataToLocalStorage(eventData);

          return result;
        }
      } catch (error) {
        console.error('Erro ao buscar dados do evento via API:', error);
      }
    }

    // Nenhum dado encontrado
    console.log('Nenhum dado de evento encontrado');
    return result;
  };

  /**
   * Obtém dados do evento a partir do token armazenado
   * @returns {Promise<object|null>} Dados do evento ou null
   */
  const getDataFromToken = async () => {
    try {
      const result = await tokenService.getAndValidateStoredToken();

      if (!result.valid || !result.event?.id) {
        return null;
      }

      // Buscar dados completos do evento usando o ID
      return await fetchEventData(result.event.id);
    } catch (error) {
      console.error('Erro ao processar token para obter dados do evento:', error);
      return null;
    }
  };

  /**
   * Valida um token específico e retorna dados do evento associado
   * @param {string} token - Token a ser validado
   * @returns {Promise<{valid: boolean, eventData: object|null, message: string|null}>}
   */
  const validateEventToken = async (token) => {
    if (!token) {
      return { valid: false, eventData: null };
    }

    try {
      const validationResult = await tokenService.validateToken(token);

      if (!validationResult.valid || !validationResult.event?.id) {
        return {
          valid: false,
          eventData: null,
          message: validationResult.message
        };
      }

      // Se o token for válido, salvar no localStorage
      tokenService.saveToken(token);

      // Buscar dados completos do evento
      const eventData = await fetchEventData(validationResult.event.id);
      return { valid: true, eventData, message: validationResult.message };
    } catch (error) {
      console.error('Erro ao validar token do evento:', error);
      return {
        valid: false,
        eventData: null,
        message: 'Erro ao processar o token'
      };
    }
  };

  /**
   * Obtém dados do evento do localStorage usando o serviço localStorage.js
   * @returns {Object|null} Dados do evento ou null se não encontrado/expirado
   */
  const getDataFromLocalStorage = () => {
    // Usar o serviço de localStorage em vez do acesso direto
    const eventData = localStorageService.getItem(EVENT_DATA_KEY);

    if (!eventData) {
      return null;
    }

    // Verificar se os dados não expiraram
    if (!eventData.expires || eventData.expires < Date.now()) {
      console.log('Dados do evento expirados');
      // localStorageService.removeItem(EVENT_DATA_KEY);
      return null;
    }

    return eventData;
  };

  /**
   * Salva os dados do evento no localStorage usando o serviço localStorage.js
   * @param {Object} data Objeto contendo dados do evento
   * @returns {Object} Dados salvos com expiração
   */
  const saveEventDataToLocalStorage = (data) => {
    // Usar o serviço de localStorage para salvar os dados
    const savedData = _saveEventDataToLocalStorage(data);

    return savedData;
  };

  // Retornar as funções do hook
  return {
    getEventData,
    validateEventToken,
    fetchEventData,
    saveEventDataToLocalStorage
  };
};

export default useEventDataService;