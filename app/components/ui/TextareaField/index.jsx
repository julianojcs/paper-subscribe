'use client';

import { useState, useEffect, useRef, useId } from 'react';
import styles from './textareaField.module.css';

/**
 * Componente TextareaField avançado e customizável
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} props.id - ID opcional do campo
 * @param {string} props.name - Nome do campo para formulários
 * @param {string} props.label - Label do campo
 * @param {string} props.value - Valor atual do campo
 * @param {function} props.onChange - Função chamada quando o valor muda
 * @param {string} props.placeholder - Placeholder do campo
 * @param {string} props.helperText - Texto de ajuda
 * @param {string} props.errorMessage - Mensagem de erro
 * @param {boolean} props.required - Se o campo é obrigatório
 * @param {boolean} props.disabled - Se o campo está desabilitado
 * @param {boolean} props.readOnly - Se o campo é somente leitura
 * @param {number} props.rows - Número de linhas visíveis
 * @param {number} props.maxRows - Limite de linhas para auto-expansão
 * @param {string} props.className - Classes CSS adicionais
 * @param {string} props.countType - Tipo de contagem ('characters' ou 'words')
 * @param {number} props.maxCount - Número máximo de caracteres/palavras
 * @param {number} props.minCount - Número mínimo de caracteres/palavras
 * @param {number} props.warningThreshold - % para aviso visual (0-100)
 * @param {boolean} props.autoResize - Se deve redimensionar automaticamente
 * @param {Object} props.fieldConfig - Configuração do campo do evento
 */
