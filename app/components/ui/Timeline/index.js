'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FaCalendarAlt, FaExclamationCircle } from 'react-icons/fa';
import { useDataContext } from '/context/DataContext';
import styles from './Timeline.module.css';

/**
 * Componente de Cronograma usando exclusivamente o modelo EventTimeline
 * @param {Object} props - Propriedades do componente
 * @param {Array} props.timelineItems - Lista de itens da timeline do banco de dados
 * @param {string} props.className - Classe CSS adicional
 * @param {boolean} props.useContext - Se deve usar dados do contexto quando timelineItems não for fornecido
 */
const Timeline = ({
  timelineItems: providedTimelineItems,
  className = '',
  useContext = false
}) => {
  // Obter dados do contexto se necessário
  const { timelineItems: contextItems } = useDataContext();

  const now = useMemo(() => new Date(), []);

  // Usar itens fornecidos como prop ou do contexto
  const sourceItems = useMemo(() => {
    return providedTimelineItems || (useContext ? contextItems : []);
  }, [providedTimelineItems, contextItems, useContext]);

  // Processar os itens de timeline fornecidos pelo banco de dados
  const timelineItems = useMemo(() => {
    // Se não temos itens, retornar array vazio
    if (!sourceItems || sourceItems.length === 0) {
      return [];
    }

    // Mapear os itens do banco de dados para o formato usado pelo componente
    return sourceItems.map(item => ({
      id: item.id,
      date: item.date,
      label: item.name, // Usar o nome do banco como label
      description: item.description || '',
      isPast: item.isCompleted || new Date(item.date) < now,
      type: item.type,
      sortOrder: item.sortOrder || 0,
      isPublic: item.isPublic
    }));
  }, [sourceItems, now]);

  // Se não houver itens da timeline ou nenhum for público, não renderiza nada
  if (!timelineItems.length) {
    return null;
  }

  // Mostrar apenas os itens públicos
  const publicItems = timelineItems.filter(item => item.isPublic !== false);

  if (publicItems.length === 0) {
    return null;
  }

  // Ordenar por sortOrder e depois por data
  const sortedItems = [...publicItems].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return new Date(a.date) - new Date(b.date);
  });

  // Encontrar o próximo evento na timeline (não passado)
  const nextMilestone = sortedItems.find(item => !item.isPast);

  const formatEventDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dateString;
    }
  };

  // Calcular dias restantes para o próximo marco
  const daysRemaining = nextMilestone
    ? Math.ceil((new Date(nextMilestone.date) - now) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className={`${styles.timelineSection} ${className}`}>
      <h3 className={styles.timelineTitle}>
        <FaCalendarAlt className={styles.iconTitle} /> Cronograma
      </h3>

      {nextMilestone && daysRemaining > 0 && (
        <div className={styles.nextMilestoneBox}>
          <FaExclamationCircle className={styles.alertIcon} />
          <div className={styles.nextMilestoneContent}>
            <span>{nextMilestone.label}</span>
            <span className={styles.daysRemaining}>
              {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'} restantes
            </span>
            <span className={styles.milestoneDate}>
              {formatEventDate(nextMilestone.date)}
            </span>
          </div>
        </div>
      )}

      <div className={styles.timeline}>
        {sortedItems.map((item) => (
          <div
            key={item.id}
            className={`${styles.timelineItem} ${item.isPast ? styles.past : styles.future}`}
          >
            <div className={`${styles.timelineMarker} ${item.isPast ? styles.markerPast : styles.markerFuture}`}></div>
            <div className={styles.timelineContent}>
              <div className={styles.timelineDate}>{formatEventDate(item.date)}</div>
              <div className={styles.timelineLabel}>
                {item.label}
                {!item.isPast && nextMilestone && item.id === nextMilestone.id &&
                  <span className={`${styles.statusIndicator} ${styles.highlight}`}>próximo</span>}
              </div>
              {item.description && (
                <div className={styles.timelineDescription}>{item.description}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;