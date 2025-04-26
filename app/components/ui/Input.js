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
  ...restProps}, ref) => {

  // Estados para controlar a visibilidade dos indicadores
  const [showValidIndicator, setShowValidIndicator] = useState(false);
  const [showInvalidIndicator, setShowInvalidIndicator] = useState(false);

  // Usar useEffect para adicionar atraso na mudança de estado
  // para permitir que as transições aconteçam
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

  const inputClasses = `${styles.input}
    ${leftIcon ? styles.withLeftIcon : ''}
    ${error ? styles.error : ''}
    ${isValid && !error ? styles.valid : ''}
    ${className || ''}`;

  // Preparar classes e atributos
  const wrapperClasses = `${styles.inputWrapper} ${error ? styles.hasError : ''}`;
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
    ...restProps
  };

  // Adicionar atributo aria-describedby se houver helpText
  if (helpText) {
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
          <div className={styles.invalidIndicator}>✕</div>
        )}
        {!isLoading && !error && showValidIndicator && (
          <div className={styles.validIndicator}>✓</div>
        )}
      </div>

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