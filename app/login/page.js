'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  const [tokenValidating, setTokenValidating] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const { setEventData, eventData } = useDataContext();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Constantes para armazenamento no localStorage
  const TOKEN_STORAGE_KEY = 'event_registration_token';
  const TOKEN_EXPIRATION_MS = 1000 * 60 * 60 * 24; // 24 horas

  const validateEventToken = useCallback(async (token) => {
    console.log('Validando token do evento:', token);
    if (!token) return false;
    setTokenValidating(true);

    try {
      const tokenResponse = await fetch('/api/events/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || !tokenData.valid) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setError(tokenData.message || 'Token do evento inválido');
        setEventToken('');
        setTokenValidating(false);
        console.error('Token inválido:', tokenData.message);
        return false;
      }

      if (tokenData.eventData) {
        setEventData(tokenData.eventData);
        console.log('Dados do evento armazenados no contexto:', tokenData.eventData);
      }
      
      setTokenValidated(true);
      setTokenValidating(false);
      return true;
    } catch (error) {
      console.error('Erro ao validar token:', error);
      setError('Erro ao validar o token do evento');
      setTokenValidating(false);
      return false;
    }
  }, [setEventData]);

  // Função para buscar dados do evento de forma inteligente
  const fetchEventData = useCallback(async () => {
    // Se já temos dados no contexto, use-os
    if (eventData && eventData.logoUrl) {
      console.log('Usando dados de evento do contexto:', eventData);
      return true;
    }
    
    // Verifique se temos um token válido armazenado
    const storedTokenData = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedTokenData) {
      console.log('Sem token armazenado, não é possível buscar dados do evento');
      return false;
    }
    
    try {
      // Analisar o token armazenado
      const storedData = JSON.parse(storedTokenData);
      
      // Verificar se o token é válido e não está expirado
      if (!storedData.token || !storedData.validated || storedData.expires <= Date.now()) {
        console.log('Token inválido ou expirado no localStorage');
        return false;
      }
      
      console.log('Token válido encontrado, buscando dados do evento com token:', storedData.token);
      
      // Buscar dados do evento usando o token
      const response = await fetch('/api/events/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: storedData.token }),
      });
      
      const tokenData = await response.json();
      
      if (!response.ok || !tokenData.valid || !tokenData.eventData) {
        console.error('Falha ao validar token armazenado:', tokenData.message || 'Token inválido');
        return false;
      }
      
      // Se os dados do evento foram retornados com sucesso
      if (tokenData.eventData) {
        console.log('Dados do evento recuperados através do token armazenado:', tokenData.eventData);
        setEventData(tokenData.eventData);
        
        // Como o token foi validado novamente com sucesso:
        setEventToken(storedData.token);
        setTokenValidated(true);
        
        // Atualize o token no localStorage para renovar sua validade
        localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({
          ...storedData,
          validated: true,
          expires: Date.now() + TOKEN_EXPIRATION_MS
        }));
        
        return true;
      }
    } catch (error) {
      console.error('Erro ao buscar dados do evento:', error);
    }
    
    return false;
  }, [eventData, setEventData, TOKEN_STORAGE_KEY, TOKEN_EXPIRATION_MS]);

  useEffect(() => {
    console.log('Inicializando página de login e verificando tokens');
    setLoading(true);
    
    const token = searchParams?.get('t');
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    console.log('Token na URL:', token, 'Token armazenado:', storedToken);

    const checkToken = async () => {
      let tokenProcessed = false;
      
      if (token) {
        console.log('Token encontrado na URL, processando...');
        window.history.replaceState(null, '', window.location.pathname);
        router.replace(window.location.pathname, undefined, { shallow: true });
        
        const isValid = await validateEventToken(token);
        
        if (isValid) {
          setEventToken(token);
          localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({
            token: token,
            expires: Date.now() + TOKEN_EXPIRATION_MS,
            validated: true,
            createdAt: Date.now()
          }));
        }
        tokenProcessed = true;
      }
      else if (storedToken) {
        console.log('Token encontrado no localStorage');
        try {
          const storedData = JSON.parse(storedToken);
          
          if (storedData.token && storedData.expires > Date.now()) {
            if (storedData.validated) {
              console.log('Token já validado anteriormente');
              setEventToken(storedData.token);
              setTokenValidated(true);
              
              // Atualizar o timestamp de expiração para renovar a validade
              localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({
                ...storedData,
                expires: Date.now() + TOKEN_EXPIRATION_MS
              }));
            } else {
              console.log('Token não validado anteriormente, validando agora');
              const isValid = await validateEventToken(storedData.token);
              
              if (isValid) {
                setEventToken(storedData.token);
                localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({
                  ...storedData,
                  validated: true,
                  expires: Date.now() + TOKEN_EXPIRATION_MS
                }));
              }
            }
          } else {
            console.log('Token expirado');
            localStorage.removeItem(TOKEN_STORAGE_KEY);
          }
        } catch (error) {
          console.log('Erro ao analisar token, tratando como formato antigo:', error);
          const isValid = await validateEventToken(storedToken);
          
          if (isValid) {
            setEventToken(storedToken);
            localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({
              token: storedToken,
              expires: Date.now() + TOKEN_EXPIRATION_MS,
              validated: true,
              createdAt: Date.now()
            }));
          }
        }
        tokenProcessed = true;
      }
      
      // Se não temos um token válido, tentar buscar os dados do evento mesmo assim
      if (!tokenProcessed || !eventData) {
        await fetchEventData();
      }
      
      // Finalizar o carregamento após processar o token e/ou buscar dados do evento
      setTimeout(() => {
        setLoading(false);
      }, 300);
    };

    checkToken();
  }, [searchParams, router, setEventData, validateEventToken, tokenValidating, TOKEN_EXPIRATION_MS, fetchEventData, eventData]);

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
            defaultTab={tokenValidated ? 'register' : 'login'}
            eventData={eventData}
          />
        </div>

        <div className={styles.footer}>
          <p>
            Ao fazer login, você concorda com nossos <Link href="/terms">Termos de Serviço</Link> e <Link href="/privacy">Política de Privacidade</Link>.
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

  // Effect para quando o token foi validado mas não tem imagem
  useEffect(() => {
    if ((tokenValidated && !eventData?.logoUrl) || (!tokenValidated && !tokenValidating)) {
      setLoading(false);
    }
  }, [tokenValidated, eventData, tokenValidating]);

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