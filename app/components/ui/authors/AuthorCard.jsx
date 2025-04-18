'use client';

import { FaCheck, FaLock, FaTimes, FaUserTie } from 'react-icons/fa'; // Adicionei FaLock para indicar campos bloqueados
import { brazilianStates } from '../../../utils/brazilianStates';
import StateSelect from '../../ui/StateSelect';
import styles from './AuthorCard.module.css';

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
  const handleChange = (field, value) => {
    // Se for o autor principal, não permite mudanças
    if (isMainAuthor) return;
    
    onUpdate({
      ...author,
      [field]: value
    });
  };

  return (
    <div className={`${styles.authorCard} ${isPresenter ? styles.presenterCard : ''} ${isMainAuthor ? styles.mainAuthorCard : ''}`}>
      <div className={styles.cardHeader}>
        <h4 className={styles.authorTitle}>
          {isMainAuthor ? (
            <>
              <FaUserTie className={styles.mainAuthorIcon} /> Autor Principal
              <span className={styles.lockedBadge} title="Dados vinculados ao seu perfil">
                <FaLock /> Bloqueado
              </span>
            </>
          ) : (
            'Autor'
          )}
        </h4>
        <div className={styles.cardActions}>
          <button
            type="button"
            onClick={() => onSetPresenter(author.id)}
            className={`${styles.presenterButton} ${isPresenter ? styles.isPresenter : ''}`}
            title={isPresenter ? "Autor apresentador" : "Definir como apresentador"}
            aria-label={isPresenter ? "Autor apresentador" : "Definir como apresentador"}
          >
            <FaCheck />
            {isPresenter && <span className={styles.presenterLabel}>Apresentador</span>}
          </button>
          
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(author.id)}
              className={styles.deleteButton}
              title="Remover autor"
              aria-label="Remover autor"
            >
              <FaTimes />
            </button>
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
            <StateSelect
              id={`author-${author.id}-state`}
              name={`author-${author.id}-state`}
              value={author.state || null}
              onChange={(e) => handleChange('state', e.target.value)}
              states={brazilianStates}
              placeholder="Estado"
              listboxPosition="right"
              textDisplay="ellipsis"
              showUF={true}
              disabled={isMainAuthor}
              classNames={{
                combobox: `${styles.stateCombobox} ${isMainAuthor ? styles.disabledInput : ''}`
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