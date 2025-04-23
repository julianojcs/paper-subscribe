'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';
import Button from './components/ui/Button';
import { FaPaperPlane, FaFileAlt, FaSignInAlt, FaSpinner } from 'react-icons/fa';

const Home = () => {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [eventData, setEventData] = useState({
    name: '',
    description: '',
    logoUrl: '',
    website: ''
  });
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  // Função para buscar dados do evento
  const fetchEventDescription = useCallback(async () => {
    try {
      const res = await fetch('/api/organization/events');
      const data = await res.json();

      if (res.ok && data.events && data.events.length > 0) {
        setEventData({
          name: data.events[0].name || 'Evento Científico',
          description: data.events[0].description || '',
          logoUrl: data.events[0].logoUrl || '',
          website: data.events[0].website || ''
        });
      }
      return true;
    } catch (error) {
      console.error('Erro ao carregar dados do evento:', error);
      return false;
    }
  }, []);

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
      
      // Carregar dados do evento
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

  // Componente de Loading
  const LoadingScreen = () => (
    <div className={styles.loadingContainer}>
      <FaSpinner className={styles.loadingSpinner} />
      <p>Carregando...</p>
    </div>
  );

  // Conteúdo principal
  const MainContent = () => (
    <>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {eventData?.logoUrl ? (
            <div className={styles.logoWrapper}>
              <Image 
                src={eventData.logoUrl} 
                alt={eventData.name || "Logo do evento"} 
                className={styles.eventLogo}
                width={300}
                height={150}
                priority
                quality={90}
                onLoad={() => setDataReady(true)} // Garantir que a imagem esteja carregada
              />
              <div className={styles.subtitle}>
                Sistema de Submissão de Trabalhos
              </div>
            </div>
          ) : (
            <h1 className={styles.titleFallback}>
              Sistema de Submissão de Trabalhos Científicos
            </h1>
          )}
        </div>
      </header>

      <div className={styles.content}>
        {authStatus === 'authenticated' ? (
          <div className={styles.authenticatedContent}>
            <div className={styles.welcome}>
              <h2 className={styles.sectionTitle}>
                Bem-vindo, {session?.user?.name || 'Pesquisador'}
              </h2>
              <p className={styles.sectionDescription}>{eventData?.description}</p>
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
            <h2 className={styles.sectionTitle}>Submeta Seu Trabalho Científico</h2>
            <p className={styles.sectionDescription}>
              Junte-se à nossa plataforma para submeter seus trabalhos para revisão e publicação.
              Nossa plataforma oferece um processo de submissão simplificado e revisão especializada.
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
    <div className={styles.pageWrapper}>
      <div className={`${styles.container} ${dataReady ? styles.fadeIn : styles.hidden}`}>
        {loading || !dataReady ? <LoadingScreen /> : <MainContent />}
      </div>
    </div>
  );
};

export default Home;