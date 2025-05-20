'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import { useDataContext } from '../../../context/DataContext';
import styles from './paper.module.css';
import { formatDate } from '../../utils/formatDate';
import {
  FaFileAlt, FaCalendarAlt, FaUsers, FaHistory,
  FaFileDownload, FaBuilding, FaTags, FaEdit, FaStethoscope,
  FaFilePdf, FaArrowLeft, FaCloudUploadAlt, FaTrashAlt,
  FaSuitcase
} from 'react-icons/fa';
import ExpandableDescription from '../../components/ui/ExpandableDescription';
import Tooltip from '../../components/ui/Tooltip';

const PaperDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dynamicFields, setDynamicFields] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { eventData } = useDataContext();
  const [isSubmissionClosed, setIsSubmissionClosed] = useState(false);

  useEffect(() => {
    const checkSubmissionPeriod = () => {
      let eventInfo = null;

      if (!eventData || !eventData.name) {
        try {
          const storedEventData = localStorage.getItem('event_data');
          if (storedEventData) {
            eventInfo = JSON.parse(storedEventData);
          }
        } catch (e) {
          console.error('Erro ao carregar dados do evento:', e);
        }
      } else {
        eventInfo = eventData;
      }

      if (!eventInfo) return false;

      const eventDetails = eventInfo.event || eventInfo;

      const closed = eventDetails.isSubmissionClosed ||
        eventDetails.isReviewPhase ||
        eventDetails.isEventFinished ||
        (eventDetails.submissionEndDate && new Date(eventDetails.submissionEndDate) < new Date());

      setIsSubmissionClosed(closed);
      return closed;
    };

    checkSubmissionPeriod();
  }, [eventData]);

  useEffect(() => {
    if (id) {
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

          if (data.paper && data.paper.fieldValues) {
            const textareaFields = data.paper.fieldValues.filter(
              fv => fv.field && fv.field.fieldType === 'TEXTAREA'
            );

            const nonAbstractFields = textareaFields.filter(
              fv => fv.field &&
              !(fv.field.label.toLowerCase().includes('resumo') ||
                fv.field.label.toLowerCase().includes('abstract'))
            );

            setDynamicFields(nonAbstractFields);

            const updatedPaper = {
              ...data.paper,
              fieldValues: data.paper.fieldValues.filter(
                fv => fv.field && fv.field.fieldType !== 'TEXTAREA'
              ),
              originalFieldValues: data.paper.fieldValues
            };

            setPaper(updatedPaper);
          } else {
            setPaper(data.paper);
          }

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
  }, [id]);

  const downloadPaper = () => {
    if (paper?.fileUrl) {
      window.open(paper.fileUrl, '_blank');
    }
  };

  const handleBack = () => {
    router.push('/paper');
  };

  const handleEdit = () => {
    if (isSubmissionClosed) {
      toast.error("O período de submissão está encerrado. Não é possível editar trabalhos.");
      return;
    }
    router.push(`/paper/${id}/edit`);
  };

  const handleWithdraw = async () => {
    if (isSubmissionClosed) {
      toast.error("O período de submissão está encerrado. Não é possível retirar trabalhos.");
      return;
    }

    const confirmed = window.confirm(
      'Tem certeza que deseja retirar este trabalho? Esta ação não pode ser desfeita.'
    );

    if (!confirmed) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/paper/${paper.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'WITHDRAWN',
          reason: 'Trabalho retirado pelo autor',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao retirar trabalho');
      }

      router.push('/paper?withdrawn=true');
    } catch (error) {
      console.error('Erro ao retirar trabalho:', error);
      alert(`Erro ao retirar trabalho: ${error.message}`);
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmissionClosed) {
      toast.error("O período de submissão está encerrado. Não é possível submeter trabalhos.");
      return;
    }

    if (!paper?.id) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/paper/${paper.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'PENDING',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao submeter trabalho');
      }

      router.push('/paper?submitted=true');
    } catch (error) {
      console.error('Erro ao submeter trabalho:', error);
      alert(`Erro ao submeter trabalho: ${error.message}`);
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return null;

    const statusMap = {
      'DRAFT': { label: 'Rascunho', className: styles.statusDraft },
      'PENDING': { label: 'Submetido', className: styles.statusPending },
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

  const formatAuthors = (authors) => {
    if (!authors || !Array.isArray(authors) || authors.length === 0) {
      return <span className={styles.noAuthors}>Nenhum autor registrado</span>;
    }

    const sortedAuthors = [...authors].sort((a, b) => a.authorOrder - b.authorOrder);

    return (
      <div className={styles.authorsGrid}>
        {sortedAuthors.map((author, index) => (
          <div key={author.id || index} className={styles.authorCard}>
            <div className={styles.authorNameContainer}>
              <Tooltip
                content={`${author.name}`}
                position="top"
                delay={300}
              >
                <span className={styles.authorName}>
                  {author.name}
                </span>
              </Tooltip>
              <div className={styles.authorStatus}>
                {(author.isMainAuthor || author.userId) &&
                  <Tooltip
                    multLine={true}
                    content={'Autor que submeteu o Trabalho.'}
                    position="top"
                    delay={300}
                  >
                    <div className={styles.authorMainBadge}><span className={styles.visibleBadgeText}>Principal</span></div>
                  </Tooltip>
                }
                {(author.isPresenter) &&
                  <Tooltip
                    multLine={true}
                    content={'Autor apresentador do Trabalho.'}
                    position="top"
                    delay={300}
                  >
                    <div className={styles.authorPresenterBadge}><span className={styles.visibleBadgeText}>Apresentador</span></div>
                  </Tooltip>
                }
              </div>
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

  const getAbstract = () => {
    if (!paper) return null;

    if (paper.fieldValues && Array.isArray(paper.fieldValues)) {
      const allTextareaFields = paper.originalFieldValues?.filter(
        fv => fv.field && fv.field.fieldType === 'TEXTAREA'
      ) || [];

      const abstractField = allTextareaFields.find(
        fv => fv.field &&
        (fv.field.label.toLowerCase().includes('resumo') ||
          fv.field.label.toLowerCase().includes('abstract'))
      );

      if (abstractField) {
        return (
          <section className={styles.dynamicFieldsSection}>
            <div className={styles.metaHeader}>
              <FaFileAlt className={styles.metaIcon} />
              <span className={styles.metaLabel}>{abstractField.field.label}</span>
            </div>
            <div className={styles.dynamicFieldsContent}>
              {abstractField.value.split('\n').map((paragraph, index) => (
                <p key={index} className={styles.dynamicFieldsParagraph}>
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        );
      }
    }

    if (paper.abstract) {
      return <p className={styles.abstractText}>{paper.abstract}</p>;
    }

    return <p className={styles.noAbstract}>Nenhum resumo disponível</p>;
  };

  const getDynamicFields = () => {
    if (!dynamicFields || dynamicFields.length === 0) return null;

    const dynamicFieldsReturn = dynamicFields.map(dynamicField => {
      return (
        <section key={dynamicField.id || dynamicField.fieldId} className={styles.dynamicFieldsSection}>
          <div className={styles.metaHeader}>
            <FaFileAlt className={styles.metaIcon} />
            <span className={styles.metaLabel}>{dynamicField.field.label}</span>
          </div>
          <div className={styles.dynamicFieldsContent}>
            <div className={styles.fieldValue}>{dynamicField.value}</div>
          </div>
        </section>
      );
    });
    return dynamicFieldsReturn;
  };

  if (loading) {
    return <div className={styles.loadingContainer}>
      <LoadingSpinner />
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
          <div className={styles.headerTopRow}>
            <Button
              variant="text"
              onClick={handleBack}
              className={styles.backButton}
            >
              <FaArrowLeft className={styles.backIcon} /> Voltar
            </Button>

            <div className={`${styles.statusContainer} ${styles.desktopDisplay}`}>
              {getStatusBadge(paper.status)}
            </div>
          </div>

          <h1 className={styles.paperTitle}>{paper.title}</h1>
        </header>

        <div className={styles.paperContent}>
          <section className={styles.eventAreaTypeSection}>
            <div className={styles.eventInfoRow}>
              <div className={styles.infoContainer}>
                <FaBuilding className={styles.metaIcon} />
                <span className={styles.eventLabel}>Evento:</span>
                <span className={styles.infoValue}>
                  {paper.event ? paper.event.name : 'Evento não informado'}
                </span>
                <div className={`${styles.statusContainer} ${styles.mobileDisplay}`}>
                  {getStatusBadge(paper.status)}
                </div>
              </div>
            </div>

            {paper.area && (
              <div className={styles.eventInfoRow}>
                <div className={styles.infoContainer}>
                  <FaStethoscope className={styles.metaIcon} />
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

            {paper.paperType && (
              <div className={styles.eventInfoRow}>
                <div className={styles.infoContainer}>
                  <FaSuitcase className={styles.metaIcon} />
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
          </section>

          <section className={styles.AuthorsSection}>
            <div className={`${styles.metaItem} ${styles.fullWidth}`}>
              <div className={styles.metaHeader}>
                <FaUsers className={styles.metaIcon} />
                <span className={styles.metaLabel}>Autores</span>
              </div>
              <div className={styles.metaContent}>
                {formatAuthors(paper.authors)}
              </div>
            </div>
          </section>

          {getAbstract()}

          {getDynamicFields()}

          <section className={styles.keywordsSection}>
            <div className={styles.metaHeader}>
              <FaTags className={styles.metaIcon} />
              <span className={styles.metaLabel}>Palavras-chave</span>
            </div>
            <div className={styles.keywordsTags}>
              {paper.keywords.split(',').map(keyword => (
                <span key={keyword.trim()} className={styles.keywordTag}>
                  {keyword.trim()}
                </span>
              ))}
            </div>
          </section>

          {paper.fileUrl && paper.fileName && paper.fileStoragePath && paper.fileSize && (
            <section className={styles.fileSection}>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>
                  <FaFilePdf className={styles.fileIcon} /> {paper.fileName || "arquivo.pdf"}
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
            </section>
          )}

          <section className={styles.DatesSection}>
            <div className={styles.metaItem}>
              <div className={styles.metaHeader}>
                <FaCalendarAlt className={styles.metaIcon} />
                <span className={styles.metaLabel}>Data de criação</span>
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
          </section>

          {paper.history && paper.history.length > 0 && (
            <section className={styles.historySection}>
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
            </section>
          )}

          <section className={styles.actionsSection}>
            <div className={styles.leftActions}>
              <Button
                variant="secondary"
                onClick={handleBack}
                className={styles.actionButton}
              >
                {submitting ? (
                  <>
                    <div className={styles.spinnerSmall}></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <FaArrowLeft className={styles.buttonIcon} /> Voltar
                  </>
                )}
              </Button>
            </div>

            <div className={styles.rightActions}>
              {!isSubmissionClosed && (
                <>
                  {paper.status !== 'SUBMITTED' && (
                    <Button
                      variant="pending"
                      onClick={handleSubmit}
                      className={styles.submitButton}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <div className={styles.spinnerSmall}></div>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <FaCloudUploadAlt className={styles.buttonIcon} /> Submeter
                        </>
                      )}
                    </Button>
                  )}
                  {paper.status !== 'WITHDRAWN' && (
                    <Button
                      variant="primary"
                      onClick={handleEdit}
                      className={styles.actionButton}
                    >
                      {submitting ? (
                        <>
                          <div className={styles.spinnerSmall}></div>
                          Processando...
                        </>
                      ) : (
                        <>
                          <FaEdit className={styles.buttonIcon} /> Editar
                        </>
                      )}
                    </Button>
                  )}
                  {paper.status !== 'WITHDRAWN' && (
                    <Button
                      variant="danger"
                      onClick={handleWithdraw}
                      className={styles.withdrawButton}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <div className={styles.spinnerSmall}></div>
                          Processando...
                        </>
                      ) : (
                        <>
                          <FaTrashAlt className={styles.buttonIcon} /> Retirar
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>
          </section>

          {isSubmissionClosed && (
            <div className={styles.submissionClosedMessage}>
              <p>O período de submissão, edição e remoção de trabalhos está encerrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaperDetailPage;