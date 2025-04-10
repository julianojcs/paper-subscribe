'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Button from '../components/ui/Button';

export default function PaperPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Verificar mensagem de sucesso
  const success = searchParams.get('success');

  // Buscar submissões do usuário se estiver logado
  useEffect(() => {
    if (status === 'authenticated') {
      fetchSubmissions();
    }
  }, [status]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/paper');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Erro ao buscar submissões:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.container}>
        <h1 className={styles.title}>Envio de Trabalhos Científicos</h1>

        {success && (
          <div className={styles.successMessage}>
            Seu trabalho foi enviado com sucesso!
          </div>
        )}

        <div className={styles.content}>
          {status === 'authenticated' ? (
            <>
              <div className={styles.welcome}>
                <h2>Bem-vindo, {session.user.name || 'Pesquisador'}</h2>
                <p>Envie seus trabalhos científicos para revisão e publicação.</p>
              </div>

              <div className={styles.actions}>
                <Button onClick={() => router.push('/paper/subscribe')}>
                  Enviar Novo Trabalho
                </Button>
              </div>

              <div className={styles.submissionsSection}>
                <h3>Seus Trabalhos Enviados</h3>
                {loading ? (
                  <p>Carregando seus trabalhos...</p>
                ) : submissions.length > 0 ? (
                  <div className={styles.submissionsList}>
                    {submissions.map((submission) => (
                      <div key={submission.id} className={styles.submissionCard}>
                        <h4>{submission.title}</h4>
                        <p className={styles.submissionDate}>
                          Enviado em {new Date(submission.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                        <p className={styles.submissionAuthors}>
                          Autores: {submission.authors}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Você ainda não enviou nenhum trabalho.</p>
                )}
              </div>
            </>
          ) : (
            <div className={styles.unauthenticatedContent}>
              <h2>Submeta Seu Trabalho Científico</h2>
              <p>
                Junte-se à nossa plataforma para submeter seus trabalhos para revisão e publicação.
                Nossa plataforma oferece um processo de submissão simplificado e revisão especializada.
              </p>
              <div className={styles.authLinks}>
                <Button onClick={() => router.push('/login')}>
                  Entrar / Cadastrar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}