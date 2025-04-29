'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { FaExclamationTriangle, FaInfoCircle, FaUpload } from 'react-icons/fa';
import AuthorsList from '../../components/ui/Authors/AuthorsList';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import TextareaField from '../../components/ui/TextareaField';
import TrashIcon from '../../components/ui/TrashIcon';
import useBrazilianStates from '../../hooks/useBrazilianStates';
import { FieldType, getInputTypeFromFieldType } from '../../utils/fieldTypes';
import styles from './subscribe.module.css';
import ProfileRedirectModal from './components/ProfileRedirectModal';
import PageContainer from '/app/components/layout/PageContainer';
import HeaderContentTitle from '/app/components/layout/HeaderContentTitle';
import LoadingSpinner from '/app/components/ui/LoadingSpinner';


// Funções auxiliares para formatação de texto e contagem de palavras
const getFieldHelperText = (fieldConfig) => {
  let text = fieldConfig.helpText || '';

  // Adicionar informações sobre limites de caracteres/palavras no texto de ajuda
  const constraints = [];

  if (fieldConfig.minLength && fieldConfig.maxLength) {
    constraints.push(`${fieldConfig.minLength} a ${fieldConfig.maxLength} caracteres`);
  } else if (fieldConfig.minLength) {
    constraints.push(`mínimo de ${fieldConfig.minLength} caracteres`);
  } else if (fieldConfig.maxLength) {
    constraints.push(`máximo de ${fieldConfig.maxLength} caracteres`);
  }

  if (fieldConfig.minWords && fieldConfig.maxWords) {
    constraints.push(`${fieldConfig.minWords} a ${fieldConfig.maxWords} palavras`);
  } else if (fieldConfig.minWords) {
    constraints.push(`mínimo de ${fieldConfig.minWords} palavra${fieldConfig.minWords === 1 ? '' : 's'}`);
  } else if (fieldConfig.maxWords) {
    constraints.push(`máximo de ${fieldConfig.maxWords} palavra${fieldConfig.maxWords === 1 ? '' : 's'}`);
  }

  if (constraints.length > 0) {
    if (text) text += ' ';
    text += `(${constraints.join(', ')})`;
  }

  return text;
};

const getWordCountText = (text, fieldConfig) => {
  if (!text) return '';

  const wordCount = text.trim().split(/\s+/).length;
  const characterCount = text.length;

  let message = `${wordCount} palavra${wordCount === 1 ? '' : 's'}`;

  if (fieldConfig.minWords && fieldConfig.maxWords) {
    message += ` (mín: ${fieldConfig.minWords}, máx: ${fieldConfig.maxWords})`;
  } else if (fieldConfig.minWords) {
    message += ` (mín: ${fieldConfig.minWords})`;
  } else if (fieldConfig.maxWords) {
    message += ` (máx: ${fieldConfig.maxWords})`;
  }

  if (fieldConfig.minLength || fieldConfig.maxLength) {
    message += ` | ${characterCount} caractere${characterCount === 1 ? '' : 's'}`;

    if (fieldConfig.minLength && fieldConfig.maxLength) {
      message += ` (mín: ${fieldConfig.minLength}, máx: ${fieldConfig.maxLength})`;
    } else if (fieldConfig.minLength) {
      message += ` (mín: ${fieldConfig.minLength})`;
    } else if (fieldConfig.maxLength) {
      message += ` (máx: ${fieldConfig.maxLength})`;
    }
  }

  return message;
};

