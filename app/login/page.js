'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useDataContext } from '../../context/DataContext';
import { useEventDataService } from '../lib/services/eventDataService';
import LoginForm from './components/LoginForm';
import HeaderContentTitle from '../components/layout/HeaderContentTitle';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import styles from './page.module.css';

function LoginPageContent() {
  const [error, setError] = useState('');
  const [eventToken, setEventToken] = useState('');
  const [tokenValidated, setTokenValidated] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const { eventData } = useDataContext();
  const [ isDataLoadinfFinished, setIsDataLoadinfFinished ] = useState(false);

  // Estado para controlar a tab padrão
  const [defaultTab, setDefaultTab] = useState('login');

  // Usar o serviço de dados do evento
  const {getEventData} = useEventDataService();

  // Carregar dados do evento ao iniciar o componente
  useEffect(() => {
    const loadEventData = async () => {
      try {
        setLoading(true);


        // Obter dados do evento usando o serviço
        const result = await getEventData();

        console.log('Dados do evento carregados de:', result.sourceDataEvent);
        setIsDataLoadinfFinished(true);

        if (result.dataEvent) {
          // Se os dados vieram de um token, definir a tab de registro como padrão
          // e configurar o estado do token
          if (result.sourceDataEvent === 'token') {
            setDefaultTab('register');

            // Extrair o token do localStorage se disponível
            const tokenStr = localStorage.getItem('event_registration_token');
            if (tokenStr) {
              try {
                const tokenData = JSON.parse(tokenStr);
                setEventToken(tokenData.token);
                setTokenValidated(true);
              } catch (error) {
                console.error('Erro ao processar token:', error);
              }
            }
          }
        } else {
          console.log('Nenhum dado de evento encontrado');
          setIsDataLoadinfFinished(true);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do evento:', error);
        setError('Ocorreu um erro ao carregar os dados do evento');
      } finally {
        // Finalizar carregamento com um pequeno delay para animação suave
        setTimeout(() => {
          setLoading(false);
        }, 300);
      }
    };

    if (isDataLoadinfFinished) return; // Evita chamadas repetidas
    loadEventData();
  }, [getEventData, isDataLoadinfFinished]);

  // Manipulador para o carregamento da imagem
  const handleImageLoad = () => {
    setImageReady(true);
    setLoading(false);
  };

  // Componente de conteúdo principal
  const MainContent = () => (
    <div className={`${styles.card} ${imageReady || !eventData?.logoUrl ? styles.ready : ''}`}>
      {/* Exibe HeaderContentTitle se houver dados de evento */}
      {eventData?.logoUrl ? (
        <HeaderContentTitle
          eventData={{eventLogoUrl: eventData.logoUrl, eventName: eventData.name}}
          onImageLoad={handleImageLoad}
          subtitle="Sistema de Submissão de Trabalhos"
          fallbackTitle="Registro para Evento Científico"
          className={styles.fullWidthHeader}
        />
      ) : (
        <div className={styles.standardHeader}>
          <h1 className={styles.title}>Envio de Trabalho Científico</h1>
        </div>
      )}

      {/* Restante do conteúdo do card */}
      <div className={styles.cardContent}>
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.tabs}>
          <LoginForm
            eventToken={eventToken}
            tokenValidated={tokenValidated}
            defaultTab={defaultTab}
            eventData={eventData}
          />
        </div>

        <div className={styles.footer}>
          <p>
            Ao se registrar, você concorda com nossos <Link href="https://www.canva.com/design/DAGjujtuRg8/UE46Fq6VPopeumkfxUrFZw/view"  target="_blank" rel="noopener noreferrer">Termos de Serviço/Regulamento</Link>.
          </p>
        </div>
      </div>
    </div>
  );

  // Componente de carregamento
  const LoadingContent = () => (
    <div className={styles.loadingWrapper}>
      <LoadingSpinner message="Preparando formulário..." />
    </div>
  );

  // Effect para detectar quando carregar mesmo sem eventData
  useEffect(() => {
    if (!loading && !eventData?.logoUrl) {
      setImageReady(true);
    }
  }, [loading, eventData]);

  return (
    <div className={styles.container}>
      {loading ? <LoadingContent /> : <MainContent />}
    </div>
  );
}

// Componente principal com Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          <LoadingSpinner message="Carregando..." />
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}