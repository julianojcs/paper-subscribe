'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import styles from './paper.module.css';
import Button from '../components/ui/Button';
import { FaFileAlt, FaCalendarAlt, FaUsers, FaBuilding, FaDownload, FaStethoscope, FaSuitcase } from 'react-icons/fa';
import Tooltip from '../components/ui/Tooltip';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PageContainer from '../components/layout/PageContainer';
import HeaderContentTitle from '../components/layout/HeaderContentTitle';

export default function PaperPage({ searchParams }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const params = searchParams ? React.use(searchParams) : {};

  const success = params.success;
  const page = parseInt(params.page || '1');

  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true); // Iniciar como true para mostrar loading imediatamente
  const [error, setError] = useState('');
  const [contentReady, setContentReady] = useState(false); // Novo estado para controlar quando o conteúdo está pronto
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const eventLogoUrl = session?.user?.activeEventLogoUrl;
  const eventName = session?.user?.activeEventName;
console.log('session', session);
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
      setContentReady(true); // Mesmo com erro, o conteúdo está "pronto" (mostraremos mensagem de erro)
    } finally {
      setLoading(false);
    }
  };

  // Formatar data para exibição
  const formatDate = (dateString) => {
    if (!dateString) return 'Data não informada';
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
      'DRAFT': { label: 'Rascunho', className: styles.statusDraft },
      'PENDING': { label: 'Submetido', className: styles.statusPending },
      'UNDER_REVIEW': { label: 'Em revisão', className: styles.underReview },
      'REVISION_REQUIRED': { label: 'Revisão Necessária', className: styles.statusRevisionRequired },
      'ACCEPTED': { label: 'Aprovado', className: styles.statusAccepted },
      'REJECTED': { label: 'Recusado', className: styles.statusRejected },
      'PUBLISHED': { label: 'Publicado', className: styles.statusPublished },
      'WITHDRAWN': { label: 'Retirado', className: styles.statusWithdrawn },
    };

    const statusInfo = statusMap[status] || { label: 'Desconhecido', className: '' };

    return (
      <span className={`${styles.statusBadge} ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  // Extrair nomes dos autores para exibição
  const getAuthorsDisplay = (authors) => {
    if (!authors || authors.length === 0) return 'Sem autores';

    // Ordenar os autores por authorOrder
    const sortedAuthors = [...authors].sort((a, b) => a.authorOrder - b.authorOrder);

    // Pegar os nomes dos autores
    const authorNames = sortedAuthors.map(author => author.name);

    // Se houver mais de 3 autores, mostre os 2 primeiros e "et al."
    if (authorNames.length > 3) {
      return `${authorNames[0]}, ${authorNames[1]} et al.`;
    }

    return authorNames.join(', ');
  };

  // Obter uma descrição detalhada dos autores para o tooltip
  const getAuthorsTooltip = (authors) => {
    if (!authors || authors.length === 0) return ['Sem autores'];

    const sortedAuthors = [...authors].sort((a, b) => a.authorOrder - b.authorOrder);

    // Refatorado para retornar diretamente o array resultante do map
    return sortedAuthors.map(author => {
      const roles = [];
      if (author.isMainAuthor) roles.push('Autor Principal');
      if (author.isPresenter) roles.push('Apresentador');

      const roleText = roles.length > 0 ? ` (${roles.join(', ')})` : '';
      return `${author.name}${roleText} - ${author.institution}`;
    });
  };

  // Obter campos dinâmicos específicos, como resumo
  const getFieldValue = (paper, fieldType) => {
    if (!paper.fieldValues || paper.fieldValues.length === 0) return '';

    // Procurar por campos com o tipo desejado
    const field = paper.fieldValues.find(
      fv => fv.field && fv.field.fieldType.toUpperCase() === fieldType
    );

    return field ? field.value : '';
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
        {success && (
          <div className={styles.successMessage}>
            <FaFileAlt className={styles.successIcon} />
            <span>Seu trabalho foi enviado com sucesso!</span>
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

          {papers.length > 0 ? (
            <>
              <div className={styles.papersList}>
                {papers.map((paper) => {
                  // Obter o resumo do paper (abstract) dos campos dinâmicos ou do campo direto
                  const abstract = paper.abstract || getFieldValue(paper, 'TEXTAREA');

                  return (
                    <div key={paper.id} className={styles.paperCard}>
                      <div className={styles.paperHeader}>
                        <h4 className={styles.cardTitle}>{paper.title}</h4>
                      </div>

                      <div className={styles.paperEventRow}>
                        <div className={styles.paperEvent}>
                          <FaBuilding className={styles.metaIcon} />
                          <span className={styles.eventName}>
                            {paper.event ? paper.event.name : 'Evento não especificado'}
                          </span>
                        </div>
                        {getStatusBadge(paper.status)}
                      </div>

                      <div className={styles.paperMeta}>
                        <div className={styles.metaItem}>
                          <FaCalendarAlt className={styles.metaIcon} />
                          <span className={styles.metaText}>
                            {formatDate(paper.createdAt)}
                          </span>
                        </div>

                        <div className={styles.metaItem}>
                          <FaUsers className={styles.metaIcon} />
                          <Tooltip
                            content={getAuthorsTooltip(paper.authors)}
                            multLine={true}
                            position="top"
                            delay={300}
                            arrow={true}
                            multiline={true}
                          >
                            <span className={styles.metaText}>
                              {getAuthorsDisplay(paper.authors)}
                            </span>
                          </Tooltip>
                        </div>

                        {paper.area && (
                          <div className={styles.metaItem}>
                            <FaStethoscope className={styles.metaIcon} />
                            <Tooltip
                              content={paper.area.description || 'Área temática'}
                              position="top"
                              delay={300}
                              arrow={true}
                            >
                              <span className={styles.metaText}>
                                {paper.area.name}
                              </span>
                            </Tooltip>
                          </div>
                        )}

                        {paper.paperType && (
                          <div className={styles.metaItem}>
                            <FaSuitcase className={styles.metaIcon} />
                            <Tooltip
                              content={paper.paperType.description || ''}
                              position="top"
                              delay={300}
                              arrow={true}
                            >
                              <span className={styles.metaText}>
                                {paper.paperType.name}
                              </span>
                            </Tooltip>
                          </div>
                        )}
                      </div>

                      <div className={styles.keywordsContainer}>
                        {paper.keywords.split(',').map((keyword, index) => (
                          <span key={index} className={styles.keywordTag}>
                            {keyword.trim()}
                          </span>
                        ))}
                      </div>

                      {abstract && (
                        <p className={styles.paperAbstract}>
                          {abstract.length > 150
                            ? `${abstract.substring(0, 150)}...`
                            : abstract}
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

                        {paper.fileUrl && (
                          <a
                            href={paper.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.downloadLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FaDownload className={styles.downloadIcon} />
                            Baixar PDF
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
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