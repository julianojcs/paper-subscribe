'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useDataContext } from '../../../context/DataContext';
import { useEventDataService } from '../../lib/services/eventDataService';

/**
 * Componente invisível que sincroniza os dados do evento da sessão com o contexto
 */
export default function SessionSync() {
  const { data: session, status } = useSession();
  const { eventData, setEventData } = useDataContext();
  const eventDataService = useEventDataService();
  const [isInitialized, setIsInitialized] = useState(false);

  // Carregar dados do evento quando a sessão estiver pronta
  useEffect(() => {
    const syncEventData = async () => {
      // Evitar sincronização repetida
      if (isInitialized) return;

      // Verificar se já temos dados no contexto ou se o usuário não está autenticado
      if (eventData?.id || status !== 'authenticated') return;

      // Verificar se temos um eventId na sessão
      const eventId = session?.user?.eventId || session?.user?.activeEventId;
      if (!eventId) {
        console.log('Nenhum eventId encontrado na sessão do usuário');
        return;
      }

      console.log(`Sincronizando dados do evento ${eventId} da sessão com o contexto`);

      try {
        const result = await eventDataService.getEventData();
        if (result.dataEvent) {
          console.log(`Dados do evento sincronizados com sucesso a partir de: ${result.sourceDataEvent}`);
        } else {
          console.warn('Não foi possível obter dados do evento');
        }
      } catch (error) {
        console.error('Erro ao sincronizar dados do evento:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    // Iniciar sincronização apenas quando a sessão estiver pronta
    if (status === 'authenticated') {
      syncEventData();
    }
  }, [status, session, eventData, eventDataService, isInitialized, setEventData]);

  // Componente invisível - não renderiza nada
  return null;
}