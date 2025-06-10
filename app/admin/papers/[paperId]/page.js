'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PageContainer from '../../../components/layout/PageContainer';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { FaUser, FaCalendarAlt, FaTags, FaEdit, FaTrash, FaArrowLeft, FaFileAlt } from 'react-icons/fa';
import styles from '../../../paper/paper.module.css';
import HeaderContentTitle from '../../../components/layout/HeaderContentTitle'
import { useToast } from '../../../../context/ToastContext';
import { ToastType } from '../../../components/ui/Toast';
import StatusBadge from '@/components/ui/StatusBadge';

export default function PaperAdminPage() {
  const { data: session, status } = useSession();
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { paperId } = useParams();
  const eventLogoUrl = session?.user?.activeEventLogoUrl;
  const eventName = session?.user?.activeEventName;
  const { addToast } = useToast();

  const loadPaper = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/paper/${paperId}?includeAll=true&adminAccess=true`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Falha ao carregar dados');
      }
      const data = await res.json();
      console.log("Paper data:", data);
      setPaper(data.paper);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [paperId]);

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
      // Carregar os detalhes do trabalho
      loadPaper();
    }
  }, [paperId, loadPaper, addToast, router, session, status]);


  async function handleDelete() {
    if (!confirm('Deseja remover este trabalho?')) return;
    try {
      const res = await fetch(`/api/paper/${paperId}?adminAccess=true`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Erro ao remover trabalho');
      }
      router.push('/admin/papers');
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Carregando detalhes do trabalho..." />;
  }

  if (error) {
    return (
      <PageContainer>
        <div className={styles.content}>
          <div className={styles.errorMessage}>
            <span>{error}</span>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin/organization/papers')}>
            <FaArrowLeft className={styles.iconLeft} /> Voltar
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!paper) {
    return (
      <PageContainer>
        <div className={styles.content}>
          <div className={styles.emptyState}>
            <FaFileAlt className={styles.emptyStateIcon} />
            <h2>Trabalho não encontrado</h2>
            <Button variant="outline" onClick={() => router.push('/admin/organization/papers')}>
              <FaArrowLeft /> Voltar
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }
console.log(paper);
  const {
    title,
    keywords,
    createdAt,
    updatedAt,
    userId,
    event,
    area,
    paperType,
    fieldValues
  } = paper;

  const authors = paper.authors.map(author => ({
    ...author,
    isMainAuthor: author.userId === userId ? true : false
  }));
  const user = authors.find(author => author.isMainAuthor) || null;

console.log("Authors", authors);
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <PageContainer>
      <HeaderContentTitle
        eventData={{eventLogoUrl, eventName}}
        onImageLoad={() => {}}
        subtitle={`Detalhes do Trabalho`}
        fallbackTitle="Sistema de Submissão de Trabalhos Científicos"
      />

      <div className={styles.content}>
        {/* Botão Voltar */}
        <div className={styles.paperControls}>
          <Button variant="outline" onClick={() => router.back()}>
            <FaArrowLeft className={styles.iconLeft} /> Voltar
          </Button>
        </div>

        {/* Título do Paper */}
        <div className={styles.welcomeSection}>
          <h1 className={styles.sectionTitle}>{title}</h1>
          <div className={styles.sectionDescription}>
            <StatusBadge status={paper.status} />
            <span style={{ marginLeft: '1rem', color: '#64748b' }}>
              <FaCalendarAlt style={{ marginRight: '0.5rem' }} />
              Criado em {formatDate(createdAt)}
              {updatedAt && ` • Atualizado em ${formatDate(updatedAt)}`}
            </span>
          </div>
        </div>

        {/* Informações do Paper */}
        <div className={styles.papersSection}>

          {/* Autores */}
          <div className={styles.paperEventRow}>
            <h3 className={styles.subsectionTitle}>
              <FaUser style={{ marginRight: '0.5rem' }} />
              Autores
            </h3>
          </div>
          {authors && authors.length > 0 ? (
            <div style={{ marginBottom: '2rem' }}>
              {authors.map((author, index) => (
                <div key={author.id} style={{
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontWeight: '600', color: '#334155' }}>
                    {author.name}
                    {author.isMainAuthor && (
                      <span style={{
                        marginLeft: '0.5rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        Autor Principal
                      </span>
                    )}
                    {author.isPresenter && (
                      <span style={{
                        marginLeft: '0.5rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        Apresentador
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {author.institution}{author.city ? ` - ${author.city}` : ''}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>Nenhum autor encontrado.</p>
          )}

          {/* Área Acadêmica */}
          <div className={styles.paperEventRow}>
            <h3 className={styles.subsectionTitle}>Área Acadêmica</h3>
          </div>
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            {area ? <p style={{ margin: 0, color: '#334155' }}>{area.name}</p> : <p style={{ margin: 0, color: '#64748b' }}>N/A</p>}
          </div>

          {/* Tipo de Trabalho */}
          <div className={styles.paperEventRow}>
            <h3 className={styles.subsectionTitle}>Tipo de Trabalho</h3>
          </div>
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            {paperType ? <p style={{ margin: 0, color: '#334155' }}>{paperType.name}</p> : <p style={{ margin: 0, color: '#64748b' }}>N/A</p>}
          </div>

          {/* Palavras-chave */}
          <div className={styles.paperEventRow}>
            <h3 className={styles.subsectionTitle}>
              <FaTags style={{ marginRight: '0.5rem' }} />
              Palavras-Chave
            </h3>
          </div>
          <div style={{ marginBottom: '2rem' }}>
            {keywords ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {keywords.split(",").map((keyword, index) => (
                  <span key={index} style={{
                    backgroundColor: '#e2e8f0',
                    color: '#475569',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.875rem'
                  }}>
                    {keyword.trim()}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748b' }}>Nenhuma palavra-chave.</p>
            )}
          </div>

          {/* Evento */}
          <div className={styles.paperEventRow}>
            <h3 className={styles.subsectionTitle}>Evento</h3>
          </div>
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            {event ? (
              <div>
                <div style={{ fontWeight: '600', color: '#334155' }}>{event.name}</div>
                {event.organization && (
                  <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {event.organization.name}
                  </div>
                )}
              </div>
            ) : (
              <p style={{ margin: 0, color: '#64748b' }}>Não vinculado a evento.</p>
            )}
          </div>

          {/* Informações Adicionais */}
          {fieldValues && fieldValues.length > 0 && (
            <>
              <div className={styles.paperEventRow}>
                <h3 className={styles.subsectionTitle}>Informações Adicionais</h3>
              </div>
              <div style={{ marginBottom: '2rem' }}>
                {fieldValues.map((fv) => (
                  <div key={fv.id} style={{
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                      {fv.field?.label || `Campo ${fv.fieldId}`}
                    </div>
                    <div style={{ color: '#64748b', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                      {fv.value}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Ações */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            <Button
              variant="outline"
              onClick={handleDelete}
              style={{ color: '#dc2626', borderColor: '#dc2626' }}
            >
              <FaTrash style={{ marginRight: '0.5rem' }} />
              Remover
            </Button>
            <Button
              variant="primary"
              onClick={() => router.push(`/admin/papers/${paperId}/edit`)}
            >
              <FaEdit style={{ marginRight: '0.5rem' }} />
              Editar
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}