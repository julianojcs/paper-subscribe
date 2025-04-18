'use client';

import { useEffect, useState } from 'react';

export default function useBrazilianStates() {
  const [states, setStates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/states');

        if (!response.ok) {
          throw new Error('Falha ao buscar estados');
        }

        const data = await response.json();
        setStates(data);
      } catch (err) {
        console.error('Erro ao buscar estados:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStates();
  }, []);

  return { states, isLoading, error };
}