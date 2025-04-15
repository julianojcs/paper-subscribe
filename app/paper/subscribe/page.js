'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './subscribe.module.css';
import Button from '../../components/ui/Button';
import { FaUpload, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function SubmitPaperPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [abstract, setAbstract] = useState('');
  const [keywords, setKeywords] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Verificar se é um PDF
    if (selectedFile.type !== 'application/pdf') {
      setError('O arquivo deve estar em formato PDF.');
      setFile(null);
      return;
    }

    // Verificar tamanho máximo (10 MB)
    const maxSize = 10 * 1024 * 1024;  // 10MB em bytes
    if (selectedFile.size > maxSize) {
      setError('O arquivo não deve exceder 10MB.');
      setFile(null);
      return;
    }

    setError('');
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação dos campos
    const errors = {};
    if (!title.trim()) errors.title = 'Título é obrigatório';
    if (!authors.trim()) errors.authors = 'Autores são obrigatórios';
    if (!abstract.trim()) errors.abstract = 'Resumo é obrigatório';
    if (!keywords.trim()) errors.keywords = 'Palavras-chave são obrigatórias';
    if (!file) errors.file = 'O arquivo PDF é obrigatório';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      // Criar FormData para envio do arquivo
      const formData = new FormData();
      formData.append('title', title);
      formData.append('authors', authors);
      formData.append('abstract', abstract);
      formData.append('keywords', keywords);
      formData.append('file', file);

      const response = await fetch('/api/paper/submit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao enviar trabalho');
      }

      // Redirecionar para a página de sucesso
      router.push('/paper?success=true');
    } catch (error) {
      console.error('Erro ao submeter trabalho:', error);
      setError(error.message || 'Ocorreu um erro ao enviar seu trabalho. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Enviar Novo Trabalho Científico</h1>
        </header>

        <div className={styles.content}>
          {error && (
            <div className={styles.errorMessage}>
              <FaExclamationTriangle className={styles.errorIcon} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.formContainer}>
            <form onSubmit={handleSubmit} className={styles.paperForm}>
              <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Informações do Trabalho</h2>
                <p className={styles.sectionDescription}>
                  Preencha todos os campos abaixo com as informações do seu trabalho científico.
                </p>

                <div className={styles.formGroup}>
                  <label htmlFor="title" className={styles.formLabel}>
                    Título <span className={styles.requiredMark}>*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`${styles.formInput} ${fieldErrors.title ? styles.inputError : ''}`}
                    placeholder="Título completo do trabalho"
                  />
                  {fieldErrors.title && (
                    <span className={styles.fieldError}>{fieldErrors.title}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="authors" className={styles.formLabel}>
                    Autores <span className={styles.requiredMark}>*</span>
                  </label>
                  <input
                    id="authors"
                    type="text"
                    value={authors}
                    onChange={(e) => setAuthors(e.target.value)}
                    className={`${styles.formInput} ${fieldErrors.authors ? styles.inputError : ''}`}
                    placeholder="Nome dos autores separados por vírgula"
                  />
                  {fieldErrors.authors && (
                    <span className={styles.fieldError}>{fieldErrors.authors}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="abstract" className={styles.formLabel}>
                    Resumo <span className={styles.requiredMark}>*</span>
                  </label>
                  <textarea
                    id="abstract"
                    value={abstract}
                    onChange={(e) => setAbstract(e.target.value)}
                    className={`${styles.formTextarea} ${fieldErrors.abstract ? styles.inputError : ''}`}
                    placeholder="Breve resumo do trabalho"
                    rows={5}
                  />
                  {fieldErrors.abstract && (
                    <span className={styles.fieldError}>{fieldErrors.abstract}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="keywords" className={styles.formLabel}>
                    Palavras-chave <span className={styles.requiredMark}>*</span>
                  </label>
                  <input
                    id="keywords"
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className={`${styles.formInput} ${fieldErrors.keywords ? styles.inputError : ''}`}
                    placeholder="Palavras-chave separadas por vírgula"
                  />
                  {fieldErrors.keywords && (
                    <span className={styles.fieldError}>{fieldErrors.keywords}</span>
                  )}
                  <span className={styles.fieldHelper}>Ex: inteligência artificial, machine learning, deep learning</span>
                </div>

                <div className={`${styles.formGroup} ${styles.fileUploadGroup}`}>
                  <label className={styles.formLabel}>
                    Arquivo PDF <span className={styles.requiredMark}>*</span>
                  </label>

                  <div
                    className={`${styles.fileDropArea} ${fieldErrors.file ? styles.fileError : ''} ${file ? styles.fileSelected : ''}`}
                    onClick={triggerFileInput}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className={styles.fileInput}
                    />

                    {file ? (
                      <div className={styles.selectedFile}>
                        <FaUpload className={styles.uploadIcon} />
                        <span className={styles.fileName}>{file.name}</span>
                        <span className={styles.fileSize}>({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                      </div>
                    ) : (
                      <div className={styles.uploadPrompt}>
                        <FaUpload className={styles.uploadIcon} />
                        <span className={styles.uploadText}>
                          Clique para selecionar o arquivo PDF do seu trabalho
                          <span className={styles.dragDropText}>ou arraste e solte aqui</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {fieldErrors.file && (
                    <span className={styles.fieldError}>{fieldErrors.file}</span>
                  )}

                  <div className={styles.fileRequirements}>
                    <FaInfoCircle className={styles.infoIcon} />
                    <span>O arquivo deve estar em formato PDF e não exceder 10MB</span>
                  </div>
                </div>

                <div className={styles.termsGroup}>
                  <p className={styles.termsNotice}>
                    Ao enviar este trabalho, você concorda com nossos
                    <a href="/terms" className={styles.termsLink}> termos de serviço</a> e
                    <a href="/privacy" className={styles.termsLink}> política de privacidade</a>.
                  </p>
                </div>

                <div className={styles.formActions}>
                  <Button
                    variant="outline"
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => router.push('/paper')}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>

                  <Button
                    variant="primary"
                    type="submit"
                    className={styles.submitButton}
                    disabled={submitting}
                  >
                    {submitting ? 'Enviando...' : 'Enviar Trabalho'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}