# Exemplo de uso do hook em um componente


```javascript
'use client';

import { useUserEvents, useUserEventDetails } from '../../../hooks/useUserEvents';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '../../../lib/utils';

export default function UserEventsPage() {
  const [selectedRole, setSelectedRole] = useState(null);
  const { events, isLoading, error } = useUserEvents({
    activeOnly: true,
    role: selectedRole
  });

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value === 'all' ? null : e.target.value);
  };

  if (isLoading) return <div className="loading-spinner">Carregando seus eventos...</div>;
  if (error) return <div className="error-message">Erro: {error.message}</div>;

  return (
    <div className="user-events-container">
      <h1>Meus Eventos</h1>

      <div className="filters">
        <label>
          Filtrar por papel:
          <select onChange={handleRoleChange} value={selectedRole || 'all'}>
            <option value="all">Todos</option>
            <option value="ADMIN">Administrador</option>
            <option value="EDITOR">Editor</option>
            <option value="REVIEWER">Revisor</option>
          </select>
        </label>
      </div>

      {events.length === 0 ? (
        <div className="no-events">
          <p>Você não está associado a nenhum evento.</p>
          <Link href="/events">Explorar eventos disponíveis</Link>
        </div>
      ) : (
        <div className="events-list">
          {events.map(event => (
            <div key={event.id} className={`event-card ${event.submissionStatus}`}>
              {event.organization?.logoUrl && (
                <div className="organization-logo">
                  <Image
                    src={event.organization.logoUrl}
                    alt={event.organization.name}
                    width={60}
                    height={60}
                  />
                </div>
              )}

              <div className="event-details">
                <h3>{event.name}</h3>
                <div className="event-meta">
                  <span className="organization-name">{event.organization?.name}</span>
                  <span className="user-role">Seu papel: {getUserRoleLabel(event.userRole)}</span>
                </div>

                <div className="event-dates">
                  <div>
                    <strong>Evento:</strong> {formatDate(event.startDate)} - {formatDate(event.endDate)}
                  </div>
                  <div>
                    <strong>Submissões:</strong> {formatDate(event.submissionStart)} - {formatDate(event.submissionEnd)}
                  </div>
                </div>

                <div className="submission-status">
                  <StatusBadge status={event.submissionStatus} daysRemaining={event.daysRemaining} />
                </div>
              </div>

              <div className="event-actions">
                <Link href={`/dashboard/events/${event.id}`}>
                  Ver detalhes
                </Link>

                {event.submissionStatus === 'open' && (
                  <Link href={`/paper/submit?eventId=${event.id}`}>
                    Enviar trabalho
                  </Link>
                )}

                {['ADMIN', 'EDITOR', 'REVIEWER'].includes(event.userRole) && (
                  <Link href={`/dashboard/events/${event.id}/manage`}>
                    Gerenciar
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Componentes auxiliares
function StatusBadge({ status, daysRemaining }) {
  const statusLabels = {
    open: 'Submissões abertas',
    upcoming: 'Em breve',
    closed: 'Fechado',
    unknown: 'Status desconhecido'
  };

  return (
    <span className={`status-badge ${status}`}>
      {statusLabels[status]}
      {(status === 'open' || status === 'upcoming') && daysRemaining !== null && (
        <span className="days-remaining">
          {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
        </span>
      )}
    </span>
  );
}

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
```



