import React, { forwardRef, useState, useEffect } from 'react';
import styles from './Input.module.css';
import { FaCheck, FaTimes } from 'react-icons/fa';

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
  // Novo estado para verificar campos obrigatórios vazios
  const [isEmpty, setIsEmpty] = useState(value === '' || value === null || value === undefined);
  const [touched, setTouched] = useState(false);

  // Verificar se o campo está vazio
  useEffect(() => {
    setIsEmpty(value === '' || value === null || value === undefined);
  }, [value]);

  // Usar useEffect para adicionar atraso na mudança de estado e verificar campos obrigatórios
  useEffect(() => {
    // Verifica se é válido e não tem erro
    if (isValid && !error && !isEmpty) {
      setShowValidIndicator(true);
      setShowInvalidIndicator(false);
    }
    // Verifica se tem erro explícito OU se é obrigatório, está vazio e já foi tocado
    else if (error || (required && isEmpty && touched)) {
      setShowValidIndicator(false);
      setShowInvalidIndicator(true);
    }
    // Estado neutro
    else {
      setShowValidIndicator(false);
      setShowInvalidIndicator(false);
    }
  }, [isValid, error, isEmpty, required, touched]);

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

  // Gerenciar o evento de blur para marcar o campo como "tocado"
  const handleBlur = (e) => {
    setTouched(true);
    if (onBlur) {
      onBlur(e);
    }
  };

  // Determinar se o campo tem erro (explícito ou por regra de validação)
  const hasError = error || (required && isEmpty && touched);

  // Construir as classes com base nas condições
  const inputClasses = `${styles.input}
    ${leftIcon ? styles.withLeftIcon : ''}
    ${hasError ? styles.error : ''}
    ${(isValid && !isEmpty && !hasError) ? styles.valid : ''}
    ${className || ''}`.trim();

  // Preparar classes e atributos
  const wrapperClasses = `${styles.inputWrapper} ${hasError ? styles.hasError : ''}`.trim();

  // Preparar mensagem de erro - pode ser o erro explícito ou uma mensagem padrão para campos obrigatórios
  const errorMessage = error || (required && isEmpty && touched ? 'Este campo é obrigatório' : '');

  // Manter o erro no data-attribute para exibir via pseudo-elemento
  const errorAttributes = errorMessage ? { 'data-error-message': errorMessage } : {};

  const inputProps = {
    ref,
    id,
    name,
    type,
    placeholder,
    value,
    onChange,
    onBlur: handleBlur, // Usar nosso handler personalizado
    disabled,
    required,
    autoComplete,
    className: inputClasses,
    ...filteredProps
  };

  // Adicionar atributos de acessibilidade
  if (hasError) {
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
        {!isLoading && !hasError && showValidIndicator && (
          <div className={styles.validIndicator}>✓</div>
        )}
      </div>

      {/* Mostrar helpText apenas quando não houver erro */}
      {helpText && !hasError && (
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