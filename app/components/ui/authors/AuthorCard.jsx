'use client';

import { FaCheck, FaLock, FaTimes, FaUserTie } from 'react-icons/fa';
import Tooltip from '../../ui/Tooltip';
import { brazilianStates } from '../../../utils/brazilianStates';
import Select from 'react-select';
import styles from './AuthorCard.module.css';

export default function AuthorCard({
  author,
  onUpdate,
  onDelete,
  isPresenter,
  onSetPresenter,
  canDelete,
  fieldErrors = {},
  isMainAuthor = false,
  isAuthorComplete = true
}) {
  const handleChange = (field, value) => {
    // Se for o autor principal, não permite mudanças
    if (isMainAuthor) return;

    onUpdate({
      ...author,
      [field]: value // Agora passamos o objeto completo do estado
    });
  };

  return (
    <div className={`${styles.authorCard} ${isPresenter ? styles.presenterCard : ''} ${isMainAuthor ? styles.mainAuthorCard : ''} ${!isAuthorComplete ? styles.incompleteAuthorCard : ''}`}>
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
        <div className={styles.inputGroup}>
          <label htmlFor={`author-${author.id}-name`} className={styles.inputLabel}>
            Nome<span className={styles.requiredMark}>*</span>
          </label>
          <input
            type="text"
            id={`author-${author.id}-name`}
            value={author.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`${styles.inputField} ${fieldErrors[`author-${author.id}-name`] ? styles.inputError : ''} ${isMainAuthor ? styles.disabledInput : ''}`}
            placeholder="Nome completo"
            disabled={isMainAuthor}
          />
          {fieldErrors[`author-${author.id}-name`] && (
            <span className={styles.errorText}>{fieldErrors[`author-${author.id}-name`]}</span>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor={`author-${author.id}-institution`} className={styles.inputLabel}>
            Instituição<span className={styles.requiredMark}>*</span>
          </label>
          <input
            type="text"
            id={`author-${author.id}-institution`}
            value={author.institution || ''}
            onChange={(e) => handleChange('institution', e.target.value)}
            className={`${styles.inputField} ${fieldErrors[`author-${author.id}-institution`] ? styles.inputError : ''} ${isMainAuthor ? styles.disabledInput : ''}`}
            placeholder="Nome da instituição"
            disabled={isMainAuthor}
          />
          {fieldErrors[`author-${author.id}-institution`] && (
            <span className={styles.errorText}>{fieldErrors[`author-${author.id}-institution`]}</span>
          )}
        </div>

        <div className={styles.inputRow}>
          <div className={styles.inputGroup}>
            <label htmlFor={`author-${author.id}-city`} className={styles.inputLabel}>
              Cidade<span className={styles.requiredMark}>*</span>
            </label>
            <input
              type="text"
              id={`author-${author.id}-city`}
              value={author.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
              className={`${styles.inputField} ${fieldErrors[`author-${author.id}-city`] ? styles.inputError : ''} ${isMainAuthor ? styles.disabledInput : ''}`}
              placeholder="Cidade"
              disabled={isMainAuthor}
            />
            {fieldErrors[`author-${author.id}-city`] && (
              <span className={styles.errorText}>{fieldErrors[`author-${author.id}-city`]}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor={`author-${author.id}-state`} className={styles.inputLabel}>
              Estado<span className={styles.requiredMark}>*</span>
            </label>
            <Select
              id={`author-${author.id}-state`}
              name={`author-${author.id}-state`}
              value={
                // Normaliza o valor para o formato esperado pelo Select
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
                // Adicionar estilos para o menu dropdown para garantir que apareça acima de outros elementos
                menu: (base) => ({
                  ...base,
                  zIndex: 9999, // Valor alto para garantir que fique acima de outros elementos
                  overflow: 'visible', // Permitir que o menu apareça fora do container pai
                  position: 'absolute', // Garantir posicionamento absoluto
                  width: '100%',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', // Sombra mais pronunciada para destacar o dropdown
                }),
                // Estilizar o container para garantir que o posicionamento relativo não interfira
                container: (base) => ({
                  ...base,
                  position: 'relative', // Garantir posicionamento relativo para o menu absoluto
                  zIndex: 3, // Valor para garantir que este elemento esteja acima dos outros campos do form
                }),
                // Garantir que os itens do menu não sejam cortados
                menuList: (base) => ({
                  ...base,
                  padding: '4px 0',
                  maxHeight: '200px', // Limitar altura do dropdown
                }),
                // Melhorar a aparência das opções
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