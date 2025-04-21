'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from './paper.module.css';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/formatDate';
import {
  FaFileAlt, FaCalendarAlt, FaUsers, FaHistory,
  FaFileDownload, FaBuilding, FaTag, FaEdit, FaMicroscope
} from 'react-icons/fa';
import ExpandableDescription from '../../components/ui/ExpandableDescription';

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
    if (!status) return null;

    const statusMap = {
      'DRAFT': { label: 'Rascunho', className: styles.statusDraft },
      'PENDING': { label: 'Pendente', className: styles.statusPending },
      'UNDER_REVIEW': { label: 'Em Revisão', className: styles.statusReviewing },
      'REVISION_REQUIRED': { label: 'Revisão Necessária', className: styles.statusRevision },
      'ACCEPTED': { label: 'Aprovado', className: styles.statusAccepted },
      'REJECTED': { label: 'Recusado', className: styles.statusRejected },
      'PUBLISHED': { label: 'Publicado', className: styles.statusPublished },
      'WITHDRAWN': { label: 'Retirado', className: styles.statusWithdrawn }
    };

    const normalizedStatus = status.toUpperCase();
    const statusInfo = statusMap[normalizedStatus] || {
      label: status,
      className: styles.statusUnknown
    };

    return (
      <span className={`${styles.statusBadge} ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  // Função para formatar lista de autores
  const formatAuthors = (authors) => {
    if (!authors || !Array.isArray(authors) || authors.length === 0) {
      return <span className={styles.noAuthors}>Nenhum autor registrado</span>;
    }

    // Ordenar autores por authorOrder
    const sortedAuthors = [...authors].sort((a, b) => a.authorOrder - b.authorOrder);

    return (
      <div className={styles.authorsGrid}>
        {sortedAuthors.map((author, index) => (
          <div key={author.id || index} className={styles.authorCard}>
            <div className={styles.authorName}>
              {author.name}
              {author.isMainAuthor &&
                <span className={styles.authorMainBadge}>Principal</span>}
              {author.isPresenter &&
                <span className={styles.authorPresenterBadge}>Apresentador</span>}
            </div>
            <div className={styles.authorInfo}>
              <div className={styles.authorInstitution}>{author.institution || 'Instituição não informada'}</div>
              <div className={styles.authorLocation}>
                {author.city} {author.stateId ? `- ${author.stateId}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Função para recuperar o valor de um campo dinâmico
  const getFieldValue = (fieldId) => {
    if (!paper || !paper.fieldValues || !Array.isArray(paper.fieldValues)) {
      return null;
    }

    const fieldValue = paper.fieldValues.find(fv => fv.fieldId === fieldId);
    return fieldValue ? fieldValue.value : null;
  };

  // Função para exibir o resumo do paper - pode estar em campos dinâmicos ou no abstract
  const getAbstract = () => {
    if (!paper) return null;

    // Tentar encontrar um campo TEXTAREA que geralmente é usado para resumos
    if (paper.fieldValues && Array.isArray(paper.fieldValues)) {
      const textareaFields = paper.fieldValues.filter(
        fv => fv.field && fv.field.fieldType === 'TEXTAREA'
      );

      // Se encontrarmos campos TEXTAREA, vamos buscar um que tenha "resumo" ou "abstract" no label
      const abstractField = textareaFields.find(
        fv => fv.field &&
        (fv.field.label.toLowerCase().includes('resumo') ||
         fv.field.label.toLowerCase().includes('abstract'))
      );

      if (abstractField) {
        return (
          <>
            {/* <h3 className={styles.fieldLabel}>{abstractField.field.label}</h3> */}
            <p className={styles.abstractText}>{abstractField.value}</p>
          </>
        );
      }

      // Se não encontrarmos um campo específico, mas houver campos textarea, mostrar todos
      if (textareaFields.length > 0) {
        return textareaFields.map(field => (
          <div key={field.id} className={styles.dynamicField}>
            <h3 className={styles.fieldLabel}>{field.field.label}</h3>
            <p className={styles.fieldValue}>{field.value}</p>
          </div>
        ));
      }
    }

    // Caso não encontremos campos dinâmicos, verificar se há um resumo direto
    if (paper.abstract) {
      return <p className={styles.abstractText}>{paper.abstract}</p>;
    }

    return <p className={styles.noAbstract}>Nenhum resumo disponível</p>;
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

  // Determinar se o trabalho pode ser editado
  const canEdit = false; // ['DRAFT', 'PENDING'].includes(paper.status);

  return (
    <div className={styles.container}>
      <div className={styles.paperDetail}>
        <header className={styles.paperHeader}>
          <div className={styles.headerTopRow}>
            <Button
              variant="text"
              onClick={handleBack}
              className={styles.backButton}
            >
              &larr; Voltar
            </Button>
            
            <div className={styles.statusContainer}>
              {getStatusBadge(paper.status)}
            </div>
          </div>

          <h1 className={styles.paperTitle}>{paper.title}</h1>
        </header>

        <div className={styles.paperContent}>
          {/* Evento e área temática */}
          <div className={styles.eventSection}>
            {/* Evento */}
            <div className={styles.eventInfoRow}>
              <div className={styles.infoContainer}>
                <FaBuilding className={styles.metaIcon} />
                <span className={styles.eventLabel}>Evento:</span>
                <span className={styles.infoValue}>
                  {paper.event ? paper.event.name : 'Evento não informado'}
                </span>
              </div>
            </div>

            {/* Área */}
            {paper.area && (
              <div className={styles.eventInfoRow}>
                <div className={styles.infoContainer}>
                  <FaMicroscope className={styles.metaIcon} />
                  <span className={styles.eventLabel}>Área:</span>
                  <div className={styles.typeName}>
                    {paper.area.name}
                  </div>
                </div>
                
                {paper.area.description && (
                  <div className={styles.descriptionContainer}>
                    <ExpandableDescription 
                      description={paper.area.description}
                      maxLength={100}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tipo de Paper */}
            {paper.paperType && (
              <div className={styles.eventInfoRow}>
                <div className={styles.infoContainer}>
                  <FaTag className={styles.metaIcon} />
                  <span className={styles.eventLabel}>Tipo:</span>
                  <div className={styles.typeName}>
                    {paper.paperType.name}
                  </div>
                </div>
                
                {paper.paperType.description && (
                  <div className={styles.descriptionContainer}>
                    <ExpandableDescription 
                      description={paper.paperType.description}
                      maxLength={100}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Autores */}
          <div className={styles.paperMeta}>
            <div className={`${styles.metaItem} ${styles.fullWidth}`}>
              <div className={styles.metaHeader}>
                <FaUsers className={styles.metaIcon} />
                <span className={styles.metaLabel}>Autores</span>
              </div>
              <div className={styles.metaContent}>
                {formatAuthors(paper.authors)}
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className={styles.metaDatesRow}>
            <div className={styles.metaItem}>
              <div className={styles.metaHeader}>
                <FaCalendarAlt className={styles.metaIcon} />
                <span className={styles.metaLabel}>Data de submissão</span>
              </div>
              <div className={styles.metaContent}>
                {formatDate(paper.createdAt)}
              </div>
            </div>

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

          {/* Palavras-chave */}
          <div className={styles.keywordsContainer}>
            <div className={styles.keywordsHeader}>
              <FaTag className={styles.metaIcon} />
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

          {/* Resumo */}
          <div className={styles.abstractSection}>
            <h2 className={styles.sectionTitle}>Resumo:</h2>
            <div className={styles.abstractContent}>
              {getAbstract()}
            </div>
          </div>

          {/* Campos dinâmicos adicionais */}
          {paper.fieldValues && paper.fieldValues.length > 0 && (
            <div className={styles.customFieldsSection}>
              <h2 className={styles.sectionTitle}>Informações Adicionais</h2>
              <div className={styles.fieldsGrid}>
                {paper.fieldValues
                  .filter(fv => fv.field && fv.field.fieldType !== 'TEXTAREA')
                  .map(fieldValue => (
                    <div key={fieldValue.id} className={styles.fieldItem}>
                      <div className={styles.fieldLabel}>{fieldValue.field.label}</div>
                      <div className={styles.fieldValue}>{fieldValue.value}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Arquivo */}
          {paper.fileUrl && (
            <div className={styles.fileSection}>
              <h2 className={styles.sectionTitle}>Arquivo</h2>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>
                  <FaFileAlt className={styles.fileIcon} /> {paper.fileName || "arquivo.pdf"}
                </span>
                {paper.fileSize && (
                  <span className={styles.fileSize}>
                    {(paper.fileSize / (1024 * 1024)).toFixed(2)} MB
                  </span>
                )}
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

          {/* Histórico */}
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
                    {item.comment && (
                      <div className={styles.historyComment}>
                        {item.comment}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className={styles.actionsSection}>
            <Button
              variant="secondary"
              onClick={handleBack}
              className={styles.actionButton}
            >
              Voltar para meus trabalhos
            </Button>

            {canEdit && (
              <Button
                variant="primary"
                onClick={() => router.push(`/paper/edit/${paper.id}`)}
                className={styles.actionButton}
              >
                <FaEdit className={styles.buttonIcon} /> Editar trabalho
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}