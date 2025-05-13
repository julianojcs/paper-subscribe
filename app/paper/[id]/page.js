'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from './paper.module.css';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/formatDate';
import {
  FaFileAlt, FaCalendarAlt, FaUsers, FaHistory,
  FaFileDownload, FaBuilding, FaTags, FaEdit, FaStethoscope,
  FaFilePdf, FaArrowLeft, FaCloudUploadAlt, FaTrashAlt,
  FaSuitcase
} from 'react-icons/fa';
import ExpandableDescription from '../../components/ui/ExpandableDescription';
import Tooltip from '../../components/ui/Tooltip';

export default function PaperDetailPage() {
  // Obter params diretamente - não é necessário use()
  const params = useParams();
  const id = params.id; // Acesso direto é permitido

  const router = useRouter();
  const { data: session, status } = useSession();
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dynamicFields, setDynamicFields] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

          // Processar os campos dinâmicos aqui
          if (data.paper && data.paper.fieldValues) {
            const textareaFields = data.paper.fieldValues.filter(
              fv => fv.field && fv.field.fieldType === 'TEXTAREA'
            );

            // Filtrar os campos TEXTAREA que não são resumos
            const nonAbstractFields = textareaFields.filter(
              fv => fv.field &&
              !(fv.field.label.toLowerCase().includes('resumo') ||
               fv.field.label.toLowerCase().includes('abstract'))
            );

            // Definir os campos dinâmicos
            setDynamicFields(nonAbstractFields);

            // Atualizar o paper com fields values sem TEXTAREA
            const updatedPaper = {
              ...data.paper,
              fieldValues: data.paper.fieldValues.filter(
                fv => fv.field && fv.field.fieldType !== 'TEXTAREA'
              ),
              originalFieldValues: data.paper.fieldValues // Adicionar os valores originais
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

  // Função para submeter o trabalho
  const handleSubmitPaper = async () => {
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

      // Redirecionar para a página de trabalhos
      router.push('/paper?submitted=true'); // Parâmetro para mostrar mensagem de sucesso
    } catch (error) {
      console.error('Erro ao submeter trabalho:', error);
      alert(`Erro ao submeter trabalho: ${error.message}`); // Feedback simples
      setSubmitting(false);
    }
  };

  // Função para retirar o trabalho
  const handleWithdrawPaper = async () => {
    if (!paper?.id) return;

    // Confirmação antes de prosseguir
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

      // Redirecionar para a página de trabalhos
      router.push('/paper?withdrawn=true');
    } catch (error) {
      console.error('Erro ao retirar trabalho:', error);
      alert(`Erro ao retirar trabalho: ${error.message}`);
      setSubmitting(false);
    }
  };

  // Definição do status com cores
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
                    <div className={styles.authorMainBadge}><span className={styles.visibleBadgeText}>Pricipal</span></div>
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
      // Não filtrar os fieldValues aqui, isso já foi feito no useEffect

      // Procurar campos de abstract entre os textareaFields que já estão em dynamicFields
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

    // Caso não encontremos campos dinâmicos, verificar se há um resumo direto
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
  const canEdit = ['DRAFT'].includes(paper.status);
  // const canEdit = false; // ['DRAFT', 'PENDING'].includes(paper.status);

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
          {/* Evento e área temática */}
          <section className={styles.eventAreaTypeSection}>
            {/* Evento */}
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

            {/* Área */}
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

            {/* Tipo de Paper */}
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

          {/* Autores */}
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

          {/* Resumo */}
          {getAbstract()}

          {/* Campos dinâmicos */}
          {getDynamicFields()}

          {/* Palavras-chave */}
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

          {/* Arquivo */}
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

          {/* Datas */}
          <section className={styles.DatesSection}>
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
          </section>

          {/* Histórico */}
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

          {/* Botões de ação */}
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
              {canEdit && (
                <Button
                  variant="primary"
                  onClick={() => router.push(`/paper/edit/${paper.id}`)}
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

              {/* Botão para retirar o trabalho  */}
              {paper.status !== 'WITHDRAWN' && (
                <Button
                  variant="danger"
                  onClick={handleWithdrawPaper}
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

              {paper.status === 'DRAFT' && (
                <Button
                  variant="pending"
                  onClick={handleSubmitPaper}
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
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}