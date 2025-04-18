'use client';

import { useUserEventDetails } from '../../../hooks/useUserEvents';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '/app/utils/formatDate';

export default function EventDetailPage() {
  const params = useParams();
  const { event, isLoading, error } = useUserEventDetails(params.id);
  
  if (isLoading) return <div className="loading-spinner">Carregando detalhes do evento...</div>;
  if (error) return <div className="error-message">Erro: {error.message}</div>;
  if (!event) return <div className="not-found">Evento não encontrado</div>;
  
  return (
    <div className="event-detail-container">
      <div className="event-header">
        {event.organization?.logoUrl && (
          <div className="organization-logo">
            <Image
              src={event.organization.logoUrl}
              alt={event.organization.name}
              width={80}
              height={80}
            />
          </div>
        )}
        
        <div className="event-title">
          <h1>{event.name}</h1>
          <p className="event-org">{event.organization?.name}</p>
          <div className="event-meta">
            <span className="user-role">Seu papel: {getUserRoleLabel(event.userRole)}</span>
            <span className="submission-count">Trabalhos enviados: {event.userSubmissions}</span>
          </div>
        </div>
        
        <div className="status-container">
          <StatusBadge status={event.submissionStatus} daysRemaining={event.daysRemaining} />
        </div>
      </div>
      
      <div className="event-description">
        <h2>Sobre o evento</h2>
        <p>{event.description || 'Sem descrição disponível'}</p>
      </div>
      
      <div className="event-details-grid">
        <div className="event-dates-card">
          <h3>Datas importantes</h3>
          <div className="date-item">
            <span>Evento:</span>
            <span>{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
          </div>
          <div className="date-item">
            <span>Submissões:</span>
            <span>{formatDate(event.submissionStart)} - {formatDate(event.submissionEnd)}</span>
          </div>
          {event.reviewStart && (
            <div className="date-item">
              <span>Período de revisão:</span>
              <span>{formatDate(event.reviewStart)} - {formatDate(event.reviewEnd)}</span>
            </div>
          )}
        </div>
        
        <div className="event-authors-card">
          <h3>Informações para submissão</h3>
          <div className="authors-info">
            <span>Máximo de autores por trabalho:</span>
            <span className="max-authors">{event.maxAuthors}</span>
          </div>
          
          {event.paperTypes.length > 0 && (
            <div className="paper-types">
              <h4>Tipos de trabalho:</h4>
              <ul>
                {event.paperTypes.map(type => (
                  <li key={type.id}>
                    <strong>{type.name}</strong>
                    {type.description && <p>{type.description}</p>}
                    {(type.minPages || type.maxPages) && (
                      <span className="pages-info">
                        {type.minPages && `Min: ${type.minPages} páginas`}
                        {type.minPages && type.maxPages && ' | '}
                        {type.maxPages && `Max: ${type.maxPages} páginas`}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="event-areas">
        <h3>Áreas temáticas</h3>
        {event.areas.length > 0 ? (
          <div className="areas-grid">
            {event.areas.map(area => (
              <div key={area.id} className="area-card">
                <h4>{area.name}</h4>
                {area.description && <p>{area.description}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p>Nenhuma área temática definida</p>
        )}
      </div>

      {event.eventFields.length > 0 && (
        <div className="custom-fields">
          <h3>Campos adicionais</h3>
          <div className="fields-list">
            {event.eventFields.map(field => (
              <div key={field.id} className="field-item">
                <span className="field-label">{field.label}</span>
                <span className="field-type">{getFieldTypeLabel(field.fieldType)}</span>
                {field.isRequired && <span className="required-badge">Obrigatório</span>}
                {field.description && <p className="field-description">{field.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="event-actions-container">
        {event.userCanSubmit && (
          <Link href={`/paper/submit?eventId=${event.id}`} className="submit-button">
            Enviar trabalho
          </Link>
        )}
        
        {event.userSubmissions > 0 && (
          <Link href={`/dashboard/papers?eventId=${event.id}`} className="view-papers-button">
            Ver meus trabalhos
          </Link>
        )}
        
        {event.userCanReview && (
          <Link href={`/dashboard/reviews?eventId=${event.id}`} className="review-button">
            Área de revisão
          </Link>
        )}
        
        {['ADMIN', 'EDITOR'].includes(event.userRole) && (
          <Link href={`/dashboard/events/${event.id}/manage`} className="manage-button">
            Gerenciar evento
          </Link>
        )}
      </div>
    </div>
  );
}

// Funções auxiliares
function getUserRoleLabel(role) {
  const roles = {
    ADMIN: 'Administrador',
    EDITOR: 'Editor',
    REVIEWER: 'Revisor',
    MEMBER: 'Membro',
    VISITOR: 'Visitante'
  };
  
  return roles[role] || 'Desconhecido';
}

function getFieldTypeLabel(type) {
  const types = {
    TEXT: 'Texto',
    TEXTAREA: 'Área de texto',
    NUMBER: 'Número',
    SELECT: 'Seleção única',
    MULTISELECT: 'Seleção múltipla',
    CHECKBOX: 'Caixa de seleção',
    RADIO: 'Opção única',
    DATE: 'Data',
    FILE: 'Arquivo'
  };
  
  return types[type] || type;
}

function StatusBadge({ status, daysRemaining }) {
  const statusLabels = {
    open: 'Submissões abertas',
    upcoming: 'Submissões em breve',
    closed: 'Submissões encerradas',
    unknown: 'Status desconhecido'
  };
  
  return (
    <div className={`status-badge ${status}`}>
      <span className="status-label">{statusLabels[status]}</span>
      {(status === 'open' || status === 'upcoming') && daysRemaining !== null && (
        <span className="days-remaining">
          {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
        </span>
      )}
    </div>
  );
}