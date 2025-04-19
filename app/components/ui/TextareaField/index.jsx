import React, { useRef, useEffect, useState } from 'react';
import styles from './TextareaField.module.css';

export default function TextareaField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  helperText,
  errorMessage,
  required = false,
  rows = 4,
  maxRows = 8,
  autoResize = false,
  fieldConfig,
  // Props personalizadas que não devem ir para o elemento DOM textarea
  maxWords,
  minWords,
  maxCount,
  minCount,
  showWordCount = false,
  ...props
}) {
  const textareaRef = useRef(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [progressBarStyle, setProgressBarStyle] = useState({});
  const fieldId = id || Math.random().toString(36).substring(2, 9);

  // Efeito para calcular contagens quando o valor muda
  useEffect(() => {
    if (value) {
      // Contar palavras
      const words = value.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
      
      // Contar caracteres
      setCharCount(value.length);
    } else {
      setWordCount(0);
      setCharCount(0);
    }
  }, [value]);

  // Calcular progresso e atualizar estilo da barra
  useEffect(() => {
    if (!value) {
      setProgressBarStyle({
        width: '0%',
        backgroundColor: '#e0e0e0' // Cinza neutro quando está vazio
      });
      return;
    }
    
    // Verificar se está abaixo do mínimo
    if ((minWords && wordCount < minWords) || (minCount && charCount < minCount)) {
      setProgressBarStyle({
        width: '100%',
        backgroundColor: '#e53935' // Vermelho quando abaixo do mínimo
      });
      return;
    }
    
    // Calcular porcentagem baseada no máximo
    let percentage = 0;
    if (maxCount && charCount > 0) {
      percentage = (charCount / maxCount) * 100;
    } else if (maxWords && wordCount > 0) {
      percentage = (wordCount / maxWords) * 100;
    }
    
    // Limitar a 100%
    percentage = Math.min(percentage, 100);
    
    // Definir cor baseada na porcentagem
    let color;
    if (percentage > 90) {
      // Gradiente de laranja para vermelho
      color = percentage >= 100 ? '#e53935' : `rgba(255, ${Math.floor(255 - (percentage - 90) * 25.5)}, 0)`;
    } else if (percentage > 75) {
      // Gradiente de amarelo para laranja
      color = `rgba(255, ${Math.floor(255 - (percentage - 75) * 17)}, 0)`;
    } else if (percentage > 50) {
      // Gradiente de verde-amarelado para amarelo
      color = `rgba(${Math.floor(128 + percentage)}, 200, 0)`;
    } else {
      // Gradiente de verde para verde-amarelado
      color = `rgba(${Math.floor(76 + percentage * 1.5)}, 175, 80)`;
    }
    
    setProgressBarStyle({
      width: `${percentage}%`,
      backgroundColor: color
    });
    
  }, [charCount, wordCount, maxCount, maxWords, minCount, minWords, value]);

  // Função para redimensionar o textarea
  useEffect(() => {
    const adjustHeight = () => {
      if (!textareaRef.current || !autoResize) return;
      
      textareaRef.current.style.height = 'auto';
      
      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = parseInt(getComputedStyle(textareaRef.current).lineHeight);
      const minHeight = rows * lineHeight;
      const maxHeight = maxRows * lineHeight;
      
      textareaRef.current.style.height = Math.min(Math.max(scrollHeight, minHeight), maxHeight) + 'px';
    };
    
    adjustHeight();
  }, [value, autoResize, rows, maxRows]);

  const handleChange = (e) => {
    onChange(e);
  };

  // Verificar se estamos excedendo limites para destacar visualmente
  const isExceedingLimit = (maxWords && wordCount > maxWords) || (maxCount && charCount > maxCount);
  const isBelowMinimum = (minWords && wordCount < minWords) || (minCount && charCount < minCount);

  
  return (
    <div className={styles.textareaField}>
      {label && (
        <label htmlFor={fieldId} className={styles.label}>
          {label} {required && <span className={styles.requiredMark}>*</span>}
        </label>
      )}
      
      <div className={styles.textareaWrapper}>
        <textarea 
          ref={textareaRef}
          id={fieldId}
          name={name || id}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`${styles.textarea} ${errorMessage ? styles.error : ''}`}
          rows={rows}
          required={required}
          maxLength={maxCount} // Apenas este é um atributo HTML válido
          {...props} // Espalhar outras props válidas de HTML
        />
        
        {/* Barra de progresso usando classes CSS */}
        <div style={{
          height: '4px',
          backgroundColor: '#e0e0e0',
          borderRadius: '0 0 4px 4px',
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
          marginTop: '-1px'
        }}>
          <div 
            className={styles.progressBar}
            style={{
              width: progressBarStyle.width || '0%',
              backgroundColor: progressBarStyle.backgroundColor || '#4caf50'
            }}
          />
        </div>
      </div>
      
      {errorMessage && (
        <div className={styles.errorMessage}>{errorMessage}</div>
      )}
      
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.2rem',
          fontSize: '0.875rem',
          color: '#666'
        }}>
          {/* Helper text à esquerda */}
          {helperText && (
            <span className={styles.helperText}>{helperText}</span>
          )}
          
          {/* Contador à direita */}
          {(maxCount || maxWords || showWordCount) && (
            <div className={`${styles.counterContainer} ${isExceedingLimit ? styles.countExceeding : ''}`}>
              <span className={styles.currentCount}>
                {maxWords ? `${wordCount} palavra${wordCount === 1 ? '' : 's'}` : `${charCount} caractere${charCount === 1 ? '' : 's'}`}
              </span>
              {(maxCount || maxWords) && (
                <span className={styles.maxCount} style={{ marginLeft: '4px' }}>
                  / {maxWords ? `${maxWords}` : `${maxCount}`}
                </span>
              )}
            </div>
          )}
        </div>

      
      {/* Mostrar informações sobre mínimo se definido */}
      {((minWords && maxWords) || (minCount && maxCount)) && value && (
        <div className={`${styles.minCountInfo} ${isBelowMinimum ? styles.belowMinimum : ''}`}>
          {minWords ? `Mínimo: ${minWords} palavra${minWords === 1 ? '' : 's'}` : 
           minCount ? `Mínimo: ${minCount} caractere${minCount === 1 ? '' : 's'}` : ''}
        </div>
      )}
      
      {/* Mostrar contagem secundária se ambos maxWords e maxCount estiverem definidos */}
      {maxWords && maxCount && value && (
        <div className={styles.secondaryCounter}>
          {`${charCount} caractere${charCount === 1 ? '' : 's'} / Máximo: ${maxCount}`}
        </div>
      )}
    </div>
  );
}