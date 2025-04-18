'use client';

import { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash, FaThumbtack, FaTimes } from 'react-icons/fa';
import usePasswordValidation from '../../hooks/usePasswordValidation';
import styles from './PasswordInput.module.css';
import Tooltip from './Tooltip';

export default function PasswordInput({
  label,
  id,
  placeholder,
  value = '', // Valor padrão vazio para evitar undefined
  onChange,
  error,
  disabled,
  showValidation = false,
  confirmPassword = null,
  minLength = 8,
  requireLowercase = true,
  requireUppercase = true,
  requireNumber = true,
  requireSpecial = true,
  onValidationChange = () => {},
  className,
  ...rest
}) {
  // Estados locais para controle de UI
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  // Novo estado para controlar fixação das mensagens
  const [isPinned, setIsPinned] = useState(false);
  
  // Usar o hook personalizado
  const validation = usePasswordValidation({
    password: value || '', // Garantir que password nunca é undefined
    confirmPassword,
    requiredLength: minLength,
    requiresLowercase: requireLowercase,
    requiresUppercase: requireUppercase,
    requiresNumber: requireNumber,
    requiresSpecial: requireSpecial
  });
  
  // Propagar alterações de validação para o componente pai
  useEffect(() => {
    onValidationChange(validation);
  }, [validation, onValidationChange]);
  
  // Handlers para foco e blur
  const handleFocus = () => {
    setFocused(true);
  };
  
  const handleBlur = () => {
    setFocused(false);
    setTouched(true);
  };
  
  // Toggle para mostrar/ocultar senha
  const togglePasswordVisibility = (e) => {
    e.preventDefault();
    setShowPassword(prevState => !prevState);
  };

  // Toggle para fixar/desfixar mensagens
  const togglePin = (e) => {
    e.preventDefault();
    setIsPinned(prevState => !prevState);
    
    // Se estiver fixando, garantir que touched seja true para exibir as mensagens
    if (!isPinned) {
      setTouched(true);
    }
  };
  
  // Determinar se os requisitos falhos devem ser exibidos
  // Mostrar sempre se estiver fixado, ou de acordo com a lógica anterior
  const safeValue = value || ''; // Garantir que temos uma string
  const shouldShowFailedRequirements = isPinned || (showValidation && touched && !focused && safeValue.length > 0);
  const hasFailedRequirements = validation.failedRequirements.length > 0;

  return (
    <div className={`${styles.passwordContainer} ${className || ''}`}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      
      <div className={styles.inputWrapper}>
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={safeValue} // Usar o valor seguro
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          {...rest}
        />
        
        <button
          type="button"
          className={styles.visibilityToggle}
          onClick={togglePasswordVisibility}
          tabIndex="-1"
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          disabled={disabled}
        >
          {showPassword ? <FaEyeSlash className={styles.eyeIcon} /> : <FaEye className={styles.eyeIcon} />}
        </button>
      </div>
      
      {error && <div className={styles.errorText}>{error}</div>}
      
      {/* Barra de força da senha - CORREÇÃO AQUI */}
      {showValidation && safeValue.length > 0 && (
        <div className={styles.strengthContainer}>
          <div className={styles.strengthBar}>
            <div 
              className={styles.strengthFill} 
              style={{ 
                width: `${validation.strength}%`, 
                backgroundImage: validation.gradient,
              }} 
            />
          </div>
          <div className={styles.strengthText} style={{ color: validation.textColor }}>
            {validation.strengthText}
          </div>
        </div>
      )}
      
      {/* Requisitos não atendidos - com botão de fixação */}
      <div 
        className={`${styles.failedRequirements} ${
          (shouldShowFailedRequirements && hasFailedRequirements) ? styles.fadeIn : styles.fadeOut
        } ${isPinned ? styles.pinned : ''}`}
        aria-hidden={!(shouldShowFailedRequirements && hasFailedRequirements)}
      >
        <Tooltip 
          content={isPinned ? "Desfixar regras" : "Fixar regras"} 
          position="top"
        >
          <button 
            type="button"
            onClick={togglePin}
            className={`${styles.pinButton} ${isPinned ? styles.pinActive : ''}`}
            aria-label={isPinned ? "Desfixar regras" : "Fixar regras"}
          >
            <FaThumbtack />
          </button>
        </Tooltip>
        
        <ul className={styles.requirementsList}>
          {validation.failedRequirements.map((req, index) => (
            <li key={index} className={styles.invalid}>
              <FaTimes /> {req}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}