import React, { forwardRef } from 'react';
import styles from './Input.module.css';

/**
 * Componente de entrada de texto com suporte a validação e texto de ajuda
 */
const Input = forwardRef(({
  label,
  id,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  helpText, // Esta prop não deve ser passada para o input
  className = '',
  isLoading = false,
  isValid = false,
  ...restProps // Outras props que serão passadas para o input
}, ref) => {
  
  // Extrair helpText explicitamente de restProps para garantir que não seja passado para o input
  const { helpText: _, ...filteredProps } = restProps;
  
  // Criar objeto de props específicas para o input
  // Garantindo que helpText não seja incluído
  const inputProps = {
    ref,
    id,
    name,
    type,
    placeholder,
    value,
    onChange,
    onBlur,
    disabled,
    required,
    className: `${styles.input} ${error ? styles.error : ''} ${isValid ? styles.valid : ''} ${className}`,
    ...filteredProps
  };
  
  // Se há texto de ajuda, adiciona um atributo para acessibilidade
  if (helpText) {
    inputProps['aria-describedby'] = `${id}-helptext`;
  }
  
  return (
    <div className={styles.formGroup}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={styles.inputWrapper}>
        <input {...inputProps} />
        
        {isLoading && (
          <div className={styles.loadingIndicator}>
            <span className={styles.spinner}></span>
          </div>
        )}
        
        {isValid && !error && (
          <div className={styles.validIndicator}>✓</div>
        )}
      </div>
      
      {error && <p className={styles.errorText}>{error}</p>}
      
      {helpText && (
        <p id={`${id}-helptext`} className={styles.helpText}>
          {helpText}
        </p>
      )}
    </div>
  );
});

// Adicionar displayName para melhor depuração
Input.displayName = 'Input';

export default Input;