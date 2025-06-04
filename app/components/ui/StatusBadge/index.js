import styles from './StatusBadge.module.css';

const StatusBadge = ({ status }) => {
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

export default StatusBadge;