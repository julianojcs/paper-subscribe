'use client';

import { FaCheck, FaLock, FaTimes, FaUserTie } from 'react-icons/fa';
import Tooltip from '../Tooltip';
import { brazilianStates } from '../../../utils/brazilianStates';
import Select from 'react-select';
import styles from './AuthorCard.module.css';
import { formatName } from '../../../utils';

export default function AuthorCard({
  author,
  onUpdate,
  onDelete,
  isPresenter,
  onSetPresenter,
  canDelete,
  fieldErrors = {},
  isMainAuthor = false
}) {

  const isAuthorComplete = (author) => {
    return (
      author.name?.trim() &&
      author.institution?.trim() &&
      author.city?.trim() &&
      author.state
    );
  };

  const dispatchErrorTrigger = (field, value) => {
    if (isMainAuthor || field === 'state') return;

    let fieldName = '';

    switch (field) {
      case 'name':
        value = formatName(value);
        fieldName = 'Nome';
        break;
      case 'city':
        value = formatName(value);
        fieldName = 'Cidade';
        break;
      default:
        break;
    }

    // Verifica se o campo está vazio
    if (value.trim() === '') {
      // Se estiver vazio, define o erro correspondente
      fieldErrors[`author-${author.id}-${field}`] = `${fieldName} é obrigatório`;
    } else {
      // Se não estiver vazio, remove o erro
      delete fieldErrors[`author-${author.id}-${field}`];
    }
  };

  const normalizeFieldValue = (field, value) => {
    let normalizedValue = value;
    switch (field) {
      case 'name':
        normalizedValue = formatName(value);
        break;
      case 'city':
        normalizedValue = formatName(value);
        break;
      default:
        break;
    }
    return normalizedValue;
  };

  const handleBlur = (field, value) => {
    dispatchErrorTrigger(field, value);

    // Atualiza o estado do autor
    onUpdate({
      ...author,
      [field]: normalizeFieldValue(field, value)
    });
  };

  const handleChange = (field, value) => {
    // Se for o autor principal, não permite mudanças
    if (isMainAuthor) return;

    dispatchErrorTrigger(field, value);

    onUpdate({
      ...author,
      [field]: value
    });
  };

  // Determinar se o autor está completo para aplicar a classe CSS
  const isComplete = isAuthorComplete(author);

  return (
    <div
      className={`
        ${styles.authorCard}
        ${isPresenter ? styles.presenterCard : ''}
        ${isMainAuthor ? styles.mainAuthorCard : ''}
        ${!isComplete ? styles.incompleteAuthorCard : ''}
      `}
      data-incomplete={!isComplete ? 'true' : 'false'} // Adicionar atributo de dados para ajudar com CSS
    >
      <div className={styles.cardHeader}>
        <h4 className={styles.authorTitle}>
          {isMainAuthor ? (
            <>
              <FaUserTie className={styles.mainAuthorIcon} /> Autor Principal
              <Tooltip
                content="Dados vinculados ao seu perfil"
                position="top"
                arrow={true}
              >
                <span className={styles.lockedBadge}>
                  <FaLock />
                </span>
              </Tooltip>
            </>
          ) : (
            'Autor'
          )}
        </h4>
        <div className={styles.cardActions}>
          <Tooltip
            content={isPresenter ? "Autor apresentador" : "Definir como apresentador"}
            position="top"
            arrow={true}
          >
            <button
              type="button"
              onClick={() => onSetPresenter(author.id)}
              className={`${styles.presenterButton} ${isPresenter ? styles.isPresenter : ''}`}
              aria-label={isPresenter ? "Autor apresentador" : "Definir como apresentador"}
            >
              <FaCheck />
              {isPresenter
                ? <span className={styles.presenterLabel}>Apresentador</span>
                : <span className={styles.presenterLabel}>Tornar apresentador</span>
              }
            </button>
          </Tooltip>

          {canDelete && (
            <Tooltip
              content="Remover autor"
              position="top"
              arrow={true}
            >
              <button
                type="button"
                onClick={() => onDelete(author.id)}
                className={styles.deleteButton}
                aria-label="Remover autor"
              >
                <FaTimes />
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      <div className={styles.cardContent}>
        <div className={`${styles.inputRow} ${styles.row1fr}`}>
          <div className={styles.inputGroup}>
            <label htmlFor={`author-${author.id}-name`} className={styles.inputLabel}>
              {fieldErrors[`author-${author.id}-name`] ? (
                <span className={styles.errorText}>{fieldErrors[`author-${author.id}-name`]}</span>
              ) : (
                <span className={styles.inputLabelText}>Nome</span>
              )}
              <span className={styles.requiredMark}>*</span>
            </label>
            <input
              type="text"
              id={`author-${author.id}-name`}
              value={author.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={(e) => handleBlur('name', e.target.value.trim())}
              className={`${styles.inputField} ${fieldErrors[`author-${author.id}-name`] ? styles.inputError : ''} ${isMainAuthor ? styles.disabledInput : ''}`}
              placeholder="Nome completo"
              disabled={isMainAuthor}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor={`author-${author.id}-institution`} className={styles.inputLabel}>
              {fieldErrors[`author-${author.id}-institution`] ? (
                <span className={styles.errorText}>{fieldErrors[`author-${author.id}-institution`]}</span>
              ) : (
                <span className={styles.inputLabelText}>Instituição</span>
              )}
              <span className={styles.requiredMark}>*</span>
            </label>
            <input
              type="text"
              id={`author-${author.id}-institution`}
              value={author.institution || ''}
              onChange={(e) => handleChange('institution', e.target.value)}
              onBlur={(e) => handleBlur('institution', e.target.value.trim())}
              className={`${styles.inputField} ${fieldErrors[`author-${author.id}-institution`] ? styles.inputError : ''} ${isMainAuthor ? styles.disabledInput : ''}`}
              placeholder="Nome da instituição"
              disabled={isMainAuthor}
            />
          </div>
        </div>

        <div className={styles.inputRow}>
          <div className={styles.inputGroup}>
            <label htmlFor={`author-${author.id}-city`} className={styles.inputLabel}>
              {fieldErrors[`author-${author.id}-city`] ? (
                <span className={styles.errorText}>{fieldErrors[`author-${author.id}-city`]}</span>
              ) : (
                <span className={styles.inputLabelText}>Cidade</span>
              )}
              <span className={styles.requiredMark}>*</span>
            </label>
            <input
              type="text"
              id={`author-${author.id}-city`}
              value={author.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
              onBlur={(e) => handleBlur('city', e.target.value.trim())}
              className={`${styles.inputField} ${fieldErrors[`author-${author.id}-city`] ? styles.inputError : ''} ${isMainAuthor ? styles.disabledInput : ''}`}
              placeholder="Cidade"
              disabled={isMainAuthor}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor={`author-${author.id}-state`} className={styles.inputLabel}>
              Estado<span className={styles.requiredMark}>*</span>
            </label>
            <Select
              id={`author-${author.id}-state`}
              name={`author-${author.id}-state`}
              value={
                author.state && typeof author.state === 'string'
                  ? brazilianStates.find(option => option.value === author.state)
                  : author.state
              }
              onChange={(selectedOption) => handleChange('state', selectedOption)}
              className="basic-single"
              classNamePrefix="select"
              defaultValue={brazilianStates[12]}
              placeholder="Estado"
              isDisabled={isMainAuthor}
              isLoading={false}
              isClearable={false}
              isRtl={false}
              isSearchable={true}
              options={brazilianStates}
              styles={{
                // Estilos mantidos do código original...
                control: (base, state) => ({
                  ...base,
                  border: state.isFocused ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                  borderRadius: '6px',
                  boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
                  fontSize: '14px',
                  height: '34px',
                  minHeight: '34px',
                }),
                valueContainer: (base) => ({
                  ...base,
                  height: '34px',
                  padding: '0 6px',
                }),
                input: (base) => ({
                  ...base,
                  margin: '0',
                  padding: '0',
                }),
                menu: (base) => ({
                  ...base,
                  zIndex: 9999,
                  overflow: 'visible',
                  position: 'absolute',
                  width: '100%',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }),
                container: (base) => ({
                  ...base,
                  position: 'relative',
                  zIndex: 3,
                }),
                menuList: (base) => ({
                  ...base,
                  padding: '4px 0',
                  maxHeight: '200px',
                }),
                option: (base, state) => ({
                  ...base,
                  padding: '8px 12px',
                  backgroundColor: state.isFocused ? '#f0f7ff' : 'white',
                  color: state.isFocused ? '#3b82f6' : '#334155',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: state.isSelected ? '500' : 'normal',
                }),
              }}
            />
            {fieldErrors[`author-${author.id}-state`] && (
              <span className={styles.errorText}>{fieldErrors[`author-${author.id}-state`]}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}