export default function TextareaField({
  id,
  name,
  label,
  value = '',
  onChange,
  placeholder = '',
  helperText,
  errorMessage,
  required = false,
  disabled = false,
  readOnly = false,
  rows = 5,
  maxRows = 15,
  className = '',
  countType = 'characters',
  maxCount,
  minCount,
  warningThreshold = 90,
  autoResize = true,
  fieldConfig = null, // Para configuração baseada em eventFields
  ...rest
}) {
  // Aplicar configuração do campo de evento, se disponível
  useEffect(() => {
    if (fieldConfig) {
      // Se temos configuração de campo do evento, atualizamos as propriedades
      if (fieldConfig.minLength) setMinChars(fieldConfig.minLength);
      if (fieldConfig.maxLength) setMaxChars(fieldConfig.maxLength);
      if (fieldConfig.minWords) setMinWords(fieldConfig.minWords);
      if (fieldConfig.maxWords) setMaxWords(fieldConfig.maxWords);
      
      // Determinar tipo de contagem com base na configuração
      if (fieldConfig.maxWords || fieldConfig.minWords) {
        setCountingType('words');
      } else if (fieldConfig.maxLength || fieldConfig.minLength) {
        setCountingType('characters');
      }
    }
  }, [fieldConfig]);

  // ID único para associação de label
  const uniqueId = useId();
  const fieldId = id || `textarea-${uniqueId}`;
  const helperId = `helper-${fieldId}`;
  const counterId = `counter-${fieldId}`;
  
  // Refs para elementos DOM
  const textareaRef = useRef(null);
  
  // Estados locais
  const [currentCount, setCurrentCount] = useState(0);
  const [countColor, setCountColor] = useState('');
  const [internalValue, setInternalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [countingType, setCountingType] = useState(countType);
  const [minChars, setMinChars] = useState(minCount);
  const [maxChars, setMaxChars] = useState(maxCount);
  const [minWords, setMinWords] = useState(minCount);
  const [maxWords, setMaxWords] = useState(maxCount);
  
  // Sincronizar valor interno com valor de prop
  useEffect(() => {
    setInternalValue(value);
  }, [value]);
  
  // Verificar erro
  const hasError = !!errorMessage;
  
  // Calcular contagem de palavras/caracteres
  useEffect(() => {
    if (countingType === 'words') {
      // Contar palavras (separadas por espaços, removendo espaços extras)
      const words = internalValue.trim() ? internalValue.trim().split(/\s+/).length : 0;
      setCurrentCount(words);
    } else {
      // Contar caracteres
      setCurrentCount(internalValue.length);
    }
  }, [internalValue, countingType]);
  
  // Ajustar cor do contador com base na proximidade do limite
  useEffect(() => {
    const maxValue = countingType === 'words' ? maxWords : maxChars;
    
    if (!maxValue) {
      setCountColor('');
      return;
    }
    
    const percentage = (currentCount / maxValue) * 100;
    
    if (percentage >= 100) {
      setCountColor(styles.counterDanger);
    } else if (percentage >= warningThreshold) {
      setCountColor(styles.counterWarning);
    } else if (percentage >= warningThreshold * 0.8) {
      setCountColor(styles.counterCaution);
    } else {
      setCountColor('');
    }
  }, [currentCount, maxChars, maxWords, countingType, warningThreshold]);
  
  // Auto-resize do textarea
  useEffect(() => {
    if (autoResize && textareaRef.current) {
      // Resetar a altura para calcular o tamanho corretamente
      textareaRef.current.style.height = 'auto';
      
      // Calcular nova altura com base no conteúdo
      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = parseInt(getComputedStyle(textareaRef.current).lineHeight) || 20;
      const maxHeight = maxRows * lineHeight;
      
      // Definir a nova altura, limitada pelo máximo de linhas
      const newHeight = Math.min(scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [internalValue, autoResize, maxRows]);
  
  // Manipular mudança com validação de limite
  const handleChange = (e) => {
    const newValue = e.target.value || '';
    
    // Validar limite máximo
    let shouldBlock = false;
    
    if (countingType === 'characters' && maxChars) {
      // Não permitir caracteres além do limite
      if (newValue.length > maxChars) {
        shouldBlock = true;
      }
    } else if (countingType === 'words' && maxWords) {
      // Contar palavras na nova entrada
      const newWords = newValue.trim() ? newValue.trim().split(/\s+/).length : 0;
      
      // Permitir exclusão mesmo quando no limite
      if (newWords > maxWords && newValue.length > internalValue.length) {
        shouldBlock = true;
      }
    }
    
    if (shouldBlock) {
      // Bloquear a entrada, mas permitir exclusão
      if (newValue.length < internalValue.length) {
        setInternalValue(newValue);
        callOnChange(newValue);
      }
      
      return;
    }
    
    setInternalValue(newValue);
    callOnChange(newValue);
  };
  
  // Função para chamar onChange com evento sintético
  const callOnChange = (newValue) => {
    if (onChange) {
      const syntheticEvent = {
        target: {
          name: name || id || fieldId,
          value: newValue
        }
      };
      onChange(syntheticEvent);
    }
  };
  
  // Formatar mensagem de contador
  const formatCountMessage = () => {
    if (countingType === 'words') {
      if (maxWords && minWords) {
        return `${currentCount}/${maxWords} palavras (mín: ${minWords})`;
      } else if (maxWords) {
        return `${currentCount}/${maxWords} palavras`;
      } else if (minWords) {
        return `${currentCount} palavras (mín: ${minWords})`;
      }
      return `${currentCount} palavras`;
    } else {
      if (maxChars && minChars) {
        return `${currentCount}/${maxChars} caracteres (mín: ${minChars})`;
      } else if (maxChars) {
        return `${currentCount}/${maxChars} caracteres`;
      } else if (minChars) {
        return `${currentCount} caracteres (mín: ${minChars})`;
      }
      return `${currentCount} caracteres`;
    }
  };
  
  // Verificar se está abaixo do mínimo
  const isBelowMinimum = (countingType === 'characters' && minChars && currentCount < minChars) ||
                         (countingType === 'words' && minWords && currentCount < minWords);
  
  // Calcular porcentagem de preenchimento para barra de progresso
  const calculateProgressPercentage = () => {
    const maxValue = countingType === 'words' ? maxWords : maxChars;
    if (!maxValue) return 0;
    return Math.min(100, (currentCount / maxValue) * 100);
  };
  
  return (
    <div className={`${styles.textareaField} ${className}`}>
      {label && (
        <label htmlFor={fieldId} className={styles.label}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={styles.textareaWrapper}>
        <textarea 
          ref={textareaRef}
          id={fieldId}
          name={name || id}
          value={internalValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          rows={rows}
          aria-invalid={hasError}
          aria-describedby={`${helperText ? helperId : ''} ${counterId}`}
          className={`${styles.textarea} 
            ${hasError ? styles.error : ''} 
            ${isBelowMinimum ? styles.belowMinimum : ''}
            ${disabled ? styles.disabled : ''}
            ${readOnly ? styles.readOnly : ''}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={countingType === 'characters' && maxChars ? maxChars : undefined}
          {...rest}
        />
        
        {/* Feedback visual para limite */}
        {(maxChars || maxWords) && (
          <div 
            className={styles.progressContainer} 
            role="presentation" 
            aria-hidden="true"
          >
            <div 
              className={`${styles.progressBar} ${countColor}`} 
              style={{width: `${calculateProgressPercentage()}%`}} 
            />
          </div>
        )}
      </div>
      
      <div className={styles.textareaFooter}>
        {/* Mensagem de erro ou texto de ajuda */}
        <div className={styles.textHelperContainer}>
          {hasError ? (
            <p className={styles.errorMessage}>{errorMessage}</p>
          ) : helperText ? (
            <p id={helperId} className={styles.helperText}>{helperText}</p>
          ) : null}
        </div>
        
        {/* Contador de caracteres/palavras */}
        {(countingType === 'characters' || countingType === 'words') && (
          <p 
            id={counterId} 
            className={`${styles.counter} ${countColor} ${isBelowMinimum ? styles.counterBelowMin : ''}`}
            aria-live="polite"
          >
            {formatCountMessage()}
          </p>
        )}
      </div>
    </div>
  );
}