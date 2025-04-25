'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

// Criar o contexto
const DataContext = createContext({
  ip: 'unknown',
  userAgent: 'unknown',
  isLoaded: false,
  eventData: null,
  setEventData: () => {},
  loading: false,
  setLoading: () => {},
  timelineData: null,
  setTimelineData: () => {},
  calculateTimelineStatus: () => ({}),
  timelineItems: [],
  setTimelineItems: () => {},
});

// Hook personalizado para usar o contexto
export const useDataContext = () => useContext(DataContext);

// Função para extrair IPv4
const extractIPv4 = (ip) => {
  if (!ip) return 'unknown';
  const match = ip.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
  return match ? match[0] : 'unknown';
};

// Provider component
export function DataProvider({ children }) {
  const [metadata, setMetadata] = useState({
    ip: 'unknown',
    userAgent: 'unknown',
    isLoaded: false,
  });

  // Estado para dados do evento
  const [eventData, setEventData] = useState(null);

  // Novo estado para loading compartilhado
  const [loading, setLoading] = useState(false);

  // Estado para dados de timeline calculados
  const [timelineData, setTimelineData] = useState(null);

  // Estado para itens da timeline vindo do banco
  const [timelineItems, setTimelineItems] = useState([]);

  // Estado local para itens da timeline
  const [localItems, setLocalItems] = useState([]);

  // Estado para erro
  const [error, setError] = useState(null);

  // Ref para evitar ciclos de sincronização
  const isUpdatingRef = useRef(false);

  // Função para calcular o status atual do cronograma usando os itens do banco
  const calculateTimelineStatus = useCallback((items = null) => {
    // Usar os itens passados como parâmetro ou os itens do estado
    const itemsToUse = items || timelineItems;
    if (!itemsToUse || itemsToUse.length === 0) return {};

    const now = new Date();

    // Filtrar apenas itens públicos
    const publicItems = itemsToUse.filter(item => item.isPublic !== false);

    // Ordenar itens por sortOrder e depois por data
    const sortedItems = [...publicItems].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return new Date(a.date) - new Date(b.date);
    });

    // Mapear para garantir consistência de formato
    const processedItems = sortedItems.map(item => ({
      id: item.id,
      date: new Date(item.date),
      name: item.name,
      label: item.name,
      description: item.description || '',
      type: item.type,
      isPast: item.isCompleted || new Date(item.date) < now
    }));

    // Encontrar momentos chave na timeline
    const submissionStart = processedItems.find(item => item.type === 'SUBMISSION_START');
    const submissionEnd = processedItems.find(item => item.type === 'SUBMISSION_END');
    const reviewStart = processedItems.find(item => item.type === 'REVIEW_START');
    const reviewEnd = processedItems.find(item => item.type === 'REVIEW_END');
    const eventStart = processedItems.find(item => item.type === 'EVENT_START');
    const eventEnd = processedItems.find(item => item.type === 'EVENT_END');

    // Calcular estados com base nos dados
    const isSubmissionOpen = submissionStart && submissionEnd
      ? now >= submissionStart.date && now <= submissionEnd.date
      : false;

    const isSubmissionClosed = submissionEnd
      ? now > submissionEnd.date
      : false;

    const isReviewPhase = reviewStart && reviewEnd
      ? now >= reviewStart.date && now <= reviewEnd.date
      : false;

    const isEventStarted = eventStart
      ? now >= eventStart.date
      : false;

    const isEventActive = eventStart && eventEnd
      ? now >= eventStart.date && now <= eventEnd.date
      : false;

    const isEventFinished = eventEnd
      ? now > eventEnd.date
      : false;

    // Encontrar o próximo evento (não passado)
    const nextMilestone = processedItems.find(item => !item.isPast);

    let daysRemaining = null;
    if (nextMilestone) {
      const diffTime = nextMilestone.date - now;
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      isSubmissionOpen,
      isSubmissionClosed,
      isReviewPhase,
      isEventStarted,
      isEventActive,
      isEventFinished,
      nextMilestone: nextMilestone?.name,
      nextMilestoneDate: nextMilestone?.date,
      nextMilestoneId: nextMilestone?.id,
      daysRemaining,
      processedItems
    };
  }, [timelineItems]);

  // Função para buscar os itens da timeline
  const fetchTimelineItems = useCallback(async (eventId) => {
    if (!eventId) return null;

    setLoading(true);

    try {
      const res = await fetch(`/api/organization/events/${eventId}/timeline`);
      const data = await res.json();

      if (res.ok && data.timeline) {
        setTimelineItems(data.timeline);

        const timelineStatus = calculateTimelineStatus(data.timeline);
        setTimelineData(timelineStatus);

        return data.timeline;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar itens da timeline:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [calculateTimelineStatus]);

  // Função para buscar dados do evento e sua timeline
  const fetchEvent = useCallback(async (eventId) => {
    if (!eventId) return null;

    setLoading(true);

    try {
      const res = await fetch(`/api/organization/events/${eventId}`);
      const data = await res.json();

      if (res.ok && data.event) {
        handleSetEventData(data.event);

        await fetchTimelineItems(eventId);

        return data.event;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar evento:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchTimelineItems]);

  // Modifique o fetchTimeline para interromper o ciclo
  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);

      // Marcar que uma atualização está em andamento para evitar loops
      isUpdatingRef.current = true;

      // Abordagem unificada para buscar dados
      const res = await fetch(`/api/organization/events/${eventData?.id}/timeline/admin`);
      const data = await res.json();

      if (res.ok) {
        const itemsWithOrder = data.timeline.map((item, index) => ({
          ...item,
          order: item.sortOrder || index,
          sortOrder: item.sortOrder || index
        }));

        // Atualizar os estados local e do contexto simultaneamente
        // em vez de depender de uma sincronização subsequente
        setLocalItems(itemsWithOrder);
        setTimelineItems?.(itemsWithOrder);
      } else {
        setError(data.error || 'Erro ao carregar cronograma');
      }
    } catch (err) {
      console.error('Erro ao carregar timeline:', err);
      setError('Falha na comunicação com o servidor');
    } finally {
      setLoading(false);
    }
  }, [eventData?.id, setLoading, setTimelineItems]);

  useEffect(() => {
    try {
      const storedEventData = localStorage.getItem('event_data');
      if (storedEventData) {
        const parsedData = JSON.parse(storedEventData);
        setEventData(parsedData);
      }
    } catch (error) {
      console.error('Erro ao recuperar dados do evento do localStorage:', error);
    }

    const fetchIpInfo = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (response.ok) {
          const data = await response.json();
          setMetadata({
            ip: data.ip,
            userAgent: navigator.userAgent,
            isLoaded: true,
          });

          sessionStorage.setItem('auth_metadata', JSON.stringify({
            ip: data.ip,
            userAgent: navigator.userAgent,
            timestamp: new Date().getTime(),
          }));
        }
      } catch (error) {
        console.error('Erro ao obter informações de IP:', error);
        setMetadata({
          ip: 'unknown',
          userAgent: navigator.userAgent,
          isLoaded: true,
        });
      }
    };

    const storedMetadata = sessionStorage.getItem('auth_metadata');
    if (storedMetadata) {
      try {
        const parsedData = JSON.parse(storedMetadata);
        const isRecent = (new Date().getTime() - parsedData.timestamp) < 3600000;

        if (isRecent) {
          setMetadata({
            ip: parsedData.ip,
            userAgent: parsedData.userAgent,
            isLoaded: true,
          });
        } else {
          fetchIpInfo();
        }
      } catch (e) {
        console.error('Erro ao recuperar metadata do sessionStorage:', e);
        fetchIpInfo();
      }
    } else {
      fetchIpInfo();
    }
  }, []);

  useEffect(() => {
    // Se estiver atualizando via fetch, não sincronizar novamente
    if (isUpdatingRef.current) {
      isUpdatingRef.current = false;
      return;
    }

    if (timelineItems && timelineItems.length > 0) {
      const itemsWithOrder = timelineItems.map((item, index) => ({
        ...item,
        order: item.sortOrder || index,
        sortOrder: item.sortOrder || index
      }));
      setLocalItems(itemsWithOrder);

      const timelineStatus = calculateTimelineStatus();
      setTimelineData(timelineStatus);
    }
  }, [timelineItems, calculateTimelineStatus]);

  const handleSetEventData = (data) => {
    setEventData(data);
    if (data) {
      localStorage.setItem('event_data', JSON.stringify(data));
    } else {
      // localStorage.removeItem('event_data');
    }
  };

  const contextValue = {
    ...metadata,
    eventData,
    setEventData: handleSetEventData,
    loading,
    setLoading,
    timelineData,
    setTimelineData,
    calculateTimelineStatus,
    timelineItems,
    setTimelineItems,
    fetchTimelineItems,
    fetchEvent,
    fetchTimeline,
    localItems,
    error
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}