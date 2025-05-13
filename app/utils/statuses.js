const statuses = [
  { status: 'DRAFT', statusPtBR: 'Rascunho' },
  { status: 'PENDING', statusPtBR: 'Submetido' },
  { status: 'UNDER_REVIEW', statusPtBR: 'Em Revisão' },
  { status: 'REVISION_REQUIRED', statusPtBR: 'Revisão Necessária' },
  { status: 'ACCEPTED', statusPtBR: 'Aceito' },
  { status: 'REJECTED', statusPtBR: 'Rejeitado' },
  { status: 'PUBLISHED', statusPtBR: 'Publicado' },
  { status: 'WITHDRAWN', statusPtBR: 'Retirado' }
];

const getStatuses = () => statuses.map(item => item.status);

const getStatusPtBR = (status) => statuses.find(item => item.status === status).statusPtBR

const statusExists = (status) => statuses.some(item => item.status === status);

export { statuses, getStatuses, getStatusPtBR, statusExists };