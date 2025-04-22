'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // Adicionando importação do router
import styles from './page.module.css';
import Button from './components/ui/Button';

const Home = () => {
  const { data: session, status } = useSession();
  const router = useRouter(); // Adicionando o router
  const [eventData, setEventData] = useState({
    description: '',
    logoUrl: '',
    website: ''
  });
  const [loading, setLoading] = useState(false);

  const fetchEventDescription = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/organization/events');
      const data = await res.json();

      if (res.ok && data.events && data.events.length > 0) {
        setEventData({
          description: data.events[0].description || '',
          logoUrl: data.events[0].logoUrl || '',
          website: data.events[0].website || ''
        });
      }
      console.log('Dados do evento:', {
        description: data.events[0].description || '',
        logoUrl: data.events[0].logoUrl || '',
        website: data.events[0].website || ''
      });
      return true;
    } catch (error) {
      console.error('Erro ao carregar dados do evento:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Verificar se o usuário está autenticado
    if (status === 'loading') return; // Esperar até que o status seja definido

    if (status === 'unauthenticated') {
      // Redirecionar para a página de login se não estiver autenticado
      router.push('/login');
    }
    if (status === 'authenticated') {
      // Se o usuário estiver autenticado, buscar a descrição do evento
      fetchEventDescription();
    }

  }, [status, router, fetchEventDescription]);


  useEffect(() => {
    // Verificar se esta é uma nova sessão (login recente)
    const checkAndLogLogin = async () => {
      // Recuperar o metadata do sessionStorage
      const storedMetadata = sessionStorage.getItem('auth_metadata');

      // Se tem dados armazenados no sessionStorage e é login social
      if (storedMetadata) {
        try {
          const { ip, userAgent, provider } = JSON.parse(storedMetadata);

          if (provider && provider !== 'credentials') {
            // Limpar dados do sessionStorage para não registrar novamente
            sessionStorage.removeItem('auth_metadata');

            // Registrar o login
            await fetch('/api/auth/log-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                provider,
                ip,
                userAgent
              })
            });
          }
        } catch (error) {
          console.error('Erro ao registrar login:', error);
        }
      }
    };

    if (status === 'authenticated') {
      checkAndLogLogin();
    }
  }, [status]);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Envio de Trabalhos Científicos</h1>
        </header>

        <div className={styles.content}>
          {status === 'authenticated' ? (
            <div className={styles.authenticatedContent}>
              <div className={styles.welcome}>
                <h2 className={styles.sectionTitle}>Bem-vindo, {session.user.name || 'Pesquisador'}</h2>
                <p className={styles.sectionDescription}>{eventData?.description}</p>
              </div>

              <div className={styles.actions}>
                <Button
                  onClick={() => router.push('/paper/subscribe')}
                  className={styles.mainButton}
                >
                  Enviar Novo Trabalho
                </Button>
                <Button
                  onClick={() => router.push('/paper')}
                  variant="secondary"
                  className={styles.secondaryButton}
                >
                  Ver Meus Trabalhos
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
                  Entrar / Cadastrar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;