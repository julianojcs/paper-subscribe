'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useDataContext } from '../context/DataContext';

/**
 * Hook para verificar e registrar o estado de sincronização entre sessão e contexto
 * Útil para depuração e desenvolvimento
 */
export default function useEventSync() {
  const { data: session } = useSession();
  const { eventData } = useDataContext();

  useEffect(() => {
    // Verificar se os dados estão sincronizados
    const sessionEventId = session?.user?.eventId || session?.user?.activeEventId;
    const contextEventId = eventData?.id;

    // Log colorido para facilitar a visualização no console
    if (sessionEventId && contextEventId) {
      if (sessionEventId === contextEventId) {
        console.log('%c✓ Dados sincronizados! Evento: ' + sessionEventId, 'color: green');
      } else {
        console.log('%c⚠ Sincronização incorreta! ' +
          `Sessão: ${sessionEventId} vs Contexto: ${contextEventId}`, 'color: orange');
      }
    } else if (sessionEventId) {
      console.log('%c⚠ Evento na sessão, mas não no contexto: ' + sessionEventId, 'color: orange');
    } else if (contextEventId) {
      console.log('%c⚠ Evento no contexto, mas não na sessão: ' + contextEventId, 'color: blue');
    } else {
      console.log('%c⚠ Nenhum evento na sessão ou no contexto', 'color: gray');
    }
  }, [session, eventData]);

  // Não retorna nada - apenas para depuração
}