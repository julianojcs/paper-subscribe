'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './page.module.css';
import Button from './components/ui/Button';
import { FaPaperPlane, FaFileAlt, FaSignInAlt, FaCalendarAlt, FaExclamationCircle, FaCheckCircle, FaHourglass, FaPen, FaPauseCircle, FaFlag } from 'react-icons/fa';
import LoadingSpinner from './components/ui/LoadingSpinner';
import PageContainer from './components/layout/PageContainer';
import HeaderContentTitle from './components/layout/HeaderContentTitle';
import { useDataContext } from '../context/DataContext';

const Home = () => {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { eventData: contextEventData, setEventData } = useDataContext();

  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [eventData, setLocalEventData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);

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

  // Função para calcular o status atual do cronograma
  const calculateTimelineStatus = useCallback((event) => {
    if (!event) return {};
    
    const now = new Date();
    
    // Obter valores com fallback para estrutura aninhada
    const submissionStart = event.submissionStart 
      ? new Date(event.submissionStart) 
      : (event.submissionPeriod?.start ? new Date(event.submissionPeriod.start) : null);
      
    const submissionEnd = event.submissionEnd 
      ? new Date(event.submissionEnd) 
      : (event.submissionPeriod?.end ? new Date(event.submissionPeriod.end) : null);
      
    const reviewStart = event.reviewStart 
      ? new Date(event.reviewStart) 
      : (event.reviewPeriod?.start ? new Date(event.reviewPeriod.start) : null);
      
    const reviewEnd = event.reviewEnd 
      ? new Date(event.reviewEnd) 
      : (event.reviewPeriod?.end ? new Date(event.reviewPeriod.end) : null);
      
    const eventStart = event.startDate ? new Date(event.startDate) : null;
    const eventEnd = event.endDate ? new Date(event.endDate) : null;
    
    console.log('Datas calculadas para cronograma:', {
      submissionStart,
      submissionEnd,
      reviewStart,
      reviewEnd,
      eventStart,
      eventEnd
    });

    const isSubmissionOpen = submissionStart && submissionEnd 
      ? now >= submissionStart && now <= submissionEnd
      : false;
      
    const isSubmissionClosed = submissionEnd ? now > submissionEnd : false;
    
    const isReviewPhase = reviewStart && reviewEnd 
      ? now >= reviewStart && now <= reviewEnd
      : false;
      
    const isEventStarted = eventStart ? now >= eventStart : false;
    const isEventActive = eventStart && eventEnd 
      ? now >= eventStart && now <= eventEnd
      : false;
    const isEventFinished = eventEnd ? now > eventEnd : false;
    
    // Calcular próximo evento importante
    let nextMilestone = null;
    let nextMilestoneDate = null;
    let daysRemaining = null;
    
    if (submissionStart && now < submissionStart) {
      nextMilestone = 'Abertura de inscrições';
      nextMilestoneDate = submissionStart;
    } else if (submissionEnd && now < submissionEnd) {
      nextMilestone = 'Data-limite para envio dos trabalhos (resumo)';
      nextMilestoneDate = submissionEnd;
    } else if (reviewStart && now < reviewStart) {
      nextMilestone = `Divulgação dos trabalhos selecionados para a ${event.name || event.shortName} (Painéis e Temas Livres)`;
      nextMilestoneDate = reviewStart;
    } else if (reviewEnd && now < reviewEnd) {
      nextMilestone = 'Divulgação dos melhores trabalhos';
      nextMilestoneDate = reviewEnd;
    } else if (eventStart && now < eventStart) {
      nextMilestone = `Início do ${event.name || event.shortName}`;
      nextMilestoneDate = eventStart;
    } else if (eventEnd && now < eventEnd) {
      nextMilestone = `Encerramento do ${event.name || event.shortName}`;
      nextMilestoneDate = eventEnd;
    }
    
    if (nextMilestoneDate) {
      const diffTime = nextMilestoneDate - now;
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    return {
      isSubmissionOpen,
      isSubmissionClosed,
      isReviewPhase,
      isEventStarted,
      isEventActive,
      isEventFinished,
      nextMilestone,
      nextMilestoneDate,
      daysRemaining
    };
  }, []);

  // Função para buscar dados do evento apenas se não existirem no contexto
  const fetchEventDescription = useCallback(async () => {
    // Se já temos dados no contexto, usamos eles após a conversão de formato
    if (contextEventData) {
      // Converter dados do formato aninhado para o formato plano
      const adaptedEventData = {
        ...contextEventData,
        submissionStart: contextEventData.submissionPeriod?.start || null,
        submissionEnd: contextEventData.submissionPeriod?.end || null,
        reviewStart: contextEventData.reviewPeriod?.start || null,
        reviewEnd: contextEventData.reviewPeriod?.end || null
      };
      
      console.log('Dados do contexto convertidos:', adaptedEventData);
      
      setLocalEventData(adaptedEventData);
      setTimelineData(calculateTimelineStatus(adaptedEventData));
      return true;
    }
    
    // Caso contrário, buscamos os dados da API
    try {
      const res = await fetch('/api/organization/events');
      const data = await res.json();

      if (res.ok && data.events && data.events.length > 0) {
        console.log('Dados brutos do evento recebidos da API:', data.events[0]);
        
        // Converter para o formato esperado pelo componente
        const newEventData = {
          id: data.events[0].id,
          name: data.events[0].name || 'Evento Científico',
          shortName: data.events[0].shortName,
          description: data.events[0].description || '',
          logoUrl: data.events[0].logoUrl || '',
          website: data.events[0].website || '',
          startDate: data.events[0].startDate,
          endDate: data.events[0].endDate,
          // Extrair dados dos períodos aninhados
          submissionStart: data.events[0].submissionPeriod?.start || null,
          submissionEnd: data.events[0].submissionPeriod?.end || null,
          reviewStart: data.events[0].reviewPeriod?.start || null,
          reviewEnd: data.events[0].reviewPeriod?.end || null,
          // Manter a estrutura original também
          submissionPeriod: data.events[0].submissionPeriod,
          reviewPeriod: data.events[0].reviewPeriod,
          limits: data.events[0].limits
        };
        
        console.log('Dados do evento processados:', newEventData);
        
        // Atualizamos o estado local
        setLocalEventData(newEventData);
        
        // Calcular status do cronograma
        setTimelineData(calculateTimelineStatus(newEventData));
        
        // Atualizamos o contexto global para uso em outras páginas
        setEventData(newEventData);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao carregar dados do evento:', error);
      return false;
    }
  }, [contextEventData, setEventData, calculateTimelineStatus]);

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

      // Verificar primeiro no contexto e depois na API se necessário
      await fetchEventDescription();

      // Registrar login se autenticado
      if (authStatus === 'authenticated') {
        await logUserLogin();
      }

      // Finalizar carregamento
      setLoading(false);

      // Atrasar levemente a exibição do conteúdo para garantir que tudo esteja pronto
      setTimeout(() => {
        setDataReady(true);
      }, 100);
    };

    initializeData();
  }, [authStatus, router, fetchEventDescription, logUserLogin]);

  // Componente de Cronograma - Versão minimalista
  const Timeline = () => {
    if (!eventData) {
      return null;
    }
    
    const now = new Date();
    
    // Função auxiliar para obter valor de data com fallback
    const getDateValue = (primary, fallback) => primary || fallback;
    
    // Incluir todas as datas no cronograma, com verificação de fallback
    const timelineItems = [
      { 
        date: getDateValue(eventData.submissionStart, eventData.submissionPeriod?.start), 
        label: 'Abertura de inscrições',
        isPast: getDateValue(eventData.submissionStart, eventData.submissionPeriod?.start) && 
                new Date(getDateValue(eventData.submissionStart, eventData.submissionPeriod?.start)) < now
      },
      { 
        date: getDateValue(eventData.submissionEnd, eventData.submissionPeriod?.end), 
        label: 'Data-limite para envio dos trabalhos',
        isPast: getDateValue(eventData.submissionEnd, eventData.submissionPeriod?.end) && 
                new Date(getDateValue(eventData.submissionEnd, eventData.submissionPeriod?.end)) < now
      },
      { 
        date: getDateValue(eventData.reviewStart, eventData.reviewPeriod?.start), 
        label: 'Divulgação dos trabalhos selecionados',
        isPast: getDateValue(eventData.reviewStart, eventData.reviewPeriod?.start) && 
                new Date(getDateValue(eventData.reviewStart, eventData.reviewPeriod?.start)) < now
      },
      { 
        date: getDateValue(eventData.reviewEnd, eventData.reviewPeriod?.end), 
        label: 'Divulgação dos melhores trabalhos',
        isPast: getDateValue(eventData.reviewEnd, eventData.reviewPeriod?.end) && 
                new Date(getDateValue(eventData.reviewEnd, eventData.reviewPeriod?.end)) < now
      },
      { 
        date: eventData.startDate, 
        label: `Início do evento`,
        isPast: eventData.startDate && new Date(eventData.startDate) < now
      },
      { 
        date: eventData.endDate, 
        label: `Encerramento`,
        isPast: eventData.endDate && new Date(eventData.endDate) < now
      }
    ].filter(item => item.date);
    
    if (timelineItems.length === 0) {
      return null;
    }
    
    // Ordena os itens por data
    timelineItems.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Para comparação segura com o próximo milestone
    const isNextMilestone = (itemDate) => {
      if (!timelineData?.nextMilestoneDate || !itemDate) return false;
      
      const itemDateObj = new Date(itemDate);
      const nextMilestoneDateObj = new Date(timelineData.nextMilestoneDate);
      
      return itemDateObj.getTime() === nextMilestoneDateObj.getTime();
    };
    
    return (
      <div className={styles.timelineSection}>
        <h3 className={styles.timelineTitle}>
          <FaCalendarAlt className={styles.iconTitle} /> Cronograma
        </h3>
        
        {timelineData?.nextMilestone && timelineData.daysRemaining > 0 && (
          <div className={styles.nextMilestoneBox}>
            <FaExclamationCircle className={styles.alertIcon} />
            <div className={styles.nextMilestoneContent}>
              <span>{timelineData.nextMilestone}</span>
              <span className={styles.daysRemaining}>
                {timelineData.daysRemaining} {timelineData.daysRemaining === 1 ? 'dia' : 'dias'} restantes
              </span>
              <span className={styles.milestoneDate}>
                {formatEventDate(timelineData.nextMilestoneDate)}
              </span>
            </div>
          </div>
        )}

        <div className={styles.timeline}>
          {timelineItems.map((item, index) => (
            <div
              key={index}
              className={`${styles.timelineItem} ${item.isPast ? styles.past : styles.future}`}
            >
              <div className={`${styles.timelineMarker} ${item.isPast ? styles.markerPast : styles.markerFuture}`}></div>
              <div className={styles.timelineContent}>
                <div className={styles.timelineDate}>{formatEventDate(item.date)}</div>
                <div className={styles.timelineLabel}>
                  {item.label}
                  {!item.isPast && isNextMilestone(item.date) && 
                    <span className={`${styles.statusIndicator} ${styles.highlight}`}>próximo</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Status de submissão - versão melhorada
  const SubmissionStatus = () => {
    if (!timelineData) return null;
    
    // Determinar qual status exibir (apenas um, por prioridade)
    let status = null;
    
    if (timelineData.isEventFinished) {
      status = { 
        text: "Evento encerrado", 
        className: styles.finished,
        icon: <FaFlag />
      };
    } else if (timelineData.isEventActive) {
      status = { 
        text: "Evento em andamento", 
        className: styles.active,
        icon: <FaFlag />
      };
    } else if (timelineData.isReviewPhase) {
      status = { 
        text: "Em fase de revisão", 
        className: styles.review,
        icon: <FaPen />
      };
    } else if (timelineData.isSubmissionClosed) {
      status = { 
        text: "Submissões encerradas", 
        className: styles.closed,
        icon: <FaPauseCircle />
      };
    } else if (timelineData.isSubmissionOpen) {
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
                disabled={timelineData?.isSubmissionClosed}
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
            
            <Timeline />
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
                disabled={timelineData?.isEventFinished}
              >
                <FaSignInAlt className={styles.buttonIcon} /> Entrar / Cadastrar
              </Button>
            </div>
            
            <Timeline />
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