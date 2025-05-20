'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDataContext } from '../../../context/DataContext';
import * as localStorageService from '../../lib/services/localStorage';
import { toast } from 'react-toastify';
import LoadingSpinner from '../ui/LoadingSpinner';

const EVENT_DATA_KEY = 'event_data';

/**
 * HOC que protege rotas de submissão quando o período está encerrado
 */
const SubmissionGuard = ({ children }) => {
  const router = useRouter();
  const { eventData: contextEventData } = useDataContext();
  const [loading, setLoading] = useState(true);
  const [isSubmissionBlocked, setIsSubmissionBlocked] = useState(false);

  useEffect(() => {
    // Função que verifica se as submissões estão encerradas
    const checkSubmissionStatus = () => {
      try {
        // Primeiro tenta obter dados do contexto
        let currentEventData = contextEventData;

        // Se não houver dados no contexto, verifica localStorage
        if (!currentEventData) {
          const storedData = localStorageService.getItem(EVENT_DATA_KEY);
          if (storedData) {
            currentEventData = storedData;
          }
        }

        // Se ainda não temos dados, não podemos verificar
        if (!currentEventData) {
          console.warn('Não foi possível verificar o status de submissão: dados do evento não encontrados');
          // Por segurança, permitir acesso
          setLoading(false);
          return;
        }

        // Normalizar estrutura de dados (produção vs. desenvolvimento)
        const eventInfo = currentEventData.event || currentEventData;

        // Verificar se as submissões estão encerradas
        const isSubmissionClosed = eventInfo.isSubmissionClosed ||
                                  eventInfo.isReviewPhase ||
                                  eventInfo.isEventFinished ||
                                  (eventInfo.submissionEndDate && new Date(eventInfo.submissionEndDate) < new Date());

        if (isSubmissionClosed) {
          setIsSubmissionBlocked(true);

          // Redirecionar e mostrar mensagem
          setTimeout(() => {
            toast.error("O período de submissão de trabalhos está encerrado.", {
              position: "top-right",
              autoClose: 5000,
              closeOnClick: true,
              pauseOnHover: true,
            });

            router.push('/paper');
          }, 5000);
        }

        setLoading(false);
      } catch (error) {
        console.error('Erro ao verificar status de submissão:', error);
        setLoading(false);
      }
    };

    checkSubmissionStatus();
  }, [contextEventData, router]);

  if (loading) {
    return <LoadingSpinner message="Verificando período de submissão..." />;
  }

  if (isSubmissionBlocked) {
    return <LoadingSpinner message="O período de submissão de trabalhos está encerrado. Redirecionando..." />;
  }

  return <>{children}</>;
};

export default SubmissionGuard;