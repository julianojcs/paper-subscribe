import React, { forwardRef, useState, useEffect } from 'react';
import styles from './Input.module.css';

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
  helpText,
  className = '',
  isLoading = false,
  isValid = false,
  autoComplete,
  leftIcon,
  ...restProps
}, ref) => {

  // Estados para controlar a visibilidade dos indicadores
  const [showValidIndicator, setShowValidIndicator] = useState(false);
  const [showInvalidIndicator, setShowInvalidIndicator] = useState(false);

  // Usar useEffect para adicionar atraso na mudança de estado
  useEffect(() => {
    if (isValid && !error) {
      setShowValidIndicator(true);
    } else {
      setShowValidIndicator(false);
    }

    if (error) {
      setShowInvalidIndicator(true);
    } else {
      setShowInvalidIndicator(false);
    }
  }, [isValid, error]);

  // Extrair helpText e leftIcon explicitamente de restProps
  // para garantir que não sejam passados para o input nativo
  const { helpText: _, leftIcon: __, ...filteredProps } = restProps;

  // Handler para limpar o campo quando clicar no X
  const handleClearInput = (event) => {
    // Prevenir a propagação do evento para não acionar outros handlers
    event.preventDefault();
    event.stopPropagation();

    if (disabled) return;

    // Criar um evento sintético para simular a mudança de input
    const syntheticEvent = {
      target: { value: '', name },
      preventDefault: () => {},
      stopPropagation: () => {}
    };

    // Chamar o onChange com o valor em branco
    if (onChange) {
      onChange(syntheticEvent);
    }

    // Opcional: focar no input após limpar
    if (ref && ref.current) {
      ref.current.focus();
    } else if (document.getElementById(id)) {
      document.getElementById(id).focus();
    }
  };

  const inputClasses = `${styles.input}
    ${leftIcon ? styles.withLeftIcon : ''}
    ${error ? styles.error : ''}
    ${isValid && !error ? styles.valid : ''}
    ${className || ''}`.trim();

  // Preparar classes e atributos
  const wrapperClasses = `${styles.inputWrapper} ${error ? styles.hasError : ''}`.trim();

  // Manter o erro no data-attribute para exibir via pseudo-elemento
  const errorAttributes = error ? { 'data-error-message': error } : {};

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
    autoComplete,
    className: inputClasses,
    ...filteredProps
  };

  // Adicionar atributos de acessibilidade
  if (error) {
    inputProps['aria-invalid'] = 'true';
    // O erro é fornecido pelo pseudo-elemento via data-attribute
  } else if (helpText) {
    // Sem erro, usar helpText para descrever o campo
    inputProps['aria-describedby'] = `${id}-helptext`;
  }

  return (
    <div className={wrapperClasses} {...errorAttributes}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && (
            <span className={styles.required}>*</span>
          )}
        </label>
      )}
      <div className={styles.inputContainer}>
        {leftIcon && (
          <div className={styles.leftIconContainer}>
            {leftIcon}
          </div>
        )}
        <input {...inputProps} />

        {/* Usar os estados para controlar a visibilidade dos indicadores */}
        {isLoading && (
          <div className={styles.loadingIndicator}>
            <span className={styles.spinner}></span>
          </div>
        )}
        {!isLoading && showInvalidIndicator && (
          <div
            className={`${styles.invalidIndicator} ${disabled ? styles.disabled : styles.clickable}`}
            onClick={!disabled ? handleClearInput : undefined}
            title={disabled ? "" : "Limpar campo"}
            aria-label={disabled ? "" : "Limpar campo"}
            role={disabled ? "" : "button"}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
              if (!disabled && (e.key === "Enter" || e.key === " ")) {
                handleClearInput(e);
              }
            }}
          >
            ✕
          </div>
        )}
        {!isLoading && !error && showValidIndicator && (
          <div className={styles.validIndicator}>✓</div>
        )}
      </div>

      {/* Mostrar helpText apenas quando não houver erro */}
      {helpText && !error && (
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