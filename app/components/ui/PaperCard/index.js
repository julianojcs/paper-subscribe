'use client';

import { FaBuilding, FaCalendarAlt, FaUsers, FaStethoscope, FaSuitcase, FaDownload } from 'react-icons/fa';
import Button from '../../ui/Button';
import Tooltip from '../../ui/Tooltip';
import StatusBadge from '../../ui/StatusBadge';
import { formatShortDate } from '../../../utils/formatDate';
import styles from './PaperCard.module.css';

export default function PaperCard({
  paper,
  onViewDetails,
  actionButtonLabel = "Ver Detalhes",
  showAbstract = true,
  className = "",
  getAuthorsDisplay,
  getAuthorsTooltip,
  secondaryAction = null,
}) {
  // Obter o resumo do paper (abstract) dos campos dinâmicos ou do campo direto
  const abstract = paper.abstract || getFieldValue?.(paper, 'TEXTAREA') || '';

  const defaultGetAuthorsDisplay = (authors) => {
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

  const defaultGetAuthorsTooltip = (authors) => {
    if (!authors || authors.length === 0) return ['Sem autores'];

    const sortedAuthors = [...authors].sort((a, b) => a.authorOrder - b.authorOrder);

    return sortedAuthors.map(author => {
      const roles = [];
      if (author.isMainAuthor) roles.push('Autor Principal');
      if (author.isPresenter) roles.push('Apresentador');

      const roleText = roles.length > 0 ? ` (${roles.join(', ')})` : '';
      return `${author.name}${roleText} - ${author.institution}`;
    });
  };

  // Usar as funções fornecidas ou as funções padrão
  const displayAuthors = getAuthorsDisplay || defaultGetAuthorsDisplay;
  const tooltipAuthors = getAuthorsTooltip || defaultGetAuthorsTooltip;

  return (
    <div className={`${styles.paperCard} ${className}`}>
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
        <StatusBadge status={paper.status} />
      </div>

      <div className={styles.paperMeta}>
        <div className={styles.metaItem}>
          <FaCalendarAlt className={styles.metaIcon} />
          <span className={styles.metaText}>
            {formatShortDate(paper.createdAt)}
          </span>
        </div>

        <div className={styles.metaItem}>
          <FaUsers className={styles.metaIcon} />
          <Tooltip
            content={tooltipAuthors(paper.authors)}
            multLine={true}
            position="top"
            delay={300}
            arrow={true}
            multiline={true}
          >
            <span className={styles.metaText}>
              {displayAuthors(paper.authors)}
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

      {paper.keywords && (
        <div className={styles.keywordsContainer}>
          {paper.keywords.split(',').map((keyword, index) => (
            <span key={index} className={styles.keywordTag}>
              {keyword.trim()}
            </span>
          ))}
        </div>
      )}

      {showAbstract && abstract && (
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
            onViewDetails?.(paper);
          }}
          className={styles.actionButton}
        >
          {actionButtonLabel}
        </Button>

        {secondaryAction}

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
}

// Função auxiliar para obter valores de campos dinâmicos
export const getFieldValue = (paper, fieldType) => {
  if (!paper.fieldValues || paper.fieldValues.length === 0) return '';

  // Procurar por campos com o tipo desejado
  const field = paper.fieldValues.find(
    fv => fv.field && fv.field.fieldType.toUpperCase() === fieldType
  );

  return field ? field.value : '';
};