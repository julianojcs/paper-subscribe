'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './page.module.css';
import Button from './components/ui/Button';
import { FaPaperPlane, FaFileAlt, FaSignInAlt, FaCalendarAlt, FaExclamationCircle, FaCheckCircle, FaHourglass, FaPen, FaPauseCircle, FaFlag } from 'react-icons/fa';
import LoadingSpinner from './components/ui/LoadingSpinner';
import PageContainer from './components/layout/PageContainer';
import HeaderContentTitle from './components/layout/HeaderContentTitle';
import { useDataContext } from '../context/DataContext';
import Timeline from './components/ui/Timeline';
import { useEventDataService } from '/app/lib/services/eventDataService';

const Home = () => {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { eventData: contextEventData, setEventData, timelineItems: contextTimelineItems, setTimelineItems } = useDataContext();

  const [loading, setLoading] = useState(true);
  const [imageReady, setImageReady] = useState(false);
  const [eventData, setLocalEventData] = useState(null);
  const [timelineItems, setLocalTimelineItems] = useState([]);
  const [sourceData, setSourceData] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { getEventData } = useEventDataService();

  const formatEventDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dateString;
    }
  };

  const loadEventData = useCallback(async (force = false) => {
    if (!force && eventData && !loading) return;

    try {
      setLoading(true);
      console.log("Carregando dados do evento...", { authStatus, hasSession: !!session });

      try {
        const storedData = localStorage.getItem('event_data');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          console.log('Dados encontrados no localStorage:', parsedData.id);

          const timelineData = parsedData.timelines || [];
          console.log(`Timeline encontrada no localStorage: ${timelineData.length} itens`);

          setLocalEventData(parsedData);
          setLocalTimelineItems(timelineData);

          setEventData(parsedData);
          setTimelineItems(timelineData);

          setSourceData('localStorage');
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Erro ao ler localStorage:', error);
      }

      const result = await getEventData();
      console.log("Dados obtidos da API:", result);

      if (result?.dataEvent) {
        try {
          localStorage.setItem('event_data', JSON.stringify(result.dataEvent));
        } catch (e) {
          console.error('Erro ao salvar no localStorage:', e);
        }

        setLocalEventData(result.dataEvent);
        setLocalTimelineItems(result.dataEvent.timelines || []);
        setSourceData(result.sourceDataEvent);

        setEventData(result.dataEvent);
        setTimelineItems(result.dataEvent.timelines || []);
      } else {
        console.log('Nenhum dado de evento disponível');

        if (authStatus === 'authenticated' && session?.user?.eventId) {
          console.log('Tentando buscar usando eventId da sessão:', session.user.eventId);
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar dados:', error);
    } finally {
      setLoading(false);
      setImageReady(true);
      setIsInitialized(true);
    }
  }, [authStatus, session, loading, getEventData, eventData, setEventData, setTimelineItems]);

  useEffect(() => {
    if (authStatus === 'loading') return;

    if (isInitialized) return;

    loadEventData();
  }, [authStatus, loadEventData, isInitialized]);

  useEffect(() => {
    if (authStatus === 'authenticated' && isInitialized && !eventData) {
      console.log('Usuário autenticado e sem dados do evento. Recarregando...');
      loadEventData(true);
    }
  }, [authStatus, loadEventData, isInitialized, eventData]);

  useEffect(() => {
    if (contextEventData && !eventData) {
      setLocalEventData(contextEventData);
      setLoading(false);
      setImageReady(true);
    }

    if (contextTimelineItems?.length > 0 && timelineItems.length === 0) {
      setLocalTimelineItems(contextTimelineItems);
    }
  }, [contextEventData, contextTimelineItems, eventData, timelineItems]);

  useEffect(() => {
    console.log('Estado atual da timeline:', {
      timelineItems: timelineItems?.length || 0,
      contextTimelineItems: contextTimelineItems?.length || 0,
      currentTimelineItems: (timelineItems?.length > 0 ? timelineItems : contextTimelineItems)?.length || 0
    });
  }, [timelineItems, contextTimelineItems]);

  const SubmissionStatus = () => {
    const currentEventData = eventData || contextEventData;
    if (!currentEventData) return null;

    let status = null;

    if (currentEventData.isEventFinished) {
      status = {
        text: "Evento encerrado",
        className: styles.finished,
        icon: <FaFlag />
      };
    } else if (currentEventData.isEventActive) {
      status = {
        text: "Evento em andamento",
        className: styles.active,
        icon: <FaFlag />
      };
    } else if (currentEventData.isReviewPhase) {
      status = {
        text: "Em fase de revisão",
        className: styles.review,
        icon: <FaPen />
      };
    } else if (currentEventData.isSubmissionClosed) {
      status = {
        text: "Submissões encerradas",
        className: styles.closed,
        icon: <FaPauseCircle />
      };
    } else if (currentEventData.isSubmissionOpen) {
      status = {
        text: "Submissões abertas",
        className: styles.open,
        icon: <FaCheckCircle />
      };
    }

    if (!status) return null;

    return (
      <div className={styles.submissionStatus}>
        <div className={`${styles.statusBadge} ${status.className}`}>
          <span className={styles.statusIcon}>{status.icon}</span>
          <span>{status.text}</span>
        </div>
      </div>
    );
  };

  const MainContent = () => {
    const currentEventData = eventData || contextEventData;

    let currentTimelineItems = [];

    if (timelineItems && timelineItems.length > 0) {
      currentTimelineItems = timelineItems;
      console.log('Usando timelineItems do estado local:', timelineItems.length);
    } else if (contextTimelineItems && contextTimelineItems.length > 0) {
      currentTimelineItems = contextTimelineItems;
      console.log('Usando timelineItems do contexto global:', contextTimelineItems.length);
    } else if (currentEventData && currentEventData.timelines) {
      currentTimelineItems = currentEventData.timelines;
      console.log('Usando timelineItems diretamente do eventData:', currentEventData.timelines.length);
    }

    console.log('currentTimelineItems final:', currentTimelineItems?.length || 0);

    return (
      <>
        <HeaderContentTitle
          eventData={currentEventData}
          onImageLoad={() => setImageReady(true)}
          subtitle="Sistema de Submissão de Trabalhos"
          fallbackTitle="Sistema de Submissão de Trabalhos Científicos"
        />

        <SubmissionStatus />

        <div className={styles.content}>
          {authStatus === 'authenticated' ? (
            <div className={styles.authenticatedContent}>
              <div className={styles.welcome}>
                <h2 className={styles.sectionTitle}>
                  Bem-vindo, {session?.user?.name || 'Pesquisador'}
                </h2>
                <p className={styles.sectionDescription}>
                  {currentEventData?.description || 'Bem-vindo ao sistema de submissão de trabalhos. Utilize o menu abaixo para enviar seus trabalhos ou consultar submissões anteriores.'}
                </p>
              </div>

              <div className={styles.actionsGrid}>
                <Button
                  onClick={() => router.push('/paper/subscribe')}
                  className={styles.mainButton}
                  variant="primary"
                  disabled={currentEventData?.isSubmissionClosed}
                >
                  <FaPaperPlane className={styles.buttonIcon} />
                  <span className={styles.actionText}>Enviar Novo Trabalho</span>
                </Button>

                <Button
                  onClick={() => router.push('/paper')}
                  className={styles.secondaryButton}
                  variant="secondary"
                >
                  <FaFileAlt className={styles.buttonIcon} />
                  <span className={styles.actionText}>Meus Trabalhos</span>
                </Button>
              </div>

              <Timeline
                timelineItems={currentTimelineItems || []}
                formatEventDate={formatEventDate}
              />
            </div>
          ) : (
            <div className={styles.unauthenticatedContent}>
              <h2 className={styles.sectionTitle}>
                {currentEventData?.name ? `Participe do ${currentEventData.name}` : 'Submeta Seu Trabalho Científico'}
              </h2>
              <p className={styles.sectionDescription}>
                {currentEventData?.description ||
                  'Junte-se à nossa plataforma para submeter seus trabalhos para revisão e publicação. Nossa plataforma oferece um processo de submissão simplificado e revisão especializada.'}
              </p>
              <div className={styles.authLinks}>
                <Button
                  onClick={() => router.push('/login')}
                  className={styles.mainButton}
                  disabled={currentEventData?.isEventFinished}
                >
                  <FaSignInAlt className={styles.buttonIcon} /> Entrar / Cadastrar
                </Button>
              </div>

              <Timeline
                timelineItems={currentTimelineItems || []}
                formatEventDate={formatEventDate}
              />
            </div>
          )}
        </div>

        {currentEventData?.website && (
          <footer className={styles.footer}>
            <a href={currentEventData.website} target="_blank" rel="noopener noreferrer">
              Visite o site oficial do evento
            </a>
          </footer>
        )}
      </>
    );
  };

  return (
    <>
      {loading || !imageReady
        ? <LoadingSpinner />
        : <PageContainer>
            <MainContent />
          </PageContainer>
      }
    </>
  );
};

export default Home;