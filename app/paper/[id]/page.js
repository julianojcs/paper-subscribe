'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from './paper.module.css';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/formatDate';
import { FaFileAlt, FaCalendarAlt, FaUsers, FaHistory, FaFileDownload } from 'react-icons/fa';

export default function PaperDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { data: session, status } = useSession();
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'authenticated' && id) {
      setLoading(true);
      console.log(`Carregando paper ID: ${id}`);
      fetch(`/api/paper/${id}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(response.status === 404
              ? 'Trabalho não encontrado'
              : 'Erro ao buscar trabalho');
          }
          return response.json();
        })
        .then(data => {
          console.log('Dados recebidos:', data);
          setPaper(data.paper);
          setError(null);
        })
        .catch(err => {
          console.error('Erro ao carregar paper:', err);
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, status]);

  // Função para baixar o arquivo
  const downloadPaper = () => {
    if (paper?.fileUrl) {
      window.open(paper.fileUrl, '_blank');
    }
  };

  // Função para voltar à lista de papers
  const handleBack = () => {
    router.push('/paper');
  };

  // Definição do status com cores
  const getStatusBadge = (status) => {
    let className;
    switch(status?.toLowerCase()) {
      case 'pending':
        className = styles.statusPending;
        break;
      case 'reviewing':
        className = styles.statusReviewing;
        break;
      case 'accepted':
        className = styles.statusAccepted;
        break;
      case 'rejected':
        className = styles.statusRejected;
        break;
      case 'published':
        className = styles.statusPublished;
        break;
      case 'draft':
        className = styles.statusDraft;
        break;
      default:
        className = styles.statusUnknown;
    }
    return <span className={`${styles.statusBadge} ${className}`}>{status || 'Desconhecido'}</span>;
  };

  if (status === 'loading') {
    return <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner}></div>
      <p>Carregando...</p>
    </div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className={styles.container}>
        <div className={styles.authRequired}>
          <FaFileAlt className={styles.authIcon} />
          <h2>Acesso Restrito</h2>
          <p>Por favor, faça login para visualizar este trabalho.</p>
          <Button
            variant="primary"
            onClick={() => router.push('/login')}
          >
            Entrar / Cadastrar
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner}></div>
      <p>Carregando detalhes do trabalho...</p>
    </div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2>Erro</h2>
          <p>{error}</p>
          <Button
            variant="secondary"
            onClick={handleBack}
          >
            Voltar para meus trabalhos
          </Button>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <FaFileAlt className={styles.notFoundIcon} />
          <h2>Trabalho não encontrado</h2>
          <p>O trabalho solicitado não foi encontrado ou não está disponível.</p>
          <Button
            variant="secondary"
            onClick={handleBack}
          >
            Voltar para meus trabalhos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.paperDetail}>
        <header className={styles.paperHeader}>
          <Button
            variant="text"
            onClick={handleBack}
            className={styles.backButton}
          >
            &larr; Voltar
          </Button>

          <h1 className={styles.paperTitle}>{paper.title}</h1>

          <div className={styles.statusContainer}>
            {getStatusBadge(paper.status)}
          </div>
        </header>

        <div className={styles.paperContent}>
          <div className={styles.paperMeta}>
            <div className={styles.metaGrid}>
              {/* Autores */}
              <div className={styles.metaItem}>
                <div className={styles.metaHeader}>
                  <FaUsers className={styles.metaIcon} />
                  <span className={styles.metaLabel}>Autores</span>
                </div>
                <div className={styles.metaContent}>
                  {paper.authors}
                </div>
              </div>

              {/* Data de submissão */}
              <div className={styles.metaItem}>
                <div className={styles.metaHeader}>
                  <FaCalendarAlt className={styles.metaIcon} />
                  <span className={styles.metaLabel}>Data de submissão</span>
                </div>
                <div className={styles.metaContent}>
                  {formatDate(paper.createdAt)}
                </div>
              </div>

              {/* Última atualização - só mostra se diferente da criação */}
              {paper.updatedAt && paper.updatedAt !== paper.createdAt && (
                <div className={styles.metaItem}>
                  <div className={styles.metaHeader}>
                    <FaHistory className={styles.metaIcon} />
                    <span className={styles.metaLabel}>Última atualização</span>
                  </div>
                  <div className={styles.metaContent}>
                    {formatDate(paper.updatedAt)}
                  </div>
                </div>
              )}
            </div>

            {/* Palavras-chave em uma linha separada para ter mais espaço */}
            <div className={styles.keywordsContainer}>
              <div className={styles.keywordsHeader}>
                <FaFileAlt className={styles.metaIcon} />
                <span className={styles.metaLabel}>Palavras-chave</span>
              </div>
              <div className={styles.keywordsTags}>
                {paper.keywords.split(',').map(keyword => (
                  <span key={keyword.trim()} className={styles.keywordTag}>
                    {keyword.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.abstractSection}>
            <h2 className={styles.sectionTitle}>Resumo</h2>
            <div className={styles.abstractContent}>
              <p>{paper.abstract}</p>
            </div>
          </div>

          {paper.fileUrl && (
            <div className={styles.fileSection}>
              <h2 className={styles.sectionTitle}>Arquivo</h2>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>
                  <FaFileAlt className={styles.fileIcon} /> {paper.fileName}
                </span>
                <span className={styles.fileSize}>
                  {(paper.fileSize / 1024 / 1024).toFixed(2)} MB
                </span>
                <Button
                  variant="primary"
                  onClick={downloadPaper}
                  className={styles.downloadButton}
                >
                  <FaFileDownload className={styles.downloadIcon} /> Baixar arquivo
                </Button>
              </div>
            </div>
          )}

          {paper.history && paper.history.length > 0 && (
            <div className={styles.historySection}>
              <h2 className={styles.sectionTitle}>Histórico</h2>
              <div className={styles.historyTimeline}>
                {paper.history.map((item) => (
                  <div key={item.id} className={styles.historyItem}>
                    <div className={styles.historyDate}>
                      {formatDate(item.createdAt)}
                    </div>
                    <div className={styles.historyStatus}>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className={styles.historyComment}>
                      {item.comment}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.actionsSection}>
            <Button
              variant="secondary"
              onClick={handleBack}
              className={styles.actionButton}
            >
              Voltar para meus trabalhos
            </Button>

            {/* Apenas mostrar botão de edição se o trabalho ainda estiver em rascunho ou pendente */}
            {['draft', 'pending'].includes(paper.status?.toLowerCase()) && (
              <Button
                variant="primary"
                onClick={() => router.push(`/paper/edit/${paper.id}`)}
                className={styles.actionButton}
              >
                Editar trabalho
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}