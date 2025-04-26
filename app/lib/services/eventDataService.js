/**
 * Serviço para gerenciar dados de eventos, com verificação de múltiplas fontes:
 * - Contexto global
 * - Token de registro no localStorage
 * - Dados de evento no localStorage
 */
import { useDataContext } from '/context/DataContext';

const EVENT_TOKEN_KEY = 'event_registration_token';
const EVENT_DATA_KEY = 'event_data';

/**
 * Hook para gerenciar dados de eventos
 */
export const useEventDataService = () => {
  const { eventData: contextEventData, setEventData } = useDataContext();

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

    // 2. Verificar token no localStorage
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

    // 3. Verificar localStorage diretamente para dados do evento
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

    // Nenhum dado encontrado
    console.log('Nenhum dado de evento encontrado');
    return result;
  };

  /**
   * Tenta obter dados do evento através do token no localStorage
   * @returns {Promise<Object|null>} Dados do evento ou null se falhar
   */
  const getDataFromToken = async () => {
    const tokenStr = localStorage.getItem(EVENT_TOKEN_KEY);
    if (!tokenStr) {
      return null;
    }

    try {
      const tokenData = JSON.parse(tokenStr);

      // Verificar se o token não expirou
      if (!tokenData.token || !tokenData.expires || tokenData.expires < Date.now()) {
        console.log('Token expirado, removendo do localStorage');
        localStorage.removeItem(EVENT_TOKEN_KEY);
        return null;
      }

      // Validar o token com a API
      const validateResponse = await fetch('/api/token/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenData.token }),
      });

      const validationData = await validateResponse.json();

      if (!validateResponse.ok || !validationData.valid) {
        console.log('Token inválido, removendo do localStorage');
        localStorage.removeItem(EVENT_TOKEN_KEY);
        return null;
      }

      // Se o token é válido mas não temos um event.id, algo está errado
      if (!validationData.event.id) {
        console.error('Token válido, mas não retornou eventId');
        return null;
      }

      // Buscar dados do evento usando o eventId retornado pela validação
      return await fetchEventData(validationData.event.id);

    } catch (error) {
      console.error('Erro ao processar token:', error);
      localStorage.removeItem(EVENT_TOKEN_KEY);
      return null;
    }
  };

  /**
   * Busca dados do evento e timeline da API
   * @param {string} eventId Id do evento
   * @returns {Promise<Object>} Dados do evento e timeline
   */
  const fetchEventData = async (eventId) => {
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

      return {
        event: eventData.event,
        timelineItems: timelineData.timeline
      };
    } catch (error) {
      console.error(`Erro ao buscar dados do evento ${eventId}:`, error);
      throw error;
    }
  };

  /**
   * Obtém dados do evento do localStorage
   * @returns {Object|null} Dados do evento ou null se não encontrado/expirado
   */
  const getDataFromLocalStorage = () => {
    const eventDataStr = localStorage.getItem(EVENT_DATA_KEY);
    if (!eventDataStr) {
      return null;
    }

    try {
      const eventData = JSON.parse(eventDataStr);

      // Verificar se os dados não expiraram
      if (!eventData.expires || eventData.expires < Date.now()) {
        console.log('Dados do evento expirados, removendo do localStorage');
        localStorage.removeItem(EVENT_DATA_KEY);
        return null;
      }

      return eventData;
    } catch (error) {
      console.error('Erro ao processar dados do evento do localStorage:', error);
      localStorage.removeItem(EVENT_DATA_KEY);
      return null;
    }
  };

  /**
   * Salva os dados do evento no localStorage
   * @param {Object} data Objeto contendo dados do evento e timeline
   */
  const saveEventDataToLocalStorage = (data) => {
    if (!data || !data.event) {
      console.error('Tentativa de salvar dados inválidos no localStorage');
      return;
    }

    try {
      // Determinar a data de expiração
      let expirationDate;

      if (data.event.endDate) {
        expirationDate = new Date(data.event.endDate).getTime();
      } else if (data.timelineItems && data.timelineItems.length > 0) {
        const endEvent = data.timelineItems.find(item => item.type === 'EVENT_END');
        if (endEvent && endEvent.date) {
          expirationDate = new Date(endEvent.date).getTime();
        }
      }

      // Se não encontrou data de fim ou já passou, usar 1 ano como padrão
      if (!expirationDate || expirationDate < Date.now()) {
        expirationDate = Date.now() + (365 * 24 * 60 * 60 * 1000); // 1 ano
      }

      const dataToSave = {
        ...data,
        expires: expirationDate
      };

      localStorage.setItem(EVENT_DATA_KEY, JSON.stringify(dataToSave));
      console.log('Dados do evento salvos no localStorage com expiração:', new Date(expirationDate).toISOString());

      // Remover token após salvar os dados do evento
      localStorage.removeItem(EVENT_TOKEN_KEY);
      console.log('Token de registro removido após salvar dados do evento');

    } catch (error) {
      console.error('Erro ao salvar dados do evento no localStorage:', error);
    }
  };

  return {
    getEventData,
    fetchEventData,
    saveEventDataToLocalStorage
  };
};

export default useEventDataService;