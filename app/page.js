'use client';

import { useEffect, useState } from 'react';
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
  const { eventData: contextEventData, setEventData } = useDataContext();

  const [loading, setLoading] = useState(true);
  const [imageReady, setImageReady] = useState(false);
  const [eventData, setLocalEventData] = useState(null);
  const [timelineItems, setTimelineItems] = useState([]);
  const [sourceData, setSourceData] = useState(null);

  // Importar o serviço de dados de evento
  const { getEventData } = useEventDataService();

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

  // Efeito para inicialização e carregamento de dados - sem usar useCallback
  useEffect(() => {
    // Verificar se authStatus não está carregando antes de executar
    if (authStatus === 'loading') return;

    // Função de carregamento definida diretamente no useEffect
    const loadEventData = async () => {
      if (loading === false) return; // Evita chamadas repetidas

      try {
        console.log("Carregando dados do evento...");

        // Usar o serviço para obter dados do evento
        const result = await getEventData();

        console.log("Dados obtidos:", result);

        // Se temos dados, usar eles para atualizar o estado local
        if (result.dataEvent) {
          setLocalEventData(result.dataEvent);
          setTimelineItems(result.dataEvent.timelines || []);
          setSourceData(result.sourceDataEvent);
          setEventData(result.dataEvent); // Atualiza o contexto
        } else {
          console.log('Nenhum dado de evento disponível');
        }
      } catch (error) {
        console.error('Erro ao inicializar dados:', error);
      } finally {
        setLoading(false);
        setImageReady(true);
      }
    };

    loadEventData();

    // Retorna uma função de limpeza que não faz nada,
    // apenas para mostrar que não precisamos limpar nada
    return () => {};

  }, [authStatus, getEventData, loading, setEventData]); // Apenas depende do status de autenticação

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