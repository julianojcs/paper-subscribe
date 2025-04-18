Características da implementação:
API RESTful - Endpoints claros e padronizados para acessar os dados

Seleção seletiva de campos - Usando select do Prisma para reduzir o tamanho da resposta

Relacionamentos incluídos - Retorna áreas, tipos de trabalho e campos personalizados

Tratamento de erros - Respostas de erro apropriadas com códigos HTTP

Parâmetros de consulta - Suporte para filtragem via query parameters

Cliente e Hooks - Funções e hooks para facilitar o uso da API no frontend

Documentação Swagger - Comentários para gerar documentação da API

Status de submissão - Cálculo dinâmico do status de submissão e dias restantes para eventos atuais

Esta implementação fornece um conjunto completo de endpoints para acessar os dados de eventos, incluindo todos os relacionamentos solicitados.


```javascript
// Exemplo de uso do hook em um componente
'use client';

import { useEvent } from '../hooks/useEvent';
import { useRouter, useSearchParams } from 'next/navigation';

export default function EventDetails() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('id');
  const { event, isLoading, error } = useEvent(eventId);

  if (isLoading) return <div>Carregando informações do evento...</div>;
  if (error) return <div>Erro ao carregar evento: {error.message}</div>;
  if (!event) return <div>Evento não encontrado</div>;

  return (
    <div>
      <h1>{event.name}</h1>
      <p>{event.description}</p>
      
      <h2>Informações</h2>
      <p>Máximo de autores por trabalho: {event.maxAuthors}</p>
      <p>Submissões: {new Date(event.submissionStart).toLocaleDateString()} até {new Date(event.submissionEnd).toLocaleDateString()}</p>
      
      <h2>Áreas ({event.areas.length})</h2>
      <ul>
        {event.areas.map(area => (
          <li key={area.id}>{area.name}</li>
        ))}
      </ul>
      
      <h2>Tipos de Trabalho ({event.paperTypes.length})</h2>
      <ul>
        {event.paperTypes.map(type => (
          <li key={type.id}>{type.name}</li>
        ))}
      </ul>
      
      <h2>Campos Personalizados ({event.eventFields.length})</h2>
      <ul>
        {event.eventFields.map(field => (
          <li key={field.id}>
            {field.label} ({field.fieldType}) 
            {field.isRequired ? ' (Obrigatório)' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}