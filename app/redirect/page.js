// app/redirect/page.js
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useEventDataService } from '../lib/services/eventDataService';
import * as localStorageService from '../lib/services/localStorage';
import { useDataContext } from '../../context/DataContext';

// Constantes para as chaves do localStorage
const EVENT_TOKEN_KEY = 'event_registration_token';
const EVENT_DATA_KEY = 'event_data';

// Componente de loading simples
function LoadingState() {
  return <div>Processando seu token de acesso...</div>;
}

// Componente interno que usa useSearchParams
const RedirectHandler = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { validateEventToken, saveEventDataToLocalStorage } = useEventDataService();
  const { setEventData } = useDataContext();

  useEffect(() => {
    const token = searchParams.get('t');

    if (!token) {
      router.replace('/');
      return;
    }

    const validateToken = async () => {
      try {
        console.log('Validando token:', token);
        const result = await validateEventToken(token);

        if (result.valid && result.eventData) {
          console.log('Token válido, dados recebidos:', result.eventData);

          // Usar a função existente para salvar os dados no localStorage
          saveEventDataToLocalStorage(result.eventData);

          // 2. Atualizar o contexto global
          setEventData(result.eventData);

          // 3. Remover o token antigo, pois já foi validado
          localStorageService.removeItem(EVENT_TOKEN_KEY);

          console.log('Dados do evento salvos com expires:', result.eventData.expires);
        } else {
          console.error('Token inválido:', result);
        }

      } catch (error) {
        console.error('Erro ao validar token:', error);
      } finally {
        // Sempre redirecionar no final, mesmo em caso de erro
        router.replace('/login');
      }
    };

    validateToken();

  }, [router, searchParams, validateEventToken, saveEventDataToLocalStorage, setEventData]);

  return <LoadingState />;  // Mostrar algo enquanto processa
};

// Componente principal que usa Suspense
export default function RedirectPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <RedirectHandler />
    </Suspense>
  );
}