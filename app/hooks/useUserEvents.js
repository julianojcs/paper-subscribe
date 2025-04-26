'use client';

import { useState, useEffect } from 'react';
import { fetchUserEvents, fetchUserEventDetails } from '../lib/services/eventsClient';
import { useSession } from 'next-auth/react';

/**
 * Hook para buscar eventos relacionados ao usuário autenticado
 * @param {Object} options - Opções de consulta
 * @returns {Object} Estado relacionado aos eventos do usuário
 */
export function useUserEvents(options = {}) {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Não buscar se não estiver autenticado
    if (status === 'unauthenticated') {
      setIsLoading(false);
      setError(new Error('Usuário não autenticado'));
      return;
    }

    // Aguardar até que o status de autenticação seja resolvido
    if (status === 'loading') {
      return;
    }

    async function loadEvents() {
      try {
        setIsLoading(true);
        setError(null);

        const eventsData = await fetchUserEvents(options);
        setEvents(eventsData);
      } catch (err) {
        setError(err);
        console.error('Erro ao carregar eventos do usuário:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadEvents();
  }, [status, options]);

  return { events, isLoading, error };
}

/**
 * Hook para buscar detalhes de um evento específico do usuário
 * @param {string} eventId - ID do evento
 * @returns {Object} Estado relacionado ao evento
 */
export function useUserEventDetails(eventId) {
  const { data: session, status } = useSession();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Não buscar se não estiver autenticado
    if (status === 'unauthenticated') {
      setIsLoading(false);
      setError(new Error('Usuário não autenticado'));
      return;
    }

    // Aguardar até que o status de autenticação seja resolvido
    if (status === 'loading') {
      return;
    }

    if (!eventId) {
      setIsLoading(false);
      setError(new Error('ID do evento não fornecido'));
      return;
    }

    async function loadEvent() {
      try {
        setIsLoading(true);
        setError(null);

        const eventData = await fetchUserEventDetails(eventId);
        setEvent(eventData);
      } catch (err) {
        setError(err);
        console.error(`Erro ao carregar evento (ID: ${eventId}):`, err);
      } finally {
        setIsLoading(false);
      }
    }

    loadEvent();
  }, [eventId, status]);

  return { event, isLoading, error };
}