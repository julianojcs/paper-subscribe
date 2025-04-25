'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React from 'react'; // Importe o React explicitamente
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

const Home = () => {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { eventData: contextEventData, setEventData } = useDataContext();

  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [eventData, setLocalEventData] = useState(null);
  const [timelineItems, setTimelineItems] = useState([]);

  // Função para formatar datas do evento
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

  // Função para buscar dados do evento e timeline
  const fetchEventData = async (eventId) => {
    // Buscar os dados básicos do evento
    const eventRes = await fetch(`/api/organization/events/${eventId}`);
    const eventData = await eventRes.json();

    // Buscar os dados da timeline do evento
    const timelineRes = await fetch(`/api/organization/events/${eventId}/timeline`);
    const timelineData = await timelineRes.json();

    return {
      event: eventData.event,
      timelineItems: timelineData.timeline
    };
  };

  // Função para registrar login
  const logUserLogin = useCallback(async () => {
    const storedMetadata = sessionStorage.getItem('auth_metadata');
    if (storedMetadata) {
      try {
        const { ip, userAgent, provider } = JSON.parse(storedMetadata);
        if (provider && provider !== 'credentials') {
          sessionStorage.removeItem('auth_metadata');
          await fetch('/api/auth/log-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider, ip, userAgent })
          });
        }
      } catch (error) {
        console.error('Erro ao registrar login:', error);
      }
    }
  }, []);

  // Efeito para inicialização e carregamento de dados
  useEffect(() => {
    const initializeData = async () => {
      if (authStatus === 'loading') return;

      setLoading(true);

      try {
        // Verificar primeiro no contexto
        let eventId = contextEventData?.id;

        // Se não tiver no contexto, buscar o evento padrão
        if (!eventId) {
          const defaultRes = await fetch('/api/organization/events/default');
          if (defaultRes.ok) {
            const defaultData = await defaultRes.json();
            eventId = defaultData.event?.id;
          }
        }

        // Se ainda não tiver um ID, não podemos continuar
        if (!eventId) {
          console.error('Nenhum evento disponível');
          setLoading(false);
          return;
        }

        // Buscar os dados do evento e timeline
        const data = await fetchEventData(eventId);

        setLocalEventData(data.event);
        setTimelineItems(data.timelineItems || []);

        // Atualizar o contexto global se o evento não estava lá
        if (!contextEventData?.id && data.event) {
          setEventData(data.event);
        }

        // Registrar login se autenticado
        if (authStatus === 'authenticated') {
          await logUserLogin();
        }
      } catch (error) {
        console.error('Erro ao inicializar dados:', error);
      } finally {
        // Finalizar carregamento
        setLoading(false);

        // Atrasar levemente a exibição do conteúdo para garantir que tudo esteja pronto
        setTimeout(() => {
          setDataReady(true);
        }, 100);
      }
    };

    initializeData();
  }, [authStatus, contextEventData?.id, logUserLogin, setEventData]);

  // Status de submissão - versão melhorada
  const SubmissionStatus = () => {
    if (!eventData) return null;

    // Determinar qual status exibir (apenas um, por prioridade)
    let status = null;

    if (eventData.isEventFinished) {
      status = {
        text: "Evento encerrado",
        className: styles.finished,
        icon: <FaFlag />
      };
    } else if (eventData.isEventActive) {
      status = {
        text: "Evento em andamento",
        className: styles.active,
        icon: <FaFlag />
      };
    } else if (eventData.isReviewPhase) {
      status = {
        text: "Em fase de revisão",
        className: styles.review,
        icon: <FaPen />
      };
    } else if (eventData.isSubmissionClosed) {
      status = {
        text: "Submissões encerradas",
        className: styles.closed,
        icon: <FaPauseCircle />
      };
    } else if (eventData.isSubmissionOpen) {
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

  // Conteúdo principal
  const MainContent = () => (
    <>
      <HeaderContentTitle
        eventData={eventData}
        onImageLoad={() => setDataReady(true)}
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
                {eventData?.description || 'Bem-vindo ao sistema de submissão de trabalhos. Utilize o menu abaixo para enviar seus trabalhos ou consultar submissões anteriores.'}
              </p>
            </div>

            <div className={styles.actionsGrid}>
              <Button
                onClick={() => router.push('/paper/subscribe')}
                className={styles.mainButton}
                variant="primary"
                disabled={eventData?.isSubmissionClosed}
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
              timelineItems={timelineItems}
              formatEventDate={formatEventDate}
            />
          </div>
        ) : (
          <div className={styles.unauthenticatedContent}>
            <h2 className={styles.sectionTitle}>
              {eventData?.name ? `Participe do ${eventData.name}` : 'Submeta Seu Trabalho Científico'}
            </h2>
            <p className={styles.sectionDescription}>
              {eventData?.description ||
                'Junte-se à nossa plataforma para submeter seus trabalhos para revisão e publicação. Nossa plataforma oferece um processo de submissão simplificado e revisão especializada.'}
            </p>
            <div className={styles.authLinks}>
              <Button
                onClick={() => router.push('/login')}
                className={styles.mainButton}
                disabled={eventData?.isEventFinished}
              >
                <FaSignInAlt className={styles.buttonIcon} /> Entrar / Cadastrar
              </Button>
            </div>

            <Timeline
              timelineItems={timelineItems}
              formatEventDate={formatEventDate}
            />
          </div>
        )}
      </div>

      {eventData?.website && (
        <footer className={styles.footer}>
          <a href={eventData.website} target="_blank" rel="noopener noreferrer">
            Visite o site oficial do evento
          </a>
        </footer>
      )}
    </>
  );

  return (
    <>
      {loading || !dataReady
        ? <LoadingSpinner />
        : <PageContainer>
            <MainContent />
          </PageContainer>
      }
    </>
  );
};

export default Home;