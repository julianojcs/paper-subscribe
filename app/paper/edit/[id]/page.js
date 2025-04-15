'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FaFileAlt, FaUpload, FaSpinner, FaSave, FaTimes } from 'react-icons/fa';
import Button from '../../../components/ui/Button';
import styles from './edit.module.css';

export default function EditPaperPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { data: session, status } = useSession();

  // Estados para o formulário
  const [paper, setPaper] = useState(null);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [abstract, setAbstract] = useState('');
  const [keywords, setKeywords] = useState('');
  const [file, setFile] = useState(null);

  // Estados para controle de UI
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [fileChanged, setFileChanged] = useState(false);
  const [formChanged, setFormChanged] = useState(false);

  // Verificar se os dados foram alterados
  useEffect(() => {
    if (paper) {
      setFormChanged(
        title !== paper.title ||
        authors !== paper.authors ||
        abstract !== paper.abstract ||
        keywords !== paper.keywords ||
        fileChanged
      );
    }
  }, [title, authors, abstract, keywords, fileChanged, paper]);

  const fetchPaperData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/paper/${id}`);

      if (!response.ok) {
        throw new Error(response.status === 404
          ? 'Trabalho não encontrado'
          : 'Erro ao carregar trabalho');
      }

      const data = await response.json();
      setPaper(data.paper);

      // Preencher o formulário com os dados do paper
      setTitle(data.paper.title);
      setAuthors(data.paper.authors);
      setAbstract(data.paper.abstract);
      setKeywords(data.paper.keywords);

      setError(null);
    } catch (err) {
      console.error('Erro ao carregar dados do trabalho:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (status === 'authenticated' && id) {
      fetchPaperData();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [id, status, fetchPaperData, router]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Por favor, selecione um arquivo PDF.');
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB
        setError('O tamanho máximo do arquivo é 10MB.');
        return;
      }

      setFile(selectedFile);
      setFileChanged(true);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formChanged) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Primeiro atualizar os dados do paper
      const updateResponse = await fetch(`/api/paper/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          authors,
          abstract,
          keywords,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Erro ao atualizar dados do trabalho');
      }

      // Se o arquivo foi alterado, fazer upload
      if (fileChanged && file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('paperId', id);

        const uploadResponse = await fetch('/api/paper/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Erro ao enviar arquivo');
        }
      }

      setSuccess(true);

      // Redirecionar após sucesso
      setTimeout(() => {
        router.push(`/paper/${id}`);
      }, 1500);

    } catch (err) {
      console.error('Erro ao salvar trabalho:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/paper/${id}`);
  };

  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <FaSpinner className={styles.loadingSpinner} />
        <p>Carregando...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FaSpinner className={styles.loadingSpinner} />
        <p>Carregando dados do trabalho...</p>
      </div>
    );
  }

  if (error && !paper) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2>Erro</h2>
          <p>{error}</p>
          <Button
            variant="secondary"
            onClick={() => router.push('/paper')}
          >
            Voltar para meus trabalhos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Editar Trabalho</h1>
        <Button
          variant="text"
          onClick={handleCancel}
          className={styles.cancelButton}
        >
          <FaTimes /> Cancelar
        </Button>
      </div>

      {success && (
        <div className={styles.successMessage}>
          <p>Trabalho atualizado com sucesso! Redirecionando...</p>
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>Título <span className={styles.required}>*</span></label>
          <input
            id="title"
            type="text"
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Título do trabalho"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="authors" className={styles.label}>Autores <span className={styles.required}>*</span></label>
          <input
            id="authors"
            type="text"
            className={styles.input}
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
            required
            placeholder="Lista de autores, separados por vírgula"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="abstract" className={styles.label}>Resumo <span className={styles.required}>*</span></label>
          <textarea
            id="abstract"
            className={styles.textarea}
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            required
            rows={8}
            placeholder="Resumo do trabalho"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="keywords" className={styles.label}>Palavras-chave <span className={styles.required}>*</span></label>
          <input
            id="keywords"
            type="text"
            className={styles.input}
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            required
            placeholder="Palavras-chave separadas por vírgula"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="file" className={styles.label}>
            Arquivo PDF {paper.fileUrl ? '(Atual: ' + paper.fileName + ')' : ''}
          </label>

          <div className={styles.fileUploadContainer}>
            <input
              id="file"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className={styles.fileInput}
            />

            <label htmlFor="file" className={styles.fileUploadButton}>
              <FaUpload className={styles.uploadIcon} />
              {fileChanged ? 'Arquivo selecionado' : 'Selecionar novo arquivo PDF'}
            </label>

            {fileChanged && file && (
              <div className={styles.fileInfo}>
                <FaFileAlt className={styles.fileIcon} />
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            )}
          </div>

          <p className={styles.fileHelp}>
            Formatos aceitos: PDF (máx. 10MB)
          </p>
        </div>

        <div className={styles.formActions}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={submitting}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={submitting || !formChanged}
            className={!formChanged ? styles.buttonDisabled : ''}
          >
            {submitting ? (
              <>
                <FaSpinner className={styles.spinnerIcon} /> Salvando...
              </>
            ) : (
              <>
                <FaSave className={styles.saveIcon} /> Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}