'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from './userPapers.module.css';
import Button from '../../../../../components/ui/Button';
import LoadingSpinner from '../../../../../components/ui/LoadingSpinner';
import PageContainer from '../../../../../components/layout/PageContainer';
import HeaderContentTitle from '../../../../../components/layout/HeaderContentTitle'
import PaperCard from '../../../../../components/ui/PaperCard';
import { FaArrowLeft, FaFileAlt, FaUserAlt } from 'react-icons/fa';
import { useToast } from '/context/ToastContext';
import { ToastType } from '../../../../../components/ui/Toast';

export default function UserPapersPage({ searchParams }) {
  const { userId } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  const [papers, setPapers] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const { addToast } = useToast();
  const page = parseInt(searchParams?.page || '1', 10);
    const SearchParamsActions = [
    { param: 'success', label: 'Sucesso' },
    { param: 'withdrawn', label: 'Retirado' }
  ];
  const searchParamsReceived = SearchParamsActions.find(action => {
    const paramValue = searchParams?.[action.param];
    return paramValue === 'true' || paramValue === 'false';
  })

  const eventLogoUrl = session?.user?.activeEventLogoUrl;
  const eventName = session?.user?.activeEventName;

  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);

      if (!response.ok) {
        throw new Error('Não foi possível carregar os dados do usuário');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      setError(error.message);
    }
  }, [userId]);

  const fetchUserPapers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/users/${userId}/papers?page=${page}&limit=10`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao buscar trabalhos');
      }

      const data = await response.json();
      setPapers(data.papers);
      setPagination(data.pagination || {
        page,
        limit: 10,
        total: data.papers.length,
        pages: 1
      });

      setContentReady(true);
    } catch (error) {
      console.error('Erro ao carregar trabalhos:', error);
      setError(error.message);
      setContentReady(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

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
      const isAuthorized = session.user?.role === 'ADMIN' || session.user?.role === 'MANAGER';
      if (!isAuthorized) {
        addToast('Você não tem permissão para acessar esta página', ToastType.ERROR);
        router.push('/');
        return;
      }

      fetchUserData();
      fetchUserPapers(1);
    }
  }, [status, page, router, fetchUserData, fetchUserPapers, addToast, session?.user?.role]);

  const handleBack = () => {
    router.push('/admin/organization/users');
  };

  // Handler para visualizar detalhes do paper
  const viewPaperDetails = (paperId) => {
    router.push(`/admin/papers/${paperId}`);
  };

  // Se estiver carregando (inicial ou durante fetch), mostrar loading spinner
  if (loading || status === 'loading' || !contentReady) {
    return <LoadingSpinner message="Carregando trabalhos do usuário..." />;
  }

  // Título da página
  const pageTitle = user ? `Trabalhos de ${user.name}` : "Trabalhos do Usuário";

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
        subtitle={`${"Autor: " + user?.name || "Trabalhos Científicos"}`}
        fallbackTitle="Sistema de Submissão de Trabalhos Científicos"
        background="linear-gradient(135deg, rgba(var(--paper-success-rgb), 1) 0%, var(--paper-success-dark) 100%)"
      />
      <div className={styles.content}>
        {searchParamsReceived && (
          <div className={styles.successMessage}>
            <FaFileAlt className={styles.successIcon} />
            <span>O trabalho foi {searchParamsReceived.label} com sucesso!</span>
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
            <Button
              variant="secondary"
              onClick={handleBack}
              className={styles.backButton}
            >
              <FaArrowLeft /> Voltar para lista de usuários
            </Button>
          </div>
          <p className={styles.sectionDescription}>
            Visualize os detalhes dos trabalhos submetidos por um usuário, faça edições, ou exclua trabalhos que não estão de acordo com as diretrizes.
          </p>
        </div>

        <div className={styles.authorSection}>
          <h3 className={styles.subsectionTitle}>
            <FaUserAlt className={styles.metaIcon}/>
            Autor Principal:
          </h3>
          <div className={styles.authorData}>
            <div className={styles.authorField}>
              <label>Nome:</label> <h4 className={styles.authorDataText}>{user?.name}</h4>
            </div>
            <div className={styles.authorField}>
              <label>Email:</label> <h4 className={styles.authorDataText}>{user?.email}</h4>
            </div>
            <div className={styles.authorField}>
              <label>Instituição:</label> <h4 className={styles.authorDataText}>{user?.institution}</h4>
            </div>
          </div>
        </div>

        <div className={styles.papersSection}>

          {console.log('Papers:', papers)}
          {console.log('userId:', userId)}

          {papers.length > 0 && (
            <>
              <div className={styles.papersList}>
                {papers.map((paper) => (
                  <PaperCard
                    key={paper.id}
                    paper={paper}
                    onViewDetails={() => viewPaperDetails(paper.id)}
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
          )}
        </div>
      </div>
    </PageContainer>
    </>
  );
}