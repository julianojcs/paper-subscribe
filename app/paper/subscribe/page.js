'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { FaExclamationTriangle, FaInfoCircle, FaUpload } from 'react-icons/fa';
import AuthorsList from '../../components/ui/authors/AuthorsList';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import TextareaField from '../../components/ui/TextareaField';
import TrashIcon from '../../components/ui/TrashIcon';
import useBrazilianStates from '../../hooks/useBrazilianStates';
import styles from './subscribe.module.css';

// Componente carregador para usar no Suspense
const LoadingFallback = () => (
  <div className={styles.loadingContainer}>
    <div className={styles.spinner}></div>
    <p>Carregando...</p>
  </div>
);

// Componente principal que utiliza useSearchParams
function SubmitPaperForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef(null);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState([]);
  const [abstract, setAbstract] = useState('');
  const [keywords, setKeywords] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [maxAuthors, setMaxAuthors] = useState(10);
  const [eventId, setEventId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [paperTypes, setPaperTypes] = useState([]);
  const [selectedPaperType, setSelectedPaperType] = useState('');
  const [eventFields, setEventFields] = useState([]);
  const [dynamicFieldValues, setDynamicFieldValues] = useState({});
  const [abstractFieldConfig, setAbstractFieldConfig] = useState(null);

  const { states: brazilianStates, isLoading: statesLoading } = useBrazilianStates();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent(window.location.href));
      return;
    }

    if (status === 'authenticated' && session?.user) {
      const fetchUserDetails = async () => {
        try {
          const response = await fetch('/api/user/profile?includeEvents=true&activeEventsOnly=true');

          if (response.ok) {
            const formData = await response.json();
            if (formData.events && formData.events.length > 0) {
              const event = formData.events[0];
              setEventId(event.id);

              if (event.maxAuthors) {
                setMaxAuthors(event.maxAuthors);
              }

              if (event.areas && event.areas.length > 0) {
                setAreas(event.areas);
              }

              if (event.paperTypes && event.paperTypes.length > 0) {
                setPaperTypes(event.paperTypes);
              }

              // Processar campos do evento
              if (event.eventFields) {
                // Filtrar apenas os campos do tipo texto ou textarea
                const textFields = event.eventFields.filter(field =>
                  field.fieldType === 'text' || field.fieldType === 'textarea'
                );

                // Inicializar valores para os campos dinâmicos
                const initialValues = {};
                textFields.forEach(field => {
                  initialValues[field.id] = '';
                });
                setDynamicFieldValues(initialValues);

                // Verificar se existe um campo específico para o resumo
                const abstractField = event.eventFields.find(field =>
                  (field.fieldType === 'textarea') &&
                  (field.label.toLowerCase().includes('resumo') ||
                    field.label.toLowerCase().includes('abstract'))
                );

                if (abstractField) {
                  setAbstractFieldConfig(abstractField);
                  // Remover o campo de resumo da lista de campos dinâmicos
                  setEventFields(textFields.filter(field => field.id !== abstractField.id));
                } else {
                  setEventFields(textFields);
                }
              }
            }

            const mainAuthor = {
              id: "main-author",
              name: formData.name || session.user.name || "",
              institution: formData.institution || "",
              city: formData.city || "",
              state: formData.stateId ? {
                value: formData.stateId,
                label: formData.stateName || formData.stateId
              } : null,
              isPresenter: true,
              isMainAuthor: true
            };
            setAuthors([mainAuthor]);
          } else {
            const mainAuthor = {
              id: "main-author",
              name: session.user.name || "",
              institution: "",
              city: "",
              state: null,
              isPresenter: true,
              isMainAuthor: true
            };
            setAuthors([mainAuthor]);
          }
          setIsLoading(false);
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
          const mainAuthor = {
            id: "main-author",
            name: session.user.name || "",
            institution: "",
            city: "",
            state: null,
            isPresenter: true,
            isMainAuthor: true
          };
          setAuthors([mainAuthor]);
          setIsLoading(false);
        }
      };
      fetchUserDetails();
    }
  }, [session, status, router]);

  const triggerFileInput = (e) => {
    if (e.target.closest(`.${styles.removeFileButton}`)) {
      return;
    }
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setFieldErrors((prev) => ({ ...prev, file: 'Apenas arquivos PDF são permitidos' }));
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setFieldErrors((prev) => ({ ...prev, file: 'O arquivo não pode exceder 10MB' }));
        return;
      }
      setFile(selectedFile);
      setFieldErrors((prev) => ({ ...prev, file: null }));
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAuthorsChange = (updatedAuthors) => {
    const mainAuthor = updatedAuthors.find(author => author.id === "main-author");
    if (mainAuthor) {
      mainAuthor.isMainAuthor = true;
    }
    setAuthors(updatedAuthors);
  };

  const handleAreaChange = (e) => {
    setSelectedArea(e.target.value);
    setFieldErrors((prev) => ({ ...prev, area: null }));
  };

  const getAreaDescription = (areaId) => {
    const selectedArea = areas.find(area => area.id === areaId);
    return selectedArea?.description || null;
  };

  const handlePaperTypeChange = (e) => {
    setSelectedPaperType(e.target.value);
    setFieldErrors((prev) => ({ ...prev, paperType: null }));
  };

  const getPaperTypeDescription = (paperTypeId) => {
    const selectedType = paperTypes.find(type => type.id === paperTypeId);
    if (!selectedType) return null;

    let description = selectedType.description || '';

    if (selectedType.minPages && selectedType.maxPages) {
      description += description ? '\n\n' : '';
      description += `Requisitos: ${selectedType.minPages} a ${selectedType.maxPages} páginas`;
    } else if (selectedType.maxPages) {
      description += description ? '\n\n' : '';
      description += `Requisitos: Máximo de ${selectedType.maxPages} páginas`;
    } else if (selectedType.minPages) {
      description += description ? '\n\n' : '';
      description += `Requisitos: Mínimo de ${selectedType.minPages} páginas`;
    }

    return description;
  };

  const handleAbstractChange = (e) => {
    setAbstract(e.target.value);
    setFieldErrors((prev) => ({ ...prev, abstract: null }));
  };

  const handleDynamicFieldChange = (e) => {
    const { name, value } = e.target;
    setDynamicFieldValues(prev => ({
      ...prev,
      [name]: value
    }));
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!title.trim()) errors.title = 'Título é obrigatório';
    if (!abstract.trim()) errors.abstract = 'Resumo é obrigatório';
    if (!keywords.trim()) errors.keywords = 'Palavras-chave são obrigatórias';
    if (!file) errors.file = 'O arquivo PDF é obrigatório';

    if (areas.length > 0 && !selectedArea) {
      errors.area = 'Selecione uma área temática';
    }

    if (paperTypes.length > 0 && !selectedPaperType) {
      errors.paperType = 'Selecione um tipo de trabalho';
    }

    eventFields.forEach(field => {
      if (field.required && !dynamicFieldValues[field.id]?.trim()) {
        errors[field.id] = `${field.label} é obrigatório`;
      }

      if (field.minLength && dynamicFieldValues[field.id]?.length < field.minLength) {
        errors[field.id] = `${field.label} deve ter pelo menos ${field.minLength} caracteres`;
      }

      if (field.minWords) {
        const wordCount = dynamicFieldValues[field.id]?.trim()
          ? dynamicFieldValues[field.id].trim().split(/\s+/).length
          : 0;

        if (wordCount < field.minWords) {
          errors[field.id] = `${field.label} deve ter pelo menos ${field.minWords} palavras`;
        }
      }
    });

    if (abstractFieldConfig) {
      if (abstractFieldConfig.minLength && abstract.length < abstractFieldConfig.minLength) {
        errors.abstract = `O resumo deve ter pelo menos ${abstractFieldConfig.minLength} caracteres`;
      }

      if (abstractFieldConfig.minWords) {
        const wordCount = abstract.trim() ? abstract.trim().split(/\s+/).length : 0;
        if (wordCount < abstractFieldConfig.minWords) {
          errors.abstract = `O resumo deve ter pelo menos ${abstractFieldConfig.minWords} palavras`;
        }
      }
    }

    let hasPresenter = false;

    authors.forEach(author => {
      if (author.isPresenter) hasPresenter = true;
      if (!author.name.trim()) {
        errors[`author-${author.id}-name`] = 'Nome é obrigatório';
      }
      if (!author.institution.trim()) {
        errors[`author-${author.id}-institution`] = 'Instituição é obrigatória';
      }
      if (!author.city.trim()) {
        errors[`author-${author.id}-city`] = 'Cidade é obrigatória';
      }
      if (!author.state) {
        errors[`author-${author.id}-state`] = 'Estado é obrigatório';
      }
    });

    if (!hasPresenter) {
      errors.authors = 'É necessário definir um autor como apresentador';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('authors', JSON.stringify(authors));
      formData.append('abstract', abstract);
      formData.append('keywords', keywords);
      formData.append('file', file);

      if (selectedArea) {
        formData.append('areaId', selectedArea);
      }

      if (selectedPaperType) {
        formData.append('paperTypeId', selectedPaperType);
      }

      if (eventId) {
        formData.append('eventId', eventId);
      }

      Object.keys(dynamicFieldValues).forEach(fieldId => {
        if (dynamicFieldValues[fieldId]) {
          formData.append(`field_${fieldId}`, dynamicFieldValues[fieldId]);
        }
      });

      const response = await fetch('/api/paper/submit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao enviar trabalho');
      }

      router.push('/paper?success=true');
    } catch (error) {
      console.error('Erro ao submeter trabalho:', error);
      setError(error.message || 'Ocorreu um erro ao enviar seu trabalho. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderDynamicField = (fieldConfig) => {
    if (fieldConfig.fieldType === 'textarea') {
      return (
        <TextareaField
          key={fieldConfig.id}
          id={fieldConfig.id}
          name={fieldConfig.id}
          label={fieldConfig.label}
          value={dynamicFieldValues[fieldConfig.id] || ''}
          onChange={handleDynamicFieldChange}
          placeholder={fieldConfig.placeholder || ''}
          helperText={fieldConfig.helperText || ''}
          errorMessage={fieldErrors[fieldConfig.id]}
          required={fieldConfig.required}
          rows={fieldConfig.rows || 4}
          maxRows={fieldConfig.maxRows || 10}
          fieldConfig={fieldConfig}
          autoResize={true}
        />
      );
    } else if (fieldConfig.fieldType === 'text') {
      return (
        <div className={styles.formGroup} key={fieldConfig.id}>
          <label htmlFor={fieldConfig.id} className={styles.formLabel}>
            {fieldConfig.label} {fieldConfig.required && <span className={styles.requiredMark}>*</span>}
          </label>
          <input
            id={fieldConfig.id}
            name={fieldConfig.id}
            type="text"
            value={dynamicFieldValues[fieldConfig.id] || ''}
            onChange={handleDynamicFieldChange}
            className={`${styles.formInput} ${fieldErrors[fieldConfig.id] ? styles.inputError : ''}`}
            placeholder={fieldConfig.placeholder || ''}
            maxLength={fieldConfig.maxLength}
            required={fieldConfig.required}
          />
          {fieldErrors[fieldConfig.id] && (
            <span className={styles.fieldError}>{fieldErrors[fieldConfig.id]}</span>
          )}
          {fieldConfig.helperText && (
            <span className={styles.fieldHelper}>{fieldConfig.helperText}</span>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando dados do autor...</p>
      </div>
    );
  }

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
                  <label className={styles.formLabel}>
                    Autores <span className={styles.requiredMark}>*</span>
                  </label>
                  <AuthorsList
                    authors={authors}
                    onChange={handleAuthorsChange}
                    maxAuthors={maxAuthors}
                    fieldErrors={fieldErrors}
                    mainAuthorId="main-author"
                    brazilianStates={brazilianStates}
                    statesLoading={statesLoading}
                  />
                  {fieldErrors.authors && (
                    <span className={styles.fieldError}>{fieldErrors.authors}</span>
                  )}
                </div>

                {areas.length > 0 && (
                  <Select
                    id="area"
                    label="Área Temática"
                    value={selectedArea}
                    onChange={handleAreaChange}
                    options={areas}
                    placeholder="Selecione uma área temática"
                    helperText="Escolha a área temática mais adequada para o seu trabalho"
                    errorMessage={fieldErrors.area}
                    required={true}
                    getDescription={getAreaDescription}
                  />
                )}

                {paperTypes.length > 0 && (
                  <Select
                    id="paperType"
                    label="Tipo de Trabalho"
                    value={selectedPaperType}
                    onChange={handlePaperTypeChange}
                    options={paperTypes}
                    placeholder="Selecione o tipo de trabalho"
                    helperText="Escolha o formato que melhor se adapta ao seu trabalho"
                    errorMessage={fieldErrors.paperType}
                    required={true}
                    getDescription={getPaperTypeDescription}
                  />
                )}

                <TextareaField
                  id="abstract"
                  name="abstract"
                  label="Resumo"
                  value={abstract}
                  onChange={handleAbstractChange}
                  placeholder="Descreva brevemente os objetivos, metodologia e resultados principais do seu trabalho"
                  helperText={abstractFieldConfig?.helperText || "O resumo deve ser conciso e representativo do conteúdo do trabalho"}
                  errorMessage={fieldErrors.abstract}
                  required={true}
                  rows={5}
                  maxRows={10}
                  fieldConfig={abstractFieldConfig}
                  autoResize={true}
                />

                {eventFields.map(field => renderDynamicField(field))}

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
                        <div className={styles.fileDetails}>
                          <span className={styles.fileName} title={file.name}>
                            {file.name}
                          </span>
                          <span className={styles.fileSize}>
                            ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>
                        <div
                          className={styles.removeFileButton}
                          onClick={handleRemoveFile}
                          role="button"
                          tabIndex={0}
                          aria-label="Remover arquivo"
                        >
                          <TrashIcon label="Excluir" />
                        </div>
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

// Componente página que envolve o form com Suspense
export default function SubmitPaperPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SubmitPaperForm />
    </Suspense>
  );
}