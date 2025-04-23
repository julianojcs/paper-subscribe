'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDataContext } from '../../context/DataContext';
import LoginForm from './components/LoginForm';
import HeaderContentTitle from '../components/layout/HeaderContentTitle';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import styles from './page.module.css';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [eventToken, setEventToken] = useState('');
  const [tokenValidated, setTokenValidated] = useState(false);
  const [tokenValidating, setTokenValidating] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const { setEventData, eventData } = useDataContext();
  const searchParams = useSearchParams();
  const router = useRouter();

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
        sessionStorage.removeItem('event_registration_token');
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

  useEffect(() => {
    console.log('Inicializando página de login e verificando tokens');
    setLoading(true);
    
    const token = searchParams?.get('t');
    const storedToken = sessionStorage.getItem('event_registration_token');
    console.log('Token na URL:', token, 'Token armazenado:', storedToken);

    const checkToken = async () => {
      if (token) {
        console.log('Token encontrado na URL, processando...');
        window.history.replaceState(null, '', window.location.pathname);
        router.replace(window.location.pathname, undefined, { shallow: true });
        
        const isValid = await validateEventToken(token);
        
        if (isValid) {
          setEventToken(token);
          sessionStorage.setItem('event_registration_token', JSON.stringify({
            token: token,
            expires: Date.now() + 1000 * 60 * 10,
            validated: true
          }));
        }
      }
      else if (storedToken) {
        console.log('Token encontrado no sessionStorage');
        try {
          const storedData = JSON.parse(storedToken);
          
          if (storedData.token && storedData.expires > Date.now()) {
            if (storedData.validated) {
              console.log('Token já validado anteriormente');
              setEventToken(storedData.token);
              setTokenValidated(true);
            } else {
              console.log('Token não validado anteriormente, validando agora');
              const isValid = await validateEventToken(storedData.token);
              
              if (isValid) {
                setEventToken(storedData.token);
                sessionStorage.setItem('event_registration_token', JSON.stringify({
                  ...storedData,
                  validated: true
                }));
              }
            }
          } else {
            console.log('Token expirado');
            sessionStorage.removeItem('event_registration_token');
          }
        } catch (error) {
          console.log('Erro ao analisar token, tratando como formato antigo:', error);
          const isValid = await validateEventToken(storedToken);
          
          if (isValid) {
            setEventToken(storedToken);
            sessionStorage.setItem('event_registration_token', JSON.stringify({
              token: storedToken,
              expires: Date.now() + 1000 * 60 * 10,
              validated: true
            }));
          }
        }
      }
      
      // Finalizar o carregamento após processar o token
      setTimeout(() => {
        // Se não temos token para validar ou a validação já terminou,
        // podemos exibir o formulário de login
        if ((!token && !storedToken) || !tokenValidating) {
          setLoading(false);
        }
      }, 300); // Pequeno atraso para garantir uma transição suave
    };

    checkToken();
  }, [searchParams, router, setEventData, validateEventToken, tokenValidating]);

  // Manipulador para o carregamento da imagem
  const handleImageLoad = () => {
    setDataReady(true);
    // Quando a imagem terminar de carregar, não estamos mais carregando
    setLoading(false);
  };

  // Componente de conteúdo principal
  const MainContent = () => (
    <div className={`${styles.card} ${dataReady || !tokenValidated ? styles.ready : ''}`}>
      {tokenValidated && eventData ? (
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
      
      <div className={styles.cardContent}>
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.tabs}>
          <LoginForm 
            eventToken={eventToken}
            tokenValidated={tokenValidated}
            defaultTab={tokenValidated ? 'register' : 'login'}
            eventData={eventData} // Adicione esta propriedade
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
    // Se o token foi validado mas não temos logo, ou se não temos token,
    // podemos exibir a página
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