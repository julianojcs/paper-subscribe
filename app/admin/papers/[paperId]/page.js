'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PageContainer from '../../../components/layout/PageContainer';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { FaUser, FaCalendarAlt, FaTags, FaEdit, FaTrash, FaArrowLeft, FaFileAlt } from 'react-icons/fa';
import styles from './paperDetails.module.css';
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
        <div className={styles.errorBox}>
          <p className={styles.errorText}>{error}</p>
          <Button variant="outline" onClick={() => router.push('/admin/papers')}>
            <FaArrowLeft className={styles.iconLeft} /> Voltar
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!paper) {
    return (
      <PageContainer>
        <div className={styles.notFound}>
          <h2>Trabalho não encontrado</h2>
          <Button variant="outline" onClick={() => router.push('/admin/papers')}>
            <FaArrowLeft /> Voltar
          </Button>
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
        subtitle={`${"Autor: " + user?.name || "Trabalhos Científicos"}`}
        fallbackTitle="Sistema de Submissão de Trabalhos Científicos"
        background="linear-gradient(135deg, rgba(var(--paper-success-rgb), 1) 0%, var(--paper-success-dark) 100%)"
      />
      <div className={styles.actionsHeader}>
        <Button variant="outline" onClick={() => router.back()}>
          <FaArrowLeft className={styles.iconLeft} /> Voltar
        </Button>
      </div>

      <div className={styles.paperContainer}>
        <section className={styles.headerSection}>
          <div className={styles.titleRow}>
            <h1 className={styles.paperTitle}>{title}</h1>
          </div>
          <div className={styles.subtitleRow}>
            <div className={styles.statusLabel}>
              Status: <StatusBadge status={paper.status} />
            </div>
            <div className={styles.dateInfo}>
              <FaCalendarAlt className={styles.iconLeft} />
              <span>Criado em {formatDate(createdAt)}</span>
              {updatedAt && (
                <span className={styles.updatedAt}>• Atualizado em {formatDate(updatedAt)}</span>
              )}
            </div>
          </div>
        </section>

        <section className={styles.mainSection}>
          <div className={styles.infoBlock}>
            <h3><FaUser className={styles.iconLeft} />Autores</h3>
            {authors && authors.length > 0 ? (
              <ul className={styles.authorsList}>
                {authors.map((author) => (
                  <li key={author.id}>
                    <div>
                      {author.name}
                      <div className={styles.authorInstit}>
                        {author.institution}{author.city ? ` - ${author.city}` : ''}
                      </div>
                      {author.isMainAuthor && <span className={styles.badge}>Autor Principal</span>}
                      {author.isPresenter && <span className={styles.badge}>Apresentador</span>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhum autor encontrado.</p>
            )}
          </div>

          <div className={styles.infoBlock}>
            <h3>Área Acadêmica</h3>
            {area ? <p>{area.name}</p> : <p>N/A</p>}
          </div>

          <div className={styles.infoBlock}>
            <h3>Tipo de Trabalho</h3>
            {paperType ? <p>{paperType.name}</p> : <p>N/A</p>}
          </div>

          <div className={styles.infoBlock}>
            <h3><FaTags className={styles.iconLeft} /> Palavras-Chave</h3>
            {keywords ? (
              <ul className={styles.keywordsList}>
                {keywords.split(",").map((keyword, index) => (
                  <li key={index} className={styles.keywordItem}>
                    {keyword}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhuma palavra-chave.</p>
            )}
          </div>

          <div className={styles.infoBlock}>
            <h3>Evento</h3>
            {event ? (
              <div className={styles.eventInfo}>
                <strong>{event.name}</strong>
                {event.organization && (
                  <p className={styles.orgName}>{event.organization.name}</p>
                )}
              </div>
            ) : (
              <p>Não vinculado a evento.</p>
            )}
          </div>

          <div className={styles.infoBlock}>
            <h3>Autor Principal</h3>
            {user ? (
              <p>
                {user.name}
              </p>
            ) : (
              <p>Sem dados do usuário principal.</p>
            )}
          </div>
        </section>

        {fieldValues && fieldValues.length > 0 && (
          <section className={styles.footerSection}>
            <h3>Informações Adicionais</h3>
            <ul className={styles.fieldValuesList}>
              {fieldValues.map((fv) => (
                <li key={fv.id}>
                  <strong>{fv.field?.label || `Campo ${fv.fieldId}`}: </strong>
                  <span>{fv.value}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className={styles.actionsArea}>
          <Button
            variant="outline"
            onClick={handleDelete}
            className={styles.deleteButton}
          >
            <FaTrash className={styles.iconLeft} /> Remover
          </Button>
          <Button
            variant="primary"
            onClick={() => router.push(`/admin/papers/${paperId}/edit`)}
          >
            <FaEdit className={styles.iconLeft} /> Editar
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}