'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './paper.module.css';
import Button from '../components/ui/Button';
import { FaFileAlt, FaCalendarAlt, FaUsers, FaHistory } from 'react-icons/fa';

// Componente que usa searchParams
function PaperPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Verificar mensagem de sucesso
  const success = searchParams ? searchParams.get('success') : null;

  // Buscar submissões do usuário se estiver logado
  useEffect(() => {
    if (status === 'authenticated') {
      fetchpapers();
    }
  }, [status]);

  const fetchpapers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/paper');
      if (!response.ok) throw new Error('Falha ao buscar trabalhos');
      const data = await response.json();
      setPapers(data.papers || []);
    } catch (error) {
      console.error('Erro ao carregar trabalhos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Formatar data para exibição
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Status do paper com cor correspondente
  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'Em análise', className: styles.statusPending },
      'reviewing': { label: 'Em revisão', className: styles.statusReviewing },
      'accepted': { label: 'Aprovado', className: styles.statusAccepted },
      'rejected': { label: 'Recusado', className: styles.statusRejected },
      'published': { label: 'Publicado', className: styles.statusPublished }
    };

    const statusInfo = statusMap[status] || { label: 'Desconhecido', className: '' };

    return (
      <span className={`${styles.statusBadge} ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Meus Trabalhos Científicos</h1>
        </header>

        <div className={styles.content}>
          {success && (
            <div className={styles.successMessage}>
              <FaFileAlt className={styles.successIcon} />
              <span>Seu trabalho foi enviado com sucesso!</span>
            </div>
          )}

          {status === 'authenticated' ? (
            <>
              <div className={styles.paperControls}>
                <div className={styles.welcomeSection}>
                  <h2 className={styles.sectionTitle}>Gerenciamento de Trabalhos</h2>
                  <p className={styles.sectionDescription}>
                    Acompanhe o status de seus trabalhos submetidos e envie novos artigos.
                  </p>
                </div>
                <div className={styles.newPaperButton}>
                  <Button
                    onClick={() => router.push('/paper/subscribe')}
                    variant="primary"
                    fullWidth={false}
                  >
                    Novo Trabalho
                  </Button>
                </div>
              </div>

              <div className={styles.papersSection}>
                <h3 className={styles.subsectionTitle}>Seus Trabalhos</h3>

                {loading ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Carregando seus trabalhos...</p>
                  </div>
                ) : papers.length > 0 ? (
                  <div className={styles.papersList}>
                    {papers.map((paper) => (
                      <div key={paper.id}
                           className={styles.paperCard}
                          //  onClick={() => router.push(`/paper/${paper.id}`)}
                      >
                        <div className={styles.paperHeader}>
                          <h4 className={styles.cardTitle}>{paper.title}</h4>
                          {getStatusBadge(paper.status)}
                        </div>

                        <div className={styles.paperMeta}>
                          <div className={styles.metaItem}>
                            <FaCalendarAlt className={styles.metaIcon} />
                            <span className={styles.metaText}>
                              Enviado em {formatDate(paper.createdAt)}
                            </span>
                          </div>

                          <div className={styles.metaItem}>
                            <FaUsers className={styles.metaIcon} />
                            <span className={styles.metaText}>
                              {paper.authors || 'Sem autores informados'}
                            </span>
                          </div>

                          {paper.updatedAt && (
                            <div className={styles.metaItem}>
                              <FaHistory className={styles.metaIcon} />
                              <span className={styles.metaText}>
                                Atualizado em {formatDate(paper.updatedAt)}
                              </span>
                            </div>
                          )}
                        </div>

                        {paper.abstract && (
                          <p className={styles.paperAbstract}>
                            {paper.abstract.length > 150
                              ? `${paper.abstract.substring(0, 150)}...`
                              : paper.abstract}
                          </p>
                        )}

                        <div className={styles.cardActions}>
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/paper/${paper.id}`);
                            }}
                            className={styles.actionButton}
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
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
            </>
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
                  variant="primary"
                  className={styles.authButton}
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

// Componente principal com Suspense
export default function PaperPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Carregando...</div>}>
      <PaperPageContent />
    </Suspense>
  );
}