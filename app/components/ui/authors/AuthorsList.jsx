'use client';

import { useEffect, useState } from 'react';
import { FaUserPlus } from 'react-icons/fa';
import Button from '../../ui/Button';
import AuthorCard from './AuthorCard';
import styles from './AuthorsList.module.css';

export default function AuthorsList({
  authors,
  onChange,
  maxAuthors = 3,
  fieldErrors = {},
  mainAuthorId = null // ID do autor principal que não pode ser excluído
}) {
  const [presenterId, setPresenterId] = useState(null);

  // Inicializar o presenterId com o primeiro autor se não houver um definido
  useEffect(() => {
    if (authors.length > 0 && !presenterId) {
      // Encontrar um autor existente que seja apresentador
      const presenter = authors.find(author => author.isPresenter);
      if (presenter) {
        setPresenterId(presenter.id);
      } else {
        // Senão, definir o primeiro como apresentador
        setPresenterId(authors[0].id);
        const updatedAuthors = authors.map((author, idx) => ({
          ...author,
          isPresenter: idx === 0
        }));
        onChange(updatedAuthors);
      }
    }
  }, [authors, presenterId, onChange]);

  const handleAddAuthor = () => {
    if (authors.length >= maxAuthors) {
      alert(`Não é possível adicionar mais do que ${maxAuthors} autores.`);
      return;
    }

    const newAuthor = {
      id: Date.now().toString(), // ID temporário
      name: '',
      institution: '',
      city: '',
      state: null,
      isPresenter: false,
      isMainAuthor: false
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

    // Verificar se este é o autor principal que não deve ser excluído
    if (authorId === mainAuthorId) {
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

    onChange(newAuthors);
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

  return (
    <div className={styles.authorsListContainer}>
      <div className={styles.authorList}>
        {authors.map(author => (
          <AuthorCard
            key={author.id}
            author={author}
            onUpdate={handleUpdateAuthor}
            onDelete={handleDeleteAuthor}
            isPresenter={author.id === presenterId}
            onSetPresenter={handleSetPresenter}
            canDelete={authors.length > 1 && author.id !== mainAuthorId}
            fieldErrors={fieldErrors}
            isMainAuthor={author.id === mainAuthorId}
          />
        ))}
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