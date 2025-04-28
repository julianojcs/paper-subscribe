'use client';

import { useEffect, useState } from 'react';
import { FaUserPlus, FaExclamationTriangle } from 'react-icons/fa';
import Button from '../Button';
import AuthorCard from './AuthorCard';
import styles from './AuthorsList.module.css';

// Função para gerar IDs estáveis para autores temporários
const generateStableId = (index) => `temp-author-${index}`;

export default function AuthorsList({
  authors,
  onChange,
  maxAuthors = 3,
  fieldErrors = {},
  currentUserId = null, // ID do usuário atual (autor principal)
  brazilianStates = [],
  statesLoading = false
}) {
  const [presenterId, setPresenterId] = useState(null);
  const [authorIdsMap, setAuthorIdsMap] = useState(new Map()); // Mapeia índices para IDs estáveis

  // Função para garantir que todos os autores tenham IDs estáveis
  const ensureStableIds = (authorsList) => {
    // Cria um novo mapa se necessário
    const newMap = new Map(authorIdsMap);

    // Atualiza o mapa com autores que têm userId ou id
    const updatedAuthors = authorsList.map((author, index) => {
      // Se o autor já tem um ID real (userId ou id), use-o
      if (author.userId || author.id) {
        return author;
      }

      // Se não tem ID, gerar um estável baseado no índice
      if (!newMap.has(index)) {
        newMap.set(index, generateStableId(index));
      }

      // Retornar autor com ID estável
      return {
        ...author,
        id: newMap.get(index)
      };
    });

    // Atualiza o mapa de IDs
    setAuthorIdsMap(newMap);

    return updatedAuthors;
  };

  // Inicializar o presenterId com o primeiro autor se não houver um definido
  useEffect(() => {
    if (authors.length > 0) {
      // Primeiro, garanta que todos os autores têm IDs estáveis
      const authorsWithIds = ensureStableIds(authors);

      // Se os autores foram atualizados com IDs, propague a mudança
      if (JSON.stringify(authorsWithIds) !== JSON.stringify(authors)) {
        onChange(authorsWithIds);
        return;
      }

      // Depois, trate da lógica do apresentador
      if (!presenterId) {
        // Encontrar um autor existente que seja apresentador
        const presenter = authorsWithIds.find(author => author.isPresenter);
        if (presenter) {
          setPresenterId(presenter.id);
        } else {
          // Senão, definir o primeiro como apresentador
          setPresenterId(authorsWithIds[0].id);
          const updatedAuthors = authorsWithIds.map((author, idx) => ({
            ...author,
            isPresenter: idx === 0
          }));
          onChange(updatedAuthors);
        }
      }
    }
  }, [authors, presenterId, onChange]);

  const handleAddAuthor = () => {
    if (authors.length >= maxAuthors) {
      alert(`Não é possível adicionar mais do que ${maxAuthors} autores.`);
      return;
    }

    // Encontrar próximo índice disponível para o novo autor
    const newIndex = authors.length;

    // Garantir um ID estável para o novo autor
    const newMap = new Map(authorIdsMap);
    const newId = generateStableId(newIndex);
    newMap.set(newIndex, newId);
    setAuthorIdsMap(newMap);

    const newAuthor = {
      id: newId,
      name: '',
      institution: '',
      city: '',
      state: null,
      isPresenter: false,
      authorOrder: newIndex // Adicionar ordem do autor
    };

    onChange([...authors, newAuthor]);
  };

  const handleUpdateAuthor = (updatedAuthor) => {
    onChange(
      authors.map(author =>
        author.id === updatedAuthor.id ? updatedAuthor : author
      )
    );
  };

  const handleDeleteAuthor = (authorId) => {
    if (authors.length <= 1) {
      alert('É necessário ter pelo menos um autor.');
      return;
    }

    // Verificar se este é o autor principal (com userId = currentUserId)
    const isMainAuthor = authors.some(
      author => author.id === authorId && author.userId === currentUserId
    );

    if (isMainAuthor) {
      alert('O autor principal não pode ser removido.');
      return;
    }

    // Se estiver removendo o apresentador, define o primeiro autor restante como apresentador
    let newAuthors = authors.filter(author => author.id !== authorId);

    if (authorId === presenterId && newAuthors.length > 0) {
      const newPresenterId = newAuthors[0].id;
      setPresenterId(newPresenterId);
      newAuthors = newAuthors.map(author => ({
        ...author,
        isPresenter: author.id === newPresenterId
      }));
    }

    // Reordenar os autores restantes
    newAuthors = newAuthors.map((author, index) => ({
      ...author,
      authorOrder: index
    }));

    onChange(newAuthors);

    // Limpar o mapa de IDs para evitar vazamentos de memória
    const newMap = new Map();
    newAuthors.forEach((author, index) => {
      if (!author.userId && author.id && author.id.startsWith('temp-author-')) {
        newMap.set(index, author.id);
      }
    });
    setAuthorIdsMap(newMap);
  };

  const handleSetPresenter = (authorId) => {
    setPresenterId(authorId);
    onChange(
      authors.map(author => ({
        ...author,
        isPresenter: author.id === authorId
      }))
    );
  };

  // Antes de enviar para a API
  const authorsToSave = authors.map(author => ({
    ...author,
    // Extrair só o valor do estado se for um objeto
    state: author.state && typeof author.state === 'object' ? author.state.value : author.state
  }));

  return (
    <div className={styles.authorsListContainer}>
      <div className={styles.authorList}>
        {authors.map(author => {
          const isMainAuthor = author.userId === currentUserId;

          return (
            <div key={author.id || `fallback-${author.authorOrder}`}>
              <AuthorCard
                author={author}
                onUpdate={handleUpdateAuthor}
                onDelete={handleDeleteAuthor}
                isPresenter={author.id === presenterId}
                onSetPresenter={handleSetPresenter}
                canDelete={authors.length > 1 && !isMainAuthor}
                fieldErrors={fieldErrors}
                isMainAuthor={isMainAuthor}
                brazilianStates={brazilianStates}
                statesLoading={statesLoading}
              />
            </div>
          );
        })}
      </div>

      {authors.length < maxAuthors && (
        <div className={styles.addAuthorContainer}>
          <Button
            variant="outline"
            type="button"
            onClick={handleAddAuthor}
            className={styles.addAuthorButton}
          >
            <FaUserPlus className={styles.addIcon} />
            Adicionar Autor ({authors.length}/{maxAuthors})
          </Button>
        </div>
      )}
    </div>
  );
}