// Componente principal que utiliza useSearchParams
const SubmitPaperPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState([]);
  const [keywords, setKeywords] = useState({
    value: '',
    min: 0,
    max: 0
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [maxAuthors, setMaxAuthors] = useState(10);
  const [eventId, setEventId] = useState(null);
  const [eventName, setEventName] = useState('');
  const [eventLogoUrl, setEventLogoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Iniciar como true para mostrar loading imediatamente
  const [contentReady, setContentReady] = useState(false); // Novo estado para controlar quando o conteúdo está pronto
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [paperTypes, setPaperTypes] = useState([]);
  const [selectedPaperType, setSelectedPaperType] = useState('');
  const [eventFields, setEventFields] = useState([]);
  const [dynamicFieldValues, setDynamicFieldValues] = useState({});
  const [hasFileField, setHasFileField] = useState(false);
  const [fileFieldConfig, setFileFieldConfig] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { states: brazilianStates, isLoading: statesLoading } = useBrazilianStates();

  useEffect(() => {
    // Sempre começar com loading ativo
    setIsLoading(true);
    setContentReady(false);

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

            // Verificar se todos os dados necessários existem antes de definir o autor principal
            if (formData.name && formData.institution && formData.city && formData.stateId) {
              const mainAuthor = {
                userId: session.user.id,
                name: formData.name,
                institution: formData.institution,
                city: formData.city,
                state: {
                  value: formData.stateId,
                  label: formData.state?.name || formData.stateId
                },
                isMainAuthor: true,
                isPresenter: true,
                authorOrder: 0
              };
              setAuthors([mainAuthor]);
            } else {
              // Em vez de redirecionar imediatamente, exiba o modal
              setProfileRedirectUrl('/profile?callbackUrl=' + encodeURIComponent(window.location.href));
              setShowProfileModal(true);
            }

            if (formData.events && formData.events.length > 0) {
              const event = formData.events[0];
              setEventId(event.id);

              // Salvar o nome e logoUrl do evento
              setEventName(event.name || 'Evento');
              setEventLogoUrl(event.logoUrl || null);

              if (event.maxAuthors) {
                setMaxAuthors(event.maxAuthors);
              }

              // Atualizar estado de keywords com limites do evento
              setKeywords(prev => ({
                ...prev,
                min: event.minKeywords || 0,
                max: event.maxKeywords || 0
              }));

              // Ordenar áreas por sortOrder e depois alfabeticamente por name
              if (event.areas && event.areas.length > 0) {
                const sortedAreas = [...event.areas].sort((a, b) => {
                  // Primeiro critério: sortOrder
                  if (a.sortOrder !== b.sortOrder) {
                    return a.sortOrder - b.sortOrder;
                  }
                  // Segundo critério (fallback): ordenação alfabética por nome
                  return a.name.localeCompare(b.name);
                });
                setAreas(sortedAreas);
              }

              // Ordenar tipos de trabalho por sortOrder e depois alfabeticamente por name
              if (event.paperTypes && event.paperTypes.length > 0) {
                const sortedPaperTypes = [...event.paperTypes].sort((a, b) => {
                  // Primeiro critério: sortOrder
                  if (a.sortOrder !== b.sortOrder) {
                    return a.sortOrder - b.sortOrder;
                  }
                  // Segundo critério (fallback): ordenação alfabética por nome
                  return a.name.localeCompare(b.name);
                });
                setPaperTypes(sortedPaperTypes);
              }

              // Processar campos do evento
              if (event.eventFields) {
                // Verificar se existe um campo do tipo FILE
                const fileField = event.eventFields.find(field =>
                  field.fieldType === FieldType.FILE
                );

                if (fileField) {
                  setHasFileField(true);
                  setFileFieldConfig(fileField);
                }

                // Filtrar e ordenar campos dinâmicos por sortOrder e depois alfabeticamente por label
                const formFields = event.eventFields
                  .filter(field =>
                    field.fieldType === FieldType.TEXT ||
                    field.fieldType === FieldType.TEXTAREA ||
                    field.fieldType === FieldType.SELECT ||
                    field.fieldType === FieldType.MULTISELECT ||
                    field.fieldType === FieldType.CHECKBOX ||
                    field.fieldType === FieldType.RADIO ||
                    field.fieldType === FieldType.DATE ||
                    field.fieldType === FieldType.NUMBER ||
                    field.fieldType === FieldType.EMAIL
                  )
                  .sort((a, b) => {
                    // Primeiro critério: sortOrder
                    if (a.sortOrder !== b.sortOrder) {
                      return a.sortOrder - b.sortOrder;
                    }
                    // Segundo critério (fallback): ordenação alfabética por label
                    return a.label.localeCompare(b.label);
                  });

                // Inicializar valores para os campos dinâmicos
                const initialValues = {};
                formFields.forEach(field => {
                  initialValues[field.id] = '';
                });
                setDynamicFieldValues(initialValues);

                // Definir todos os campos como campos dinâmicos
                setEventFields(formFields);
              }
            }

            const mainAuthor = {
              userId: session.user.id, // Guardar o ID do usuário atual
              name: formData.name || session.user.name || "",
              institution: formData.institution || "",
              city: formData.city || "",
              state: formData.stateId ? {
                value: formData.stateId,
                label: formData.stateName || formData.stateId
              } : null,
              isPresenter: true, // Esta flag continua para fins de UI
              authorOrder: 0 // Autor principal sempre é o primeiro
            };
            setAuthors([mainAuthor]);
          } else {
            const mainAuthor = {
              userId: session.user.id,
              name: session.user.name || "",
              institution: "",
              city: "",
              state: null,
              isPresenter: true,
              authorOrder: 0
            };
            setAuthors([mainAuthor]);
          }

          // Dados carregados com sucesso
          setContentReady(true);
          setIsLoading(false);
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
          const mainAuthor = {
            userId: session.user.id,
            name: session.user.name || "",
            institution: "",
            city: "",
            state: null,
            isPresenter: true,
            authorOrder: 0
          };
          setAuthors([mainAuthor]);

          // Mesmo com erro, considerar dados carregados
          setContentReady(true);
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
    // Atualizar o authorOrder com base na posição no array
    const authorsWithOrder = updatedAuthors.map((author, index) => ({
      ...author,
      authorOrder: index
    }));

    // Garantir que o autor com userId do usuário logado seja marcado como apresentador padrão
    // se nenhum outro autor estiver marcado
    const hasPresenter = authorsWithOrder.some(author => author.isPresenter);

    if (!hasPresenter && authorsWithOrder.length > 0) {
      const mainAuthorIndex = authorsWithOrder.findIndex(author => author.userId === session?.user?.id);
      if (mainAuthorIndex >= 0) {
        authorsWithOrder[mainAuthorIndex].isPresenter = true;
      }
    }

    setAuthors(authorsWithOrder);
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
    return selectedType?.description || null;
  };

  const handleDynamicFieldChange = (e) => {
    const { name, value } = e.target;
    setDynamicFieldValues(prev => ({
      ...prev,
      [name]: value
    }));
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleKeywordsChange = (e) => {
    const newValue = e.target.value;
    setKeywords(prev => ({
      ...prev,
      value: newValue
    }));
  };

  const countKeywords = (keywordsStr) => {
    if (!keywordsStr) return 0;

    return keywordsStr
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!title.trim()) errors.title = 'Título é obrigatório';

    // Validação de keywords
    if (keywords.max > 0) { // Só validar se tiver max definido
      if (!keywords.value.trim()) {
        errors.keywords = 'Palavras-chave são obrigatórias';
      } else {
        const keywordsCount = countKeywords(keywords.value);

        if (keywords.min === keywords.max && keywordsCount !== keywords.min) {
          errors.keywords = `Informe exatamente ${keywords.min} palavra${keywords.min === 1 ? '-chave' : 's-chave'}`;
        } else if (keywords.min > 0 && keywordsCount < keywords.min) {
          errors.keywords = `Informe pelo menos ${keywords.min} palavra${keywords.min === 1 ? '-chave' : 's-chave'}`;
        } else if (keywords.max > 0 && keywordsCount > keywords.max) {
          errors.keywords = `Informe no máximo ${keywords.max} palavra${keywords.max === 1 ? '-chave' : 's-chave'}`;
        }
      }
    }

    // Só validar arquivo se tiver campo de arquivo
    if (hasFileField && fileFieldConfig?.isRequired && !file) {
      errors.file = 'O arquivo PDF é obrigatório';
    }

    if (areas.length > 0 && !selectedArea) {
      errors.area = 'Selecione uma área temática';
    }

    if (paperTypes.length > 0 && !selectedPaperType) {
      errors.paperType = 'Selecione um tipo de trabalho';
    }

    // Validação aprimorada para campos dinâmicos, incluindo min/maxWords
    eventFields.forEach(field => {
      const value = dynamicFieldValues[field.id]?.trim() || '';

      // Validação de campo obrigatório
      if (field.isRequired && !value) {
        errors[field.id] = `${field.label} é obrigatório`;
        return; // Não continua validando se o campo estiver vazio
      }

      // Se não tem valor e não é obrigatório, não precisa validar
      if (!value) return;

      // Validação de quantidade mínima de caracteres
      if (field.minLength && value.length < field.minLength) {
        errors[field.id] = `${field.label} deve ter pelo menos ${field.minLength} caracteres`;
        return;
      }

      // Validação de quantidade máxima de caracteres
      if (field.maxLength && value.length > field.maxLength) {
        errors[field.id] = `${field.label} deve ter no máximo ${field.maxLength} caracteres`;
        return;
      }

      // Validação de quantidade mínima de palavras
      if (field.minWords) {
        const wordCount = value.split(/\s+/).length;

        if (wordCount < field.minWords) {
          errors[field.id] = `${field.label} deve ter pelo menos ${field.minWords} palavra${field.minWords === 1 ? '' : 's'}`;
          return;
        }
      }

      // Validação de quantidade máxima de palavras
      if (field.maxWords) {
        const wordCount = value.split(/\s+/).length;

        if (wordCount > field.maxWords) {
          errors[field.id] = `${field.label} deve ter no máximo ${field.maxWords} palavra${field.maxWords === 1 ? '' : 's'}`;
          return;
        }
      }
    });

    let hasPresenter = false;
    let hasEmptyFields = false;

    authors.forEach(author => {
      if (author.isPresenter) hasPresenter = true;

      // Criar um objeto para armazenar os campos vazios deste autor
      const emptyFields = [];

      if (!author.name?.trim()) {
        errors[`author-${author.authorOrder}-name`] = 'Nome é obrigatório';
        emptyFields.push('nome');
      }

      if (!author.institution?.trim()) {
        errors[`author-${author.authorOrder}-institution`] = 'Instituição é obrigatória';
        emptyFields.push('instituição');
      }

      if (!author.city?.trim()) {
        errors[`author-${author.authorOrder}-city`] = 'Cidade é obrigatória';
        emptyFields.push('cidade');
      }

      if (!author.state) {
        errors[`author-${author.authorOrder}-state`] = 'Estado é obrigatório';
        emptyFields.push('estado');
      }

      // Se este autor tem campos vazios, mostrar uma mensagem geral também
      if (emptyFields.length > 0) {
        hasEmptyFields = true;

        // Se for o autor principal (userId coincide com o usuário logado)
        if (author.userId === session?.user?.id) {
          errors.authors = `Complete as informações do autor principal: ${emptyFields.join(', ')}`;
        }
      }
    });

    if (!hasPresenter) {
      errors.authors = errors.authors || 'É necessário definir um autor como apresentador';
    }

    // Se temos campos vazios mas não temos uma mensagem geral para autores
    if (hasEmptyFields && !errors.authors) {
      errors.authors = 'Um ou mais autores possuem informações incompletas';
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
      formData.append('authors', JSON.stringify(
        authors.map(author => ({
          userId: author.userId || null,
          name: author.name,
          institution: author.institution,
          city: author.city,
          stateId: author.state?.value || author.stateId || null,
          isMainAuthor: author.isMainAuthor || false,
          isPresenter: author.isPresenter || false,
          authorOrder: author.authorOrder
        }))
      ));
      formData.append('keywords', keywords.value); // Enviar apenas o valor string

      // Só adicionar arquivo se existir
      if (file && hasFileField) {
        formData.append('file', file);
        if (fileFieldConfig) {
          formData.append('fileFieldId', fileFieldConfig.id);
        }
      }

      if (selectedArea) {
        formData.append('areaId', selectedArea);
      }

      if (selectedPaperType) {
        formData.append('paperTypeId', selectedPaperType);
      }

      if (eventId) {
        formData.append('eventId', eventId);
        formData.append('eventName', eventName);
      }


      // Criar array de paper fields values para enviar ao backend
      const paperFieldValues = Object.keys(dynamicFieldValues)
        .filter(fieldId => dynamicFieldValues[fieldId]) // Filtra apenas campos preenchidos
        .map(fieldId => ({
          fieldId: fieldId,
          value: dynamicFieldValues[fieldId]
        }));
      // Adiciona o array de paper fields values no formato correto
      formData.append('paperFieldValues', JSON.stringify(paperFieldValues));
      // O campo paperId não é adicionado aqui porque o paper ainda não foi criado
      // O backend irá associar esses campos ao paper recém-criado

      const response = await fetch('/api/paper', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Verificar se temos erros de validação específicos para campos
        if (errorData.fieldErrors) {
          setFieldErrors(errorData.fieldErrors);
          throw new Error('Por favor, corrija os erros destacados no formulário.');
        } else {
          // Erro geral
          throw new Error(errorData.error || 'Erro ao enviar trabalho');
        }
      }

      router.push('/paper?success=true');
    } catch (error) {
      console.error('Erro ao submeter trabalho:', error);
      setError(error.message || 'Ocorreu um erro ao enviar seu trabalho. Tente novamente.');

      // Rolar a tela para o topo para que o usuário veja a mensagem de erro
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderDynamicField = (fieldConfig) => {
    switch (fieldConfig.fieldType) {
      case FieldType.TEXTAREA:
        return (
          <TextareaField
            key={fieldConfig.id}
            id={fieldConfig.id}
            name={fieldConfig.id}
            label={fieldConfig.label}
            value={dynamicFieldValues[fieldConfig.id] || ''}
            onChange={handleDynamicFieldChange}
            placeholder={fieldConfig.placeholder || ''}
            helperText={getFieldHelperText(fieldConfig)}
            errorMessage={fieldErrors[fieldConfig.id]}
            required={fieldConfig.isRequired}
            rows={fieldConfig.rows || 4}
            maxRows={fieldConfig.maxRows || 10}
            maxCount={fieldConfig.maxLength}
            minCount={fieldConfig.minLength}
            maxWords={fieldConfig.maxWords}
            minWords={fieldConfig.minWords}
            fieldConfig={fieldConfig}
            autoResize={true}
            showWordCount={!!fieldConfig.minWords || !!fieldConfig.maxWords}
          />
        );
      case FieldType.TEXT:
        return (
          <div className={styles.formGroup} key={fieldConfig.id}>
            <label htmlFor={fieldConfig.id} className={styles.formLabel}>
              {fieldConfig.label} {fieldConfig.isRequired && <span className={styles.requiredMark}>*</span>}
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
              required={fieldConfig.isRequired}
            />
            {fieldErrors[fieldConfig.id] && (
              <span className={styles.fieldError}>{fieldErrors[fieldConfig.id]}</span>
            )}
            {getFieldHelperText(fieldConfig) && (
              <span className={styles.fieldHelper}>{getFieldHelperText(fieldConfig)}</span>
            )}
            {(fieldConfig.minWords || fieldConfig.maxWords) && dynamicFieldValues[fieldConfig.id] && (
              <div className={styles.wordCount}>
                {getWordCountText(dynamicFieldValues[fieldConfig.id], fieldConfig)}
              </div>
            )}
          </div>
        );
      case FieldType.EMAIL:
      case FieldType.NUMBER:
      case FieldType.DATE:
        return (
          <div className={styles.formGroup} key={fieldConfig.id}>
            <label htmlFor={fieldConfig.id} className={styles.formLabel}>
              {fieldConfig.label} {fieldConfig.isRequired && <span className={styles.requiredMark}>*</span>}
            </label>
            <input
              id={fieldConfig.id}
              name={fieldConfig.id}
              type={getInputTypeFromFieldType(fieldConfig.fieldType)}
              value={dynamicFieldValues[fieldConfig.id] || ''}
              onChange={handleDynamicFieldChange}
              className={`${styles.formInput} ${fieldErrors[fieldConfig.id] ? styles.inputError : ''}`}
              placeholder={fieldConfig.placeholder || ''}
              maxLength={fieldConfig.maxLength}
              required={fieldConfig.isRequired}
            />
            {fieldErrors[fieldConfig.id] && (
              <span className={styles.fieldError}>{fieldErrors[fieldConfig.id]}</span>
            )}
            {fieldConfig.helpText && (
              <span className={styles.fieldHelper}>{fieldConfig.helpText}</span>
            )}
          </div>
        );
      case FieldType.SELECT:
        return (
          <div className={styles.formGroup} key={fieldConfig.id}>
            <label htmlFor={fieldConfig.id} className={styles.formLabel}>
              {fieldConfig.label} {fieldConfig.isRequired && <span className={styles.requiredMark}>*</span>}
            </label>
            <select
              id={fieldConfig.id}
              name={fieldConfig.id}
              value={dynamicFieldValues[fieldConfig.id] || ''}
              onChange={handleDynamicFieldChange}
              className={`${styles.formSelect} ${fieldErrors[fieldConfig.id] ? styles.inputError : ''}`}
              required={fieldConfig.isRequired}
            >
              <option value="">Selecione uma opção</option>
              {fieldConfig.fieldOptions &&
                fieldConfig.fieldOptions.split(',').map((option, index) => (
                  <option key={`${fieldConfig.id}-opt-${index}`} value={option.trim()}>
                    {option.trim()}
                  </option>
                ))
              }
            </select>
            {fieldErrors[fieldConfig.id] && (
              <span className={styles.fieldError}>{fieldErrors[fieldConfig.id]}</span>
            )}
            {fieldConfig.helpText && (
              <span className={styles.fieldHelper}>{fieldConfig.helpText}</span>
            )}
          </div>
        );
      case FieldType.CHECKBOX:
        return (
          <div className={styles.formGroup} key={fieldConfig.id}>
            <div className={styles.checkboxField}>
              <input
                id={fieldConfig.id}
                name={fieldConfig.id}
                type="checkbox"
                checked={dynamicFieldValues[fieldConfig.id] === 'true'}
                onChange={(e) => handleDynamicFieldChange({
                  target: {
                    name: fieldConfig.id,
                    value: e.target.checked ? 'true' : 'false'
                  }
                })}
                className={`${styles.formCheckbox} ${fieldErrors[fieldConfig.id] ? styles.inputError : ''}`}
                required={fieldConfig.isRequired}
              />
              <label htmlFor={fieldConfig.id} className={styles.checkboxLabel}>
                {fieldConfig.label} {fieldConfig.isRequired && <span className={styles.requiredMark}>*</span>}
              </label>
            </div>
            {fieldErrors[fieldConfig.id] && (
              <span className={styles.fieldError}>{fieldErrors[fieldConfig.id]}</span>
            )}
            {fieldConfig.helpText && (
              <span className={styles.fieldHelper}>{fieldConfig.helpText}</span>
            )}
          </div>
        );
      case FieldType.RADIO:
        return (
          <div className={styles.formGroup} key={fieldConfig.id}>
            <fieldset className={styles.radioGroup}>
              <legend className={styles.formLabel}>
                {fieldConfig.label} {fieldConfig.isRequired && <span className={styles.requiredMark}>*</span>}
              </legend>
              {fieldConfig.fieldOptions &&
                fieldConfig.fieldOptions.split(',').map((option, index) => (
                  <div key={`${fieldConfig.id}-opt-${index}`} className={styles.radioOption}>
                    <input
                      id={`${fieldConfig.id}-opt-${index}`}
                      name={fieldConfig.id}
                      type="radio"
                      value={option.trim()}
                      checked={dynamicFieldValues[fieldConfig.id] === option.trim()}
                      onChange={handleDynamicFieldChange}
                      className={styles.formRadio}
                      required={fieldConfig.isRequired && index === 0}
                    />
                    <label htmlFor={`${fieldConfig.id}-opt-${index}`} className={styles.radioLabel}>
                      {option.trim()}
                    </label>
                  </div>
                ))
              }
            </fieldset>
            {fieldErrors[fieldConfig.id] && (
              <span className={styles.fieldError}>{fieldErrors[fieldConfig.id]}</span>
            )}
            {fieldConfig.helpText && (
              <span className={styles.fieldHelper}>{fieldConfig.helpText}</span>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderFileUploadField = () => {
    if (!hasFileField) return null;

    return (
      <div className={`${styles.formGroup} ${styles.fileUploadGroup}`}>
        <label className={styles.formLabel}>
          {fileFieldConfig?.label || "Arquivo PDF"} {fileFieldConfig?.isRequired && <span className={styles.requiredMark}>*</span>}
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

        {fileFieldConfig?.helpText ? (
          <div className={styles.fileRequirements}>
            <FaInfoCircle className={styles.infoIcon} />
            <span>{fileFieldConfig.helpText}</span>
          </div>
        ) : (
          <div className={styles.fileRequirements}>
            <FaInfoCircle className={styles.infoIcon} />
            <span>O arquivo deve estar em formato PDF e não exceder 10MB</span>
          </div>
        )}
      </div>
    );
  };

  const renderKeywordsField = () => {
    // Não renderizar o campo se max não estiver definido
    if (!keywords.max) return null;

    // Texto de ajuda baseado nas regras
    let helperText = '';

    if (keywords.min === keywords.max) {
      helperText = `Informe exatamente ${keywords.min} palavra${keywords.min === 1 ? '-chave' : 's-chave'} separadas por vírgula`;
    } else if (keywords.min > 0 && keywords.max > 0) {
      helperText = `Informe de ${keywords.min} a ${keywords.max} palavra${keywords.max === 1 ? '-chave' : 's-chave'} separadas por vírgula`;
    } else if (keywords.min > 0) {
      helperText = `Informe pelo menos ${keywords.min} palavra${keywords.min === 1 ? '-chave' : 's-chave'} separadas por vírgula`;
    } else if (keywords.max > 0) {
      helperText = `Informe até ${keywords.max} palavra${keywords.max === 1 ? '-chave' : 's-chave'} separadas por vírgula`;
    }

    // Contador de palavras-chave atuais
    const keywordsCount = countKeywords(keywords.value);
    let keywordCountText = '';

    if (keywords.value.trim()) {
      keywordCountText = `${keywordsCount} palavra${keywordsCount === 1 ? '-chave' : 's-chave'} informada${keywordsCount === 1 ? '' : 's'}`;
    }

    // Verificar se está fora das regras
    const isInvalid =
      (keywords.min === keywords.max && keywordsCount !== keywords.min) ||
      (keywords.min > 0 && keywordsCount < keywords.min) ||
      (keywords.max > 0 && keywordsCount > keywords.max);

    return (
      <div className={styles.formGroup}>
        <label htmlFor="keywords" className={styles.formLabel}>
          Palavras-chave <span className={styles.requiredMark}>*</span>
        </label>
        <input
          id="keywords"
          type="text"
          value={keywords.value}
          onChange={handleKeywordsChange}
          className={`${styles.formInput} ${fieldErrors.keywords ? styles.inputError : ''}`}
          placeholder={helperText}
        />
        {fieldErrors.keywords && (
          <span className={styles.fieldError}>{fieldErrors.keywords}</span>
        )}
        <div className={styles.keywordsInfo}>
          {/* <span className={styles.fieldHelper}>{helperText}</span> */}
          {keywordCountText && (
            <span className={`${styles.keywordCount} ${isInvalid ? styles.keywordCountError : ''}`}>
              {keywordCountText}
            </span>
          )}
        </div>
        <span className={styles.fieldHelper}>Ex: inteligência artificial, machine learning, deep learning</span>
      </div>
    );
  };

  // Mostrar loading se estiver carregando ou se o conteúdo não estiver pronto
  if (isLoading || status === 'loading' || !contentReady) {
    return (
      <LoadingSpinner message="Carregando dados do formulário..." />
    );
  }

  return (
    <PageContainer>
        {/* Modal de perfil incompleto */}
        {showProfileModal && <ProfileRedirectModal />}

        <HeaderContentTitle
          eventData={{eventLogoUrl, eventName}}
          onImageLoad={() => {}}
          subtitle={eventName ? `Enviar Trabalho Científico - ${eventName}` : 'Enviar Novo Trabalho Científico'}
          fallbackTitle="Sistema de Submissão de Trabalhos Científicos"
        />

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

                {/* Lista de autores */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Autores <span className={styles.requiredMark}>*</span>
                  </label>
                  <AuthorsList
                    authors={authors}
                    onChange={handleAuthorsChange}
                    maxAuthors={maxAuthors}
                    fieldErrors={fieldErrors}
                    currentUserId={session?.user?.id}
                    brazilianStates={brazilianStates}
                    statesLoading={statesLoading}
                  />
                  {fieldErrors.authors && (
                    <span className={styles.fieldError}>{fieldErrors.authors}</span>
                  )}
                </div>

                {/* Titulo */}
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

                {/* Área temática */}
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

                {/* Tipo de Trabalho */}
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

                {/* Renderiza todos os campos dinâmicos */}
                {eventFields.map(field => renderDynamicField(field))}

                {/* Renderiza o campo de upload de arquivo somente se houver um campo do tipo FILE */}
                {renderFileUploadField()}

                {/* Renderiza o campo de palavras-chave */}
                {renderKeywordsField()}

                {/* Termos de uso e privacidade */}
                <div className={styles.termsGroup}> {/* Termos e privacidade */}
                  <p className={styles.termsNotice}>
                    Ao enviar este trabalho, você concorda com nossos
                    <a href="/terms" className={styles.termsLink}> termos de serviço</a> e
                    <a href="/privacy" className={styles.termsLink}> política de privacidade</a>.
                  </p>
                </div>

                <div className={styles.formActions}> {/* Buttons */}
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
    </PageContainer>
  );
}

export default SubmitPaperPage;