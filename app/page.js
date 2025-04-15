'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // Adicionando importação do router
import styles from './page.module.css';
import Button from './components/ui/Button';

const Home = () => {
  const { data: session, status } = useSession();
  const router = useRouter(); // Adicionando o router

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
                <p className={styles.sectionDescription}>
                  Envie seus trabalhos científicos para revisão e publicação através da nossa plataforma.
                  Acompanhe o status e receba feedback de especialistas da área.
                </p>
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