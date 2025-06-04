export function formatDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);

  // Verifica se a data é válida
  if (isNaN(date.getTime())) {
    return '';
  }

  // Formata a data para o padrão brasileiro: DD/MM/YYYY às HH:MM
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date).replace(',', ' às');
}

export function formatShortDate(dateString) {
  if (!dateString) return 'Data não informada';

  const date = new Date(dateString);

  // Formata a data para o padrão brasileiro: DD/MM/YYYY
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
}