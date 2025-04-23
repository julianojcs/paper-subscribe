'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Button from './components/ui/Button';
import { FaPaperPlane, FaFileAlt, FaSignInAlt } from 'react-icons/fa';
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

  // Função para buscar dados do evento apenas se não existirem no contexto
  const fetchEventDescription = useCallback(async () => {
    // Se já temos dados no contexto, usamos eles
    if (contextEventData) {
      setLocalEventData(contextEventData);
      return true;
    }
    
    // Caso contrário, buscamos os dados da API
    try {
      const res = await fetch('/api/organization/events');
      const data = await res.json();

      if (res.ok && data.events && data.events.length > 0) {
        const newEventData = {
          name: data.events[0].name || 'Evento Científico',
          description: data.events[0].description || '',
          logoUrl: data.events[0].logoUrl || '',
          website: data.events[0].website || ''
        };
        
        // Atualizamos o estado local
        setLocalEventData(newEventData);
        
        // Atualizamos o contexto global para uso em outras páginas
        setEventData(newEventData);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao carregar dados do evento:', error);
      return false;
    }
  }, [contextEventData, setEventData]);

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

  // Conteúdo principal
  const MainContent = () => (
    <>
      <HeaderContentTitle
        eventData={eventData}
        onImageLoad={() => setDataReady(true)}
        subtitle="Sistema de Submissão de Trabalhos"
        fallbackTitle="Sistema de Submissão de Trabalhos Científicos"
      />

      <div className={styles.content}>
        {authStatus === 'authenticated' ? (
          <div className={styles.authenticatedContent}>
            <div className={styles.welcome}>
              <h2 className={styles.sectionTitle}>
                Bem-vindo, {session?.user?.name || 'Pesquisador'}
              </h2>
              {/* Usar descrição do evento, se disponível */}
              <p className={styles.sectionDescription}>
                {eventData?.description || 'Bem-vindo ao sistema de submissão de trabalhos. Utilize o menu abaixo para enviar seus trabalhos ou consultar submissões anteriores.'}
              </p>
            </div>

            <div className={styles.actionsGrid}>
              <Button
                onClick={() => router.push('/paper/subscribe')}
                className={styles.mainButton}
                variant="primary"
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
              >
                <FaSignInAlt className={styles.buttonIcon} /> Entrar / Cadastrar
              </Button>
            </div>
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