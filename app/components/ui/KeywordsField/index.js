'use client';

import { useState, useEffect } from 'react';
import styles from './KeywordsField.module.css';

/**
 * Normaliza e verifica duplicatas em uma string de palavras-chave
 * @param {string} keywordsString - String com palavras-chave separadas por vírgula
 * @returns {Object} Objeto com palavras-chave normalizadas e informações sobre duplicatas
 */
const normalizeKeywords = (keywordsString) => {
  if (!keywordsString) return {
    normalized: '',
    uniqueCount: 0,
    hasDuplicates: false,
    duplicates: []
  };

  const keywordsArray = keywordsString
    .split(',')
    .map(k => k.trim().toLowerCase())
    .filter(k => k.length > 0);

  const uniqueKeywords = [];
  const duplicates = [];

  keywordsArray.forEach(keyword => {
    if (!uniqueKeywords.includes(keyword)) {
      uniqueKeywords.push(keyword);
    } else if (!duplicates.includes(keyword)) {
      duplicates.push(keyword);
    }
  });

  return {
    normalized: uniqueKeywords.join(', '),
    uniqueCount: uniqueKeywords.length,
    hasDuplicates: duplicates.length > 0,
    duplicates
  };
};

const KeywordsField = ({
  value = '',
  onChange,
  onBlur,
  minKeywords = 0,
  maxKeywords = 0,  // Mantendo 0 como padrão para "sem limite"
  error = null,
  setError = () => {},
  className = '',
  id = 'keywords',
  required = false
}) => {
  // Estado local para mensagens de erro temporárias
  const [localError, setLocalError] = useState(null);
  // Análise de palavras-chave para feedback visual
  const keywordsAnalysis = normalizeKeywords(value);
  const keywordsCount = keywordsAnalysis.uniqueCount;

  // Limpar erro local quando o valor muda
  useEffect(() => {
    if (localError) setLocalError(null);
  }, [value, localError]);

  // Determina o texto de ajuda baseado nas regras
  const getHelperText = () => {
    // Se maxKeywords é 0, não há restrição superior
    const hasMaxLimit = maxKeywords > 0;

    if (minKeywords === maxKeywords && minKeywords > 0) {
      return `Informe exatamente ${minKeywords} palavra${minKeywords === 1 ? '-chave' : 's-chave'} separadas por vírgula`;
    } else if (minKeywords > 0 && hasMaxLimit) {
      return `Informe de ${minKeywords} a ${maxKeywords} palavra${maxKeywords === 1 ? '-chave' : 's-chave'} separadas por vírgula`;
    } else if (minKeywords > 0) {
      return `Informe pelo menos ${minKeywords} palavra${minKeywords === 1 ? '-chave' : 's-chave'} separadas por vírgula`;
    } else if (hasMaxLimit) {
      return `Informe até ${maxKeywords} palavra${maxKeywords === 1 ? '-chave' : 's-chave'} separadas por vírgula`;
    }
    return 'Informe palavras-chave separadas por vírgula (opcional)';
  };

  // Gera o texto de contagem de palavras-chave
  const getKeywordCountText = () => {
    if (!value.trim()) return '';
    return `${keywordsCount} palavra${keywordsCount === 1 ? '-chave única' : 's-chave únicas'} informada${keywordsCount === 1 ? '' : 's'}`;
  };

  // Verifica se o número de palavras-chave é válido
  const isInvalid = (() => {
    // Se não há valor e não é obrigatório, não é inválido
    if (!value.trim() && !required) return false;

    const hasMaxLimit = maxKeywords > 0;

    return (minKeywords === maxKeywords && keywordsCount !== minKeywords && hasMaxLimit) ||
      (minKeywords > 0 && keywordsCount < minKeywords) ||
      (hasMaxLimit && keywordsCount > maxKeywords) ||
      keywordsAnalysis.hasDuplicates;
  })();

  // Mensagem para palavras duplicadas
  const getDuplicatesMessage = () => {
    if (keywordsAnalysis.hasDuplicates) {
      return `Palavras-chave duplicadas: ${keywordsAnalysis.duplicates.join(', ')}`;
    }
    return '';
  };

  // Manipulador para quando o campo perde o foco
  const handleBlur = () => {
    // Ao perder o foco, normaliza automaticamente removendo duplicatas
    if (keywordsAnalysis.hasDuplicates) {
      // Atualizar o valor sem duplicatas
      onChange(keywordsAnalysis.normalized);

      // Feedback visual temporário
      setLocalError(`Palavras duplicadas foram removidas: ${keywordsAnalysis.duplicates.join(', ')}`);

      // Remover o aviso após um tempo
      setTimeout(() => {
        setLocalError(null);
      }, 3000);
    }

    // Chamar o onBlur passado por props, se existir
    if (onBlur) onBlur();
  };

  // Verificar se o campo é realmente obrigatório com base nas regras
  const isRequired = required || minKeywords > 0;

  // Verifica se está excedendo o limite
  const isExceedingLimit = maxKeywords > 0 && keywordsCount > maxKeywords;
  const isBelowMinimum = minKeywords > 0 && keywordsCount < minKeywords;

  return (
    <div className={`${styles.formGroup} ${className}`}>
      <label htmlFor={id} className={styles.formLabel}>
        Palavras-chave {isRequired && <span className={styles.requiredMark}>*</span>}
      </label>

      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        className={`${styles.formInput} ${(error || localError || keywordsAnalysis.hasDuplicates) ? styles.inputError : ''}`}
        placeholder= {maxKeywords === 0
          ? 'Ex: inteligência artificial, machine learning, deep learning (sem duplicatas)'
          : 'Ex: inteligência artificial, machine learning, deep learning (sem duplicatas)'}
        required={isRequired}
      />

      {(error || localError) && (
        <span className={styles.fieldError}>
          {error || localError}
        </span>
      )}

      {!error && !localError && keywordsAnalysis.hasDuplicates && (
        <span className={styles.fieldError}>
          {getDuplicatesMessage()}
        </span>
      )}

      {minKeywords > 0 && value && (
        <span className={styles.infoRow}>
          <span className={`${styles.minKeywordsInfo} ${isBelowMinimum ? styles.belowMinimum : ''}`}>
            {`Mínimo: ${minKeywords} palavra${minKeywords === 1 ? '-chave' : 's-chave'}`}
          </span>
          <span className={styles.currentCount}>
            {keywordsCount}
            <span className={`${isExceedingLimit ? styles.countExceeding : ''}`}>
              {maxKeywords > 0 && (
                <span className={styles.maxCount} style={{ marginLeft: '4px' }}>
                  / {maxKeywords}
                </span>
              )}
            </span>
          </span>
        </span>
      )}

      <p className={styles.helperText}>
        {getHelperText()}
      </p>
    </div>
  );
};

export default KeywordsField;