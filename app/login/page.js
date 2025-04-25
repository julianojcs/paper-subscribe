'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDataContext } from '../../context/DataContext';
import LoginForm from './components/LoginForm';
import HeaderContentTitle from '../components/layout/HeaderContentTitle';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import styles from './page.module.css';

// Componente wrapper para lidar com o useSearchParams
function LoginPageContent() {
  const [error, setError] = useState('');
  const [eventToken, setEventToken] = useState('');
  const [tokenValidated, setTokenValidated] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const { setEventData, eventData } = useDataContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estado para controlar a tab padrão
  const [defaultTab, setDefaultTab] = useState('login');

  // Constantes para armazenamento no localStorage
  const TOKEN_STORAGE_KEY = 'event_registration_token';
  const EVENT_DATA_KEY = 'event_data';

  const saveEventDataToLocalStorage = (eventDataToSave, token) => {
    // Salvar dados no localStorage
    try {
      localStorage.setItem(EVENT_DATA_KEY, JSON.stringify(eventDataToSave));
      console.log('Dados do evento salvos em localStorage:', EVENT_DATA_KEY);

      // Se foi fornecido um token, salvar também o token com os mesmos dados
      if (token) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        console.log('Token do evento excluido de localStorage: ', TOKEN_STORAGE_KEY);
      }
    } catch (storageError) {
      console.error('Erro ao salvar no localStorage:', storageError);
    }
  }

  // Função para validar o token de evento usando a API existente
  const validateEventToken = useCallback(async (token) => {
    if (!token) return false;

    try {
      // Verificar qual é o endpoint correto para validação de token
      const tokenResponse = await fetch('/api/events/validate-token', { // Ajuste este caminho para o endpoint correto
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const tokenData = await tokenResponse.json();
      console.log('Resposta da validação de token:', tokenData);

      if (!tokenResponse.ok || !tokenData.valid) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setError(tokenData.message || 'Token do evento inválido');
        console.error('Token inválido:', tokenData.message);
        return false;
      }

      setEventData(tokenData.eventData);
      saveEventDataToLocalStorage(tokenData.eventData, token);
      setTokenValidated(true);
      return true;
    } catch (error) {
      console.error('Erro ao validar token:', error);
      setError('Erro ao validar o token do evento');
      return false;
    }
  }, [setEventData]);

  // Verificar token na URL e localStorage ao carregar o componente
  useEffect(() => {
    const checkTokenAndInit = async () => {
      setLoading(true);
      const tokenFromUrl = searchParams.get('t');
      const storedTokenStr = localStorage.getItem(TOKEN_STORAGE_KEY);

      if (tokenFromUrl) {
        // Se temos token na URL, validar e definir registro como padrão
        setEventToken(tokenFromUrl);
        const isValid = await validateEventToken(tokenFromUrl);

        if (isValid) {
          setDefaultTab('register');
          // Remover o token da URL para evitar compartilhamento acidental
          router.replace('/login', undefined, { shallow: true });
        }
      } else {
        if (storedTokenStr) {
          try {
            const storedToken = JSON.parse(storedTokenStr);

            // Verificar se o token não expirou
            if (storedToken.token && storedToken.expires && storedToken.expires > Date.now()) {
              // Configurar o token para o formulário
              setEventToken(storedToken.token);

              // Validar o token com o backend
              const isValid = await validateEventToken(storedToken.token);

              if (isValid) {
                // Se o token for válido, definir a tab padrão como registro
                setDefaultTab('register');
              }
            } else {
              // Token expirado, remover do localStorage
              localStorage.removeItem(TOKEN_STORAGE_KEY);
            }
          } catch (error) {
            console.error('Erro ao processar token do localStorage:', error);
            localStorage.removeItem(TOKEN_STORAGE_KEY);
          }
        }
      }

      if (!tokenFromUrl && !storedTokenStr) {
        // Se não houver token na URL ou localStorage, definir a tab padrão como login
        setDefaultTab('login');
        // Verificar se há dados salvos do evento, independente do token
        const storedEventDataStr = localStorage.getItem(EVENT_DATA_KEY);

        if (storedEventDataStr) {
          try {
            const storedEventData = JSON.parse(storedEventDataStr);

            // Verificar se os dados não expiraram
            if (storedEventData.expires && storedEventData.expires > Date.now()) {
              // Usar os dados do evento do localStorage no contexto
              console.log('Usando dados do evento do localStorage:', storedEventData);
              setEventData(storedEventData);
            } else {
              // Dados expirados, remover do localStorage
              console.log('Dados do evento expirados, removendo do localStorage');
            }
          } catch (error) {
            console.error('Erro ao processar dados do evento do localStorage:', error);
          }
        } else {
          console.log(`Nenhum dado do evento encontrado no localStorage (chave '${EVENT_DATA_KEY}')`);
        }

        // Finalizar carregamento com um pequeno delay para animação suave
        setTimeout(() => {
          setLoading(false);
        }, 300);
      }
    };

    checkTokenAndInit();
  }, [searchParams, router, validateEventToken, setEventData, eventData, eventToken]);

  // Manipulador para o carregamento da imagem
  const handleImageLoad = () => {
    setDataReady(true);
    setLoading(false);
  };

  // Componente de conteúdo principal
  const MainContent = () => (
    <div className={`${styles.card} ${dataReady || !eventData?.logoUrl ? styles.ready : ''}`}>
      {/* Exibe HeaderContentTitle se houver dados de evento, independentemente do token */}
      {eventData?.logoUrl ? (
        <HeaderContentTitle
          eventData={eventData}
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
      setDataReady(true);
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