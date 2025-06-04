'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './paper.module.css';
import Button from '../components/ui/Button';
import { FaFileAlt } from 'react-icons/fa';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PageContainer from '../components/layout/PageContainer';
import HeaderContentTitle from '../components/layout/HeaderContentTitle';
import { isSubmissionPeriodClosed } from '../utils/submissionPeriodCheck';
import PaperCard from '../components/ui/PaperCard';

export default function PaperPage({ searchParams }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Extrair valores do searchParams conforme necessário
  const page = parseInt(searchParams?.page || '1', 10);
  const SearchParamsActions = [
    { param: 'success', label: 'Sucesso' },
    { param: 'withdrawn', label: 'Retirado' },
    { param: 'submitted', label: 'Submetido' }
  ];
  const searchParamsReceived = SearchParamsActions.find(action => {
    const paramValue = searchParams?.[action.param];
    return paramValue === 'true' || paramValue === 'false';
  })

  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contentReady, setContentReady] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const eventLogoUrl = session?.user?.activeEventLogoUrl;
  const eventName = session?.user?.activeEventName;
  const eventId = session?.user?.activeEventId;

  const [submissionPeriodClosed, setSubmissionPeriodClosed] = useState(false);

  useEffect(() => {
    if (eventId) {
      isSubmissionPeriodClosed(eventId)
        .then(closed => setSubmissionPeriodClosed(closed))
        .catch(err => {
          console.error("Error checking submission period:", err);
          setSubmissionPeriodClosed(false);
        });
    }
  }, [eventId]);

  // Buscar submissões do usuário se estiver logado
  useEffect(() => {
    // Se o status está mudando ou é desconhecido, mostrar loading
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    // Redirecionar se não estiver autenticado
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent(window.location.href));
      return;
    }

    // Se autenticado, buscar dados
    if (status === 'authenticated') {
      fetchPapers(page);
    }
  }, [status, page, router]);

  const fetchPapers = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/paper?page=${page}&limit=10`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao buscar trabalhos');
      }
      const data = await response.json();
      setPapers(data.papers || []);
      setPagination(data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      });

      // Marcar que o conteúdo está pronto para ser exibido
      setContentReady(true);
    } catch (error) {
      console.error('Erro ao carregar trabalhos:', error);
      setError(error.message || 'Ocorreu um erro ao carregar seus trabalhos');
      setContentReady(true);
    } finally {
      setLoading(false);
    }
  };

  // Handler para visualizar detalhes do paper
  const handleViewDetails = (paper) => {
    router.push(`/paper/${paper.id}`);
  };

  // Se estiver carregando (inicial ou durante fetch), mostrar loading spinner
  if (loading || status === 'loading' || !contentReady) {
    return (
      <>
        <LoadingSpinner message="Carregando seus trabalhos..." />
      </>
    );
  }

  // Se não autenticado (e não está carregando), mostrar conteúdo não autenticado
  if (status === 'unauthenticated') {
    return (
      <>
        <div className={styles.unauthenticatedContent}>
          <h2 className={styles.sectionTitle}>Submeta Seu Trabalho Científico</h2>
          <p className={styles.sectionDescription}>
            Junte-se à nossa plataforma para submeter seus trabalhos para revisão e publicação.
            Nossa plataforma oferece um processo de submissão simplificado e revisão especializada.
          </p>
          <div className={styles.authLinks}>
            <Button
              onClick={() => router.push('/login?callbackUrl=' + encodeURIComponent(window.location.href))}
              variant="primary"
              className={styles.authButton}
            >
              Entrar / Cadastrar
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Se chegamos aqui, o usuário está autenticado e os dados foram carregados
  return (
    <>
    <PageContainer>
      <HeaderContentTitle
        eventData={{eventLogoUrl, eventName}}
        onImageLoad={() => {}}
        subtitle="Meus Trabalhos Científicos"
        fallbackTitle="Sistema de Submissão de Trabalhos Científicos"
      />
      <div className={styles.content}>
        {searchParamsReceived && (
          <div className={styles.successMessage}>
            <FaFileAlt className={styles.successIcon} />
            <span>Seu trabalho foi {searchParamsReceived.label} com sucesso!</span>
          </div>
        )}

        {error && (
          <div className={styles.errorMessage}>
            <span>{error}</span>
          </div>
        )}

        <div className={styles.paperControls}>
          <div className={styles.welcomeSection}>
            <h2 className={styles.sectionTitle}>Gerenciamento de Trabalhos</h2>
            <p className={styles.sectionDescription}>
              Acompanhe o status de seus trabalhos submetidos e envie novos artigos.
            </p>
          </div>
          {!submissionPeriodClosed && (
            <div className={styles.newPaperButton}>
              <Button
                onClick={() => router.push('/paper/subscribe')}
                variant="primary"
                fullWidth={false}
              >
                Novo Trabalho
              </Button>
            </div>
          )}
        </div>

        <div className={styles.papersSection}>
          <h3 className={styles.subsectionTitle}>Seus Trabalhos</h3>

          {papers.length > 0 ? (
            <>
              <div className={styles.papersList}>
                {papers.map((paper) => (
                  <PaperCard
                    key={paper.id}
                    paper={paper}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>

              {/* Paginação */}
              {pagination.pages > 1 && (
                <div className={styles.pagination}>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/paper?page=${Math.max(1, pagination.page - 1)}`)}
                    disabled={pagination.page <= 1}
                    className={styles.paginationButton}
                  >
                    Anterior
                  </Button>

                  <span className={styles.paginationInfo}>
                    Página {pagination.page} de {pagination.pages}
                  </span>

                  <Button
                    variant="outline"
                    onClick={() => router.push(`/paper?page=${Math.min(pagination.pages, pagination.page + 1)}`)}
                    disabled={pagination.page >= pagination.pages}
                    className={styles.paginationButton}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <FaFileAlt className={styles.emptyStateIcon} />
              <p>Você ainda não enviou nenhum trabalho.</p>
              <Button
                onClick={() => router.push('/paper/subscribe')}
                variant="secondary"
                className={styles.emptyStateButton}
              >
                Enviar Meu Primeiro Trabalho
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
    </>
  );
}