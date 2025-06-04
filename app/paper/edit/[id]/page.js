'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  FaExclamationTriangle,
  FaFileAlt,
  FaUpload,
  FaSpinner,
  FaSave,
  FaInfoCircle,
  FaBuilding,
  FaArrowLeft
} from 'react-icons/fa';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import TextareaField from '../../../components/ui/TextareaField';
import TrashIcon from '../../../components/ui/TrashIcon';
import AuthorsList from '../../../components/ui/Authors/AuthorsList';
import KeywordsField from '../../../components/ui/KeywordsField';
import useBrazilianStates from '../../../hooks/useBrazilianStates';
import { FieldType, getInputTypeFromFieldType } from '../../../utils/fieldTypes';
import { useDataContext } from '../../../../context/DataContext';
import styles from './edit.module.css';

export default function EditPaperPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = params;
  const { data: session, status } = useSession();
  const { eventData } = useDataContext();

  // Verificar se está em modo admin
  const adminMode = searchParams.get('adminMode') === 'true';
  const [isAdmin, setIsAdmin] = useState(false);

  // Refs
  const fileInputRef = useRef(null);

  // Estados para o formulário
  const [paper, setPaper] = useState(null);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState([]);
  const [keywords, setKeywords] = useState({
    value: '',
    min: 0,
    max: 0
  });
  const [file, setFile] = useState(null);
  const [eventId, setEventId] = useState('');
  const [eventName, setEventName] = useState('');
  const [areaId, setAreaId] = useState('');
  const [paperTypeId, setPaperTypeId] = useState('');
  const [areas, setAreas] = useState([]);
  const [paperTypes, setPaperTypes] = useState([]);
  const [dynamicFieldValues, setDynamicFieldValues] = useState({});
  const [eventFields, setEventFields] = useState([]);
  const [maxAuthors, setMaxAuthors] = useState(10);
  const [hasFileField, setHasFileField] = useState(false);
  const [fileFieldConfig, setFileFieldConfig] = useState(null);
  const [abstract, setAbstract] = useState('');
  const [abstractField, setAbstractField] = useState(null);

  // Estados para controle de UI
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [fileChanged, setFileChanged] = useState(false);
  const [formChanged, setFormChanged] = useState(false);

  const { states: brazilianStates, isLoading: statesLoading } = useBrazilianStates();

  // Verificar se o usuário é admin ou manager
  useEffect(() => {
    if (session?.user) {
      const userIsAdmin = ['ADMIN', 'MANAGER'].includes(session.user.role);
      setIsAdmin(userIsAdmin);
    }
  }, [session]);

  // Verificar se os dados foram alterados
  useEffect(() => {
    if (paper) {
      // Construir uma representação de string do estado atual dos autores
      const currentAuthorsStr = JSON.stringify(authors);
      // Construir uma representação de string dos autores originais do paper
      const originalAuthorsStr = JSON.stringify(paper.authors || []);

      const keywordsChanged = keywords.value !== (paper.keywords || '');
      const titleChanged = title !== (paper.title || '');
      const authorsChanged = currentAuthorsStr !== originalAuthorsStr;
      const areaChanged = areaId !== (paper.area?.id || '');
      const paperTypeChanged = paperTypeId !== (paper.paperType?.id || '');

      // Verificar se o abstract mudou (agora pode estar em um campo dinâmico)
      let abstractChanged = false;
      if (abstractField) {
        const abstractValue = dynamicFieldValues[abstractField.id] || '';
        abstractChanged = abstractValue !== (abstractField.originalValue || '');
      } else {
        abstractChanged = abstract !== (paper.abstract || '');
      }

      // Verificar se algum campo dinâmico foi alterado
      let dynamicFieldsChanged = false;
      const paperFieldValues = paper.fieldValues || [];

      for (const fieldId in dynamicFieldValues) {
        // Ignorar o campo de abstract que já foi verificado
        if (abstractField && fieldId === abstractField.id) continue;

        const fieldValue = paperFieldValues.find(fv => fv.fieldId === fieldId);
        if (!fieldValue && dynamicFieldValues[fieldId]) {
          dynamicFieldsChanged = true;
          break;
        }
        if (fieldValue && fieldValue.value !== dynamicFieldValues[fieldId]) {
          dynamicFieldsChanged = true;
          break;
        }
      }

      setFormChanged(
        titleChanged ||
        authorsChanged ||
        keywordsChanged ||
        areaChanged ||
        paperTypeChanged ||
        abstractChanged ||
        fileChanged ||
        dynamicFieldsChanged
      );
    }
  }, [title, authors, keywords, areaId, paperTypeId, abstract, fileChanged, paper, dynamicFieldValues, abstractField]);

  // Função para processar campos do evento
  const processEventFields = useCallback((fields) => {
    if (!Array.isArray(fields)) return;

    // Verificar se existe um campo do tipo FILE
    const fileField = fields.find(field =>
      field.fieldType === FieldType.FILE
    );

    if (fileField) {
      setHasFileField(true);
      setFileFieldConfig(fileField);
    }

    // Identificar o campo de abstract (resumo)
    const abstractField = fields.find(field =>
      field.fieldType === FieldType.TEXTAREA &&
      (field.label.toLowerCase().includes('resumo') ||
        field.label.toLowerCase().includes('abstract'))
    );

    if (abstractField) {
      setAbstractField(abstractField);
    }

    // Filtrar e ordenar campos dinâmicos (excluindo o abstract)
    const formFields = fields
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
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        return a.label.localeCompare(b.label);
      });

    setEventFields(formFields);
  }, []);

  const countKeywords = useCallback((keywordsString) => {
    if (!keywordsString || typeof keywordsString !== 'string') return 0;
    // Remove espaços extras e divide por vírgulas
    return keywordsString
      .trim()
      .split(',')
      .filter(keyword => keyword.trim().length > 0)
      .length;
  }, []);

  const fetchEventData = useCallback(async (eventId) => {
    try {
      // Primeiro, verifica se já temos os dados do evento no contexto
      if (eventData && eventData.id === eventId) {
        console.log('Usando dados do evento do contexto global');

        const event = eventData;
        setEventName(event.name || 'Evento');

        if (event.maxAuthors) {
          setMaxAuthors(event.maxAuthors);
        }

        // Atualizar limites de keywords do evento
        setKeywords(prev => ({
          ...prev,
          min: event.minKeywords || 0,
          max: event.maxKeywords || 0
        }));

        // Ordenar áreas por sortOrder e depois alfabeticamente
        if (event.areas && event.areas.length > 0) {
          const sortedAreas = [...event.areas].sort((a, b) => {
            if (a.sortOrder !== b.sortOrder) {
              return a.sortOrder - b.sortOrder;
            }
            return a.name.localeCompare(b.name);
          });
          setAreas(sortedAreas);
        }

        // Ordenar tipos de paper por sortOrder e depois alfabeticamente
        if (event.paperTypes && event.paperTypes.length > 0) {
          const sortedPaperTypes = [...event.paperTypes].sort((a, b) => {
            if (a.sortOrder !== b.sortOrder) {
              return a.sortOrder - b.sortOrder;
            }
            return a.name.localeCompare(b.name);
          });
          setPaperTypes(sortedPaperTypes);
        }

        // Processar campos do evento
        processEventFields(event.eventFields || []);
        return;
      }

      // Se não temos no contexto, buscar da API
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) throw new Error('Falha ao carregar detalhes do evento');

      const data = await response.json();
      const event = data.event;

      if (event) {
        setEventName(event.name || 'Evento');

        if (event.maxAuthors) {
          setMaxAuthors(event.maxAuthors);
        }

        // Atualizar limites de keywords do evento
        setKeywords(prev => ({
          ...prev,
          min: event.minKeywords || 0,
          max: event.maxKeywords || 0
        }));

        // Ordenar áreas por sortOrder e depois alfabeticamente
        if (event.areas && event.areas.length > 0) {
          const sortedAreas = [...event.areas].sort((a, b) => {
            if (a.sortOrder !== b.sortOrder) {
              return a.sortOrder - b.sortOrder;
            }
            return a.name.localeCompare(b.name);
          });
          setAreas(sortedAreas);
        }

        // Ordenar tipos de paper por sortOrder e depois alfabeticamente
        if (event.paperTypes && event.paperTypes.length > 0) {
          const sortedPaperTypes = [...event.paperTypes].sort((a, b) => {
            if (a.sortOrder !== b.sortOrder) {
              return a.sortOrder - b.sortOrder;
            }
            return a.name.localeCompare(b.name);
          });
          setPaperTypes(sortedPaperTypes);
        }

        // Processar campos do evento
        if (event.eventFields) {
          processEventFields(event.eventFields);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar detalhes do evento:', err);
      setError('Não foi possível carregar os detalhes do evento. Por favor, tente novamente mais tarde.');
    }
  }, [eventData, processEventFields]);

  const fetchPaperData = useCallback(async () => {
    try {
      setLoading(true);

      // Adicionar query parameter para indicar acesso administrativo
      const adminQueryParam = isAdmin && adminMode ? '&adminAccess=true' : '';

      const response = await fetch(
        `/api/paper/${id}?includeEvent=true&includeAuthors=true&includeFieldValues=true${adminQueryParam}`
      );

      if (!response.ok) {
        throw new Error(response.status === 404
          ? 'Trabalho não encontrado'
          : 'Erro ao carregar trabalho');
      }

      const data = await response.json();
      setPaper(data.paper);
      console.log('Paper carregado:', data.paper);

      // Preencher o formulário com os dados do paper
      setTitle(data.paper.title || '');
      setAbstract(data.paper.abstract || '');
      setKeywords(prev => ({
        ...prev,
        value: data.paper.keywords || ''
      }));

      // Definir IDs de relacionamento
      if (data.paper.event) {
        setEventId(data.paper.event.id);
        await fetchEventData(data.paper.event.id);
      }

      if (data.paper.area) {
        setAreaId(data.paper.area.id || '');
      }

      if (data.paper.paperType) {
        setPaperTypeId(data.paper.paperType.id || '');
      }

      // Tratar autores
      if (Array.isArray(data.paper.authors)) {
        // Mapear os autores para o formato esperado pelo componente AuthorsList
        const mappedAuthors = data.paper.authors.map(author => {
          return {
            userId: author.userId || null,
            name: author.name,
            institution: author.institution,
            city: author.city,
            state: author.stateId ? {
              value: author.stateId,
              label: brazilianStates.find(option => option.id === author?.stateId)?.name
            } : null,
            isMainAuthor: author.isMainAuthor || false,
            isPresenter: author.isPresenter || false,
            authorOrder: author.authorOrder || 0
          };
        });

        // Ordenar por authorOrder
        mappedAuthors.sort((a, b) => a.authorOrder - b.authorOrder);
        setAuthors(mappedAuthors);
      } else {
        // Se não for um array, criar um autor padrão
        setAuthors([{
          userId: session?.user?.id,
          name: session?.user?.name || "",
          institution: "",
          city: "",
          state: null,
          isMainAuthor: true,
          isPresenter: true,
          authorOrder: 0
        }]);
      }

      // Inicializar valores para os campos dinâmicos
      if (data.paper.fieldValues && data.paper.fieldValues.length > 0) {
        const initialValues = {};

        data.paper.fieldValues.forEach(field => {
          // Armazenar o valor original para comparação posterior
          initialValues[field.fieldId] = field.value || '';

          // Se for o campo de resumo, configurar o estado do abstract
          if (field.field &&
             (field.field.label.toLowerCase().includes('resumo') ||
              field.field.label.toLowerCase().includes('abstract'))) {

            setAbstractField({
              ...field.field,
              id: field.fieldId,
              originalValue: field.value || ''
            });
          }
        });

        setDynamicFieldValues(initialValues);
      }

      setError(null);
    } catch (err) {
      console.error('Erro ao carregar dados do trabalho:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, isAdmin, adminMode, fetchEventData, session?.user?.id, session?.user?.name, brazilianStates]);

  useEffect(() => {
    if (status === 'authenticated' && id) {
      fetchPaperData();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [id, status, fetchPaperData, router]);

  // Manipuladores de eventos

  const triggerFileInput = useCallback((e) => {
    if (e.target.closest(`.${styles.removeFileButton}`)) {
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setFieldErrors((prev) => ({ ...prev, file: 'Apenas arquivos PDF são permitidos' }));
        return;
      }

      // Verificar tamanho máximo configurado ou padrão 10MB
      const maxSizeMB = fileFieldConfig?.maxFileSize || 10;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;

      if (selectedFile.size > maxSizeBytes) {
        setFieldErrors((prev) => ({ ...prev, file: `O arquivo não pode exceder ${maxSizeMB}MB` }));
        return;
      }

      setFile(selectedFile);
      setFileChanged(true);
      setFieldErrors((prev) => ({ ...prev, file: null }));
    }
  }, [fileFieldConfig]);

  const handleRemoveFile = useCallback((e) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFileChanged(true);
  }, []);

  const handleAuthorsChange = useCallback((updatedAuthors) => {
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
      } else {
        // Se não encontrar o autor logado, marcar o primeiro autor como apresentador
        authorsWithOrder[0].isPresenter = true;
      }
    }

    setAuthors(authorsWithOrder);
    setFieldErrors((prev) => ({ ...prev, authors: null }));
  }, [session?.user?.id]);

  const handleAreaChange = useCallback((e) => {
    setAreaId(e.target.value);
    setFieldErrors((prev) => ({ ...prev, area: null }));
  }, []);

  const getAreaDescription = useCallback((areaId) => {
    const selectedArea = areas.find(area => area.id === areaId);
    return selectedArea?.description || null;
  }, [areas]);

  const handlePaperTypeChange = useCallback((e) => {
    setPaperTypeId(e.target.value);
    setFieldErrors((prev) => ({ ...prev, paperType: null }));
  }, []);

  const getPaperTypeDescription = useCallback((paperTypeId) => {
    const selectedType = paperTypes.find(type => type.id === paperTypeId);
    return selectedType?.description || null;
  }, [paperTypes]);

  const handleDynamicFieldChange = useCallback((e) => {
    const { name, value } = e.target;
    setDynamicFieldValues(prev => ({
      ...prev,
      [name]: value
    }));
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
  }, []);

  const handleKeywordsChange = (newValue) => {
    setKeywords(prev => ({
      ...prev,
      value: newValue
    }));
    setFieldErrors(prev => ({ ...prev, keywords: null }));
  };

  const handleAbstractChange = useCallback((e) => {
    setAbstract(e.target.value);
    setFieldErrors((prev) => ({ ...prev, abstract: null }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formChanged) {
      return;
    }

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

    if (areas.length > 0 && !areaId) {
      errors.area = 'Selecione uma área temática';
    }

    if (paperTypes.length > 0 && !paperTypeId) {
      errors.paperType = 'Selecione um tipo de trabalho';
    }

    // Validação do abstract
    if (abstractField) {
      const abstractValue = dynamicFieldValues[abstractField.id]?.trim() || '';
      if (abstractField.isRequired && !abstractValue) {
        errors[abstractField.id] = `${abstractField.label} é obrigatório`;
      } else if (abstractValue) {
        if (abstractField.minLength && abstractValue.length < abstractField.minLength) {
          errors[abstractField.id] = `${abstractField.label} deve ter pelo menos ${abstractField.minLength} caracteres`;
        }
        if (abstractField.maxLength && abstractValue.length > abstractField.maxLength) {
          errors[abstractField.id] = `${abstractField.label} deve ter no máximo ${abstractField.maxLength} caracteres`;
        }
        if (abstractField.minWords) {
          const wordCount = abstractValue.split(/\s+/).filter(w => w.trim().length > 0).length;
          if (wordCount < abstractField.minWords) {
            errors[abstractField.id] = `${abstractField.label} deve ter pelo menos ${abstractField.minWords} palavra${abstractField.minWords === 1 ? '' : 's'}`;
          }
        }
        if (abstractField.maxWords) {
          const wordCount = abstractValue.split(/\s+/).filter(w => w.trim().length > 0).length;
          if (wordCount > abstractField.maxWords) {
            errors[abstractField.id] = `${abstractField.label} deve ter no máximo ${abstractField.maxWords} palavra${abstractField.maxWords === 1 ? '' : 's'}`;
          }
        }
      }
    } else if (!abstract.trim() && !errors.abstract) {
      errors.abstract = 'Resumo é obrigatório';
    }

    // Validação para campos dinâmicos (excluindo o abstract que já foi validado)
    eventFields.forEach(field => {
      // Ignorar o campo de abstract que já foi validado
      if (abstractField && field.id === abstractField.id) return;

      const value = dynamicFieldValues[field.id]?.trim() || '';

      if (field.isRequired && !value) {
        errors[field.id] = `${field.label} é obrigatório`;
        return;
      }

      if (!value) return;

      if (field.minLength && value.length < field.minLength) {
        errors[field.id] = `${field.label} deve ter pelo menos ${field.minLength} caracteres`;
        return;
      }

      if (field.maxLength && value.length > field.maxLength) {
        errors[field.id] = `${field.label} deve ter no máximo ${field.maxLength} caracteres`;
        return;
      }

      if (field.minWords) {
        const wordCount = value.split(/\s+/).filter(w => w.trim().length > 0).length;
        if (wordCount < field.minWords) {
          errors[field.id] = `${field.label} deve ter pelo menos ${field.minWords} palavra${field.minWords === 1 ? '' : 's'}`;
          return;
        }
      }

      if (field.maxWords) {
        const wordCount = value.split(/\s+/).filter(w => w.trim().length > 0).length;
        if (wordCount > field.maxWords) {
          errors[field.id] = `${field.label} deve ter no máximo ${field.maxWords} palavra${field.maxWords === 1 ? '' : 's'}`;
          return;
        }
      }
    });

    // Validação de autores
    let hasPresenter = false;
    let hasEmptyFields = false;

    authors.forEach(author => {
      if (author.isPresenter) hasPresenter = true;

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

      if (emptyFields.length > 0) {
        hasEmptyFields = true;
        if (author.userId === session?.user?.id) {
          errors.authors = `Complete as informações do autor principal: ${emptyFields.join(', ')}`;
        }
      }
    });

    if (!hasPresenter) {
      errors.authors = errors.authors || 'É necessário definir um autor como apresentador';
    }

    if (hasEmptyFields && !errors.authors) {
      errors.authors = 'Um ou mais autores possuem informações incompletas';
    }

    // Validação de limite de autores
    if (authors.length > maxAuthors) {
      errors.authors = `Este evento permite no máximo ${maxAuthors} autor${maxAuthors === 1 ? '' : 'es'}`;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Rolar para o topo para mostrar erros
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      // Preparar os field values, incluindo o abstract se for um campo dinâmico
      const fieldValues = Object.keys(dynamicFieldValues)
        .filter(fieldId => dynamicFieldValues[fieldId] !== undefined && dynamicFieldValues[fieldId] !== null)
        .map(fieldId => ({
          fieldId,
          value: dynamicFieldValues[fieldId]
        }));

      // Adicionar indicação de edição admin
      const adminParam = isAdmin && adminMode ? '?adminEdit=true' : '';

      // Primeiro, atualizar os dados principais do paper via JSON
      const updateResponse = await fetch(`/api/paper/${id}${adminParam}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          // Se o abstract não for um campo dinâmico, incluí-lo diretamente
          abstract: !abstractField ? abstract : undefined,
          keywords: keywords.value,
          areaId: areaId || undefined,
          paperTypeId: paperTypeId || undefined,
          authors: authors.map(author => ({
            userId: author.userId || null,
            name: author.name,
            institution: author.institution,
            city: author.city,
            stateId: author.state?.value || author.stateId || null,
            isMainAuthor: author.isMainAuthor || false,
            isPresenter: author.isPresenter || false,
            authorOrder: author.authorOrder
          })),
          // Incluir os valores dos campos personalizados
          fieldValues: fieldValues,
          // Incluir flag para indicar edição administrativa
          adminEdit: isAdmin && adminMode
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();

        if (errorData.fieldErrors) {
          setFieldErrors(errorData.fieldErrors);
          throw new Error('Por favor, corrija os erros destacados no formulário.');
        } else {
          throw new Error(errorData.error || 'Erro ao atualizar dados do trabalho');
        }
      }

      // Se o arquivo foi alterado, fazer upload
      if (fileChanged && file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('paperId', id);

        if (fileFieldConfig) {
          formData.append('fileFieldId', fileFieldConfig.id);
        }

        const uploadResponse = await fetch('/api/paper/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Erro ao enviar arquivo');
        }
      }

      setSuccess(true);

      // Redirecionar após sucesso
      setTimeout(() => {
        if (adminMode && isAdmin) {
          router.push(`/paper/${id}?adminMode=true`);
        } else {
          router.push(`/paper/${id}`);
        }
      }, 1500);

    } catch (err) {
      console.error('Erro ao salvar trabalho:', err);
      setError(err.message);
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = useCallback(() => {
    if (adminMode && isAdmin) {
      router.push(`/paper/${id}?adminMode=true`);
    } else {
      router.push(`/paper/${id}`);
    }
  }, [router, id, adminMode, isAdmin]);

  // Funções auxiliares para formatação de texto e contagem de palavras
  const getFieldHelperText = useCallback((fieldConfig) => {
    let text = fieldConfig.helpText || '';

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
  }, []);

  const getWordCountText = useCallback((text, fieldConfig) => {
    if (!text) return '';

    const wordCount = text.trim().split(/\s+/).filter(w => w.trim().length > 0).length;
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
  }, []);

  // Renderizadores de campos

  const renderDynamicField = useCallback((fieldConfig) => {
    // Não renderizar o campo abstract aqui, ele tem uma seção própria
    if (abstractField && fieldConfig.id === abstractField.id) {
      return null;
    }

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
            className={styles.dynamicTextarea}
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
            <Select
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
            </Select>
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
  }, [abstractField, dynamicFieldValues, fieldErrors, getFieldHelperText, getWordCountText, handleDynamicFieldChange]);

  const renderAbstractField = useCallback(() => {
    if (abstractField) {
      // Renderizar o abstract como campo dinâmico
      return (
        <TextareaField
          key={abstractField.id}
          id={abstractField.id}
          name={abstractField.id}
          label={abstractField.label}
          value={dynamicFieldValues[abstractField.id] || ''}
          onChange={handleDynamicFieldChange}
          placeholder={abstractField.placeholder || ''}
          helperText={getFieldHelperText(abstractField)}
          errorMessage={fieldErrors[abstractField.id]}
          required={abstractField.isRequired}
          rows={abstractField.rows || 6}
          maxRows={abstractField.maxRows || 12}
          maxCount={abstractField.maxLength}
          minCount={abstractField.minLength}
          maxWords={abstractField.maxWords}
          minWords={abstractField.minWords}
          autoResize={true}
          showWordCount={!!abstractField.minWords || !!abstractField.maxWords}
          className={styles.abstractTextarea}
        />
      );
    } else {
      // Renderizar o campo abstract padrão
      return (
        <TextareaField
          id="abstract"
          name="abstract"
          label="Resumo"
          value={abstract}
          onChange={handleAbstractChange}
          placeholder="Resumo do trabalho"
          errorMessage={fieldErrors.abstract}
          required={true}
          rows={6}
          autoResize={true}
          className={styles.abstractTextarea}
        />
      );
    }
  }, [abstract, abstractField, dynamicFieldValues, fieldErrors, getFieldHelperText, handleAbstractChange, handleDynamicFieldChange]);

  const renderFileUploadField = useCallback(() => {
    const currentFileName = paper?.fileName;

    return (
      <div className={`${styles.formGroup} ${styles.fileUploadGroup}`}>
        <label className={styles.formLabel}>
          {fileFieldConfig?.label || "Arquivo PDF"}
          {fileFieldConfig?.isRequired && <span className={styles.requiredMark}>*</span>}
          {currentFileName && !fileChanged && (
            <span className={styles.currentFile}> (Atual: {currentFileName})</span>
          )}
        </label>

        <div
          className={`${styles.fileDropArea} ${fieldErrors.file ? styles.fileError : ''} ${(file || (!fileChanged && currentFileName)) ? styles.fileSelected : ''}`}
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
          ) : !fileChanged && currentFileName ? (
            <div className={styles.selectedFile}>
              <div className={styles.fileDetails}>
                <span className={styles.fileName}>
                  {currentFileName}
                </span>
                <span className={styles.fileInfo}>
                  (Arquivo atual)
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
                Clique para selecionar um novo arquivo PDF
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
            <span>O arquivo deve estar em formato PDF e não exceder {fileFieldConfig?.maxFileSize || 10}MB</span>
          </div>
        )}
      </div>
    );
  }, [file, fileChanged, fieldErrors.file, fileFieldConfig, paper?.fileName, triggerFileInput, handleFileChange, handleRemoveFile]);

  // Renderização condicional com base no status de carregamento

  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <FaSpinner className={styles.loadingSpinner} />
        <p>Carregando...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return <div>Redirecionando para login...</div>;
  }

  // Verificar permissões para edição administrativa
  if (adminMode && !isAdmin) {
    return (
      <div className={styles.errorContainer}>
        <FaExclamationTriangle className={styles.errorIcon} />
        <h2>Acesso Negado</h2>
        <p>Você não tem permissões para editar este trabalho como administrador.</p>
        <Button onClick={() => router.push('/paper')} variant="secondary">
          Voltar para Meus Trabalhos
        </Button>
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

  // Renderização do formulário principal
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <Button
              variant="text"
              onClick={handleCancel}
              className={styles.backButton}
            >
              <FaArrowLeft className={styles.backIcon} /> Voltar
            </Button>
            <h1 className={styles.title}>
              {adminMode && isAdmin ? 'Editar Trabalho (Modo Administrador)' : 'Editar Trabalho'}
            </h1>
          </div>
        </header>

        <div className={styles.content}>
          {success && (
            <div className={styles.successMessage}>
              <p>Trabalho atualizado com sucesso! Redirecionando...</p>
            </div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              <FaExclamationTriangle className={styles.errorIcon} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.formContainer}>
            <form onSubmit={handleSubmit} className={styles.paperForm}>
              <div className={styles.formSection}>

                {/* Evento (somente exibição) */}
                <div className={styles.infoSection}>
                  <div className={styles.infoHeader}>
                    <FaBuilding className={styles.infoIcon} />
                    <span className={styles.infoLabel}>Evento:</span>
                  </div>
                  <div className={styles.infoContent}>
                    {eventName || 'Evento não informado'}
                  </div>
                </div>
                <h2 className={styles.sectionTitle}>Informações do Trabalho</h2>

                {/* Autores */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Autores <span className={styles.requiredMark}>*</span>
                  </label>
                  <div className={styles.authorsSection}>
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
                </div>

                {/* Título do trabalho */}
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
                    value={areaId}
                    onChange={handleAreaChange}
                    options={areas}
                    placeholder="Selecione uma área temática"
                    helperText="Escolha a área temática mais adequada para o seu trabalho"
                    errorMessage={fieldErrors.area}
                    required={true}
                    getDescription={getAreaDescription}
                  />
                )}

                {/* Tipo de trabalho */}
                {paperTypes.length > 0 && (
                  <Select
                    id="paperType"
                    label="Tipo de Trabalho"
                    value={paperTypeId}
                    onChange={handlePaperTypeChange}
                    options={paperTypes}
                    placeholder="Selecione o tipo de trabalho"
                    helperText="Escolha o formato que melhor se adapta ao seu trabalho"
                    errorMessage={fieldErrors.paperType}
                    required={true}
                    getDescription={getPaperTypeDescription}
                  />
                )}

                {/* Resumo (abstract) */}
                <div className={styles.abstractSection}>
                  {renderAbstractField()}
                </div>

                {/* Campos dinâmicos */}
                {eventFields.length > 0 && (
                  <div className={styles.dynamicFieldsSection}>
                    {eventFields.map(field => renderDynamicField(field))}
                  </div>
                )}

                {/* Palavras-chave */}
                <div className={styles.keywordsSection}>
                  <KeywordsField
                    value={keywords.value}
                    onChange={handleKeywordsChange}
                    minKeywords={keywords.min}
                    maxKeywords={keywords.max}
                    error={fieldErrors.keywords}
                    setError={(error) => setFieldErrors(prev => ({ ...prev, keywords: error }))}
                    required={keywords.min > 0}
                  />
                </div>

                {/* Upload de arquivo */}
                {(hasFileField || paper?.fileUrl) && (
                  <div className={styles.fileSection}>
                    {renderFileUploadField()}
                  </div>
                )}

                {/* Botões de ação */}
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
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}