'use client';

import { useEffect, useState } from 'react';
import { fetchEventDetails } from '../utils/eventClient';

export function useEvent(eventId) {
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) {
      setIsLoading(false);
      setError(new Error('ID do evento não fornecido'));
      return;
    }

    async function loadEvent() {
      try {
        setIsLoading(true);
        setError(null);
        
        const eventData = await fetchEventDetails(eventId);
        setEvent(eventData);
      } catch (err) {
        setError(err);
        console.error(`Erro ao carregar evento (ID: ${eventId}):`, err);
      } finally {
        setIsLoading(false);
      }
    }

    loadEvent();
  }, [eventId]);

  return { event, isLoading, error };
}