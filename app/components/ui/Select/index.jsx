'use client';

import { useId, useRef, useState, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import styles from './select.module.css';

/**
 * Componente Select reutilizável com listbox personalizado
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} props.id - ID opcional do select (gerado automaticamente se não fornecido)
 * @param {string} props.label - Texto do label
 * @param {string} props.value - Valor selecionado
 * @param {function} props.onChange - Função chamada quando o valor muda
 * @param {Array} props.options - Array de opções [{id, value, label}] ou strings
 * @param {string} props.placeholder - Texto do placeholder
 * @param {string} props.helperText - Texto de ajuda exibido abaixo do select
 * @param {string} props.errorMessage - Mensagem de erro
 * @param {boolean} props.required - Se o campo é obrigatório
 * @param {boolean} props.disabled - Se o campo está desabilitado
 * @param {string} props.className - Classes adicionais
 * @param {Object} props.description - Descrição para a opção selecionada
 * @param {function} props.getDescription - Função para obter descrição da opção
 */
export default function Select({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = "Selecione uma opção",
  helperText,
  errorMessage,
  required = false,
  disabled = false,
  className = "",
  description = null,
  getDescription = null,
  ...rest
}) {
  // Gerar ID único para associar com label
  const uniqueId = useId();
  const selectId = id || `select-${uniqueId}`;
  const helperId = `helper-${selectId}`;
  const descriptionId = `desc-${selectId}`;
  const listboxId = `listbox-${selectId}`;
  
  // Estado para controlar abertura do dropdown
  const [isOpen, setIsOpen] = useState(false);
  // Estado para controle de navegação por teclado
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Refs para os elementos DOM
  const triggerRef = useRef(null);
  const listboxRef = useRef(null);
  const containerRef = useRef(null);

  // Processar opções para garantir formato consistente
  const processedOptions = options.map(option => {
    if (typeof option === 'string') {
      return {
        id: option,
        value: option,
        label: option
      };
    } else if (typeof option === 'object') {
      return {
        id: option.id || option.value,
        value: option.value || option.id,
        label: option.label || option.name || option.value || option.id,
        description: option.description
      };
    }
    return option;
  });

  // Encontrar opção selecionada atual
  const selectedOption = processedOptions.find(opt => opt.id === value || opt.value === value);
  
  // Função para obter descrição da opção selecionada
  const getSelectedDescription = () => {
    if (!value) return null;
    
    if (getDescription) {
      return getDescription(value);
    }
    
    if (description) {
      return description;
    }
    
    return selectedOption?.description || null;
  };

  // Determinar se tem descrição para mostrar
  const selectedDescription = getSelectedDescription();
  const hasError = !!errorMessage;

  // Fechar o dropdown quando clicado fora
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Navegar listbox com teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex((prevIndex) => {
            const newIndex = prevIndex < processedOptions.length - 1 ? prevIndex + 1 : 0;
            scrollOptionIntoView(newIndex);
            return newIndex;
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex((prevIndex) => {
            const newIndex = prevIndex > 0 ? prevIndex - 1 : processedOptions.length - 1;
            scrollOptionIntoView(newIndex);
            return newIndex;
          });
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0) {
            handleOptionSelect(processedOptions[highlightedIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case 'Tab':
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Definir o índice destacado inicialmente
    if (value && highlightedIndex === -1) {
      const selectedIndex = processedOptions.findIndex(opt => opt.id === value || opt.value === value);
      if (selectedIndex >= 0) {
        setHighlightedIndex(selectedIndex);
        scrollOptionIntoView(selectedIndex);
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, highlightedIndex, processedOptions, value]);

  // Fazer scroll para opção quando navegando por teclado
  const scrollOptionIntoView = (index) => {
    if (listboxRef.current && listboxRef.current.children[index]) {
      listboxRef.current.children[index].scrollIntoView({
        block: 'nearest',
        inline: 'nearest'
      });
    }
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      
      // Reset highlight ao abrir
      if (!isOpen) {
        const selectedIndex = processedOptions.findIndex(opt => opt.id === value || opt.value === value);
        setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
      }
    }
  };

  const handleOptionSelect = (option) => {
    // Criar evento sintético semelhante ao evento Change de um select
    const syntheticEvent = {
      target: {
        value: option.id || option.value,
        name: rest.name
      }
    };
    
    onChange(syntheticEvent);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Função para fazer busca rápida
  const handleKeyDown = (event) => {
    if (disabled) return;
    
    if (event.key === ' ' && !isOpen) {
      event.preventDefault();
      toggleDropdown();
      return;
    }
    
    if (event.key === 'Enter') {
      event.preventDefault();
      toggleDropdown();
      return;
    }
    
    // Demais teclas implementadas no useEffect para navegar o listbox
  };

  return (
    <div className={`${styles.selectGroup} ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={styles.customSelectContainer}>
        {/* Botão trigger do select customizado */}
        <button
          type="button"
          id={selectId}
          ref={triggerRef}
          className={`${styles.selectTrigger} ${hasError ? styles.error : ''} ${isOpen ? styles.open : ''} ${disabled ? styles.disabled : ''}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={label ? selectId : null}
          aria-controls={isOpen ? listboxId : null}
          aria-activedescendant={isOpen && highlightedIndex >= 0 ? `option-${selectId}-${highlightedIndex}` : null}
          onClick={toggleDropdown}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          {...rest}
        >
          <span className={styles.selectValue}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <FaChevronDown className={`${styles.selectIcon} ${isOpen ? styles.open : ''}`} aria-hidden="true" />
        </button>
        
        {/* Dropdown listbox */}
        {isOpen && (
          <ul
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            className={styles.optionsList}
            aria-labelledby={selectId}
            tabIndex={-1}
          >
            {processedOptions.length > 0 ? (
              processedOptions.map((option, index) => (
                <li
                  key={option.id || index}
                  id={`option-${selectId}-${index}`}
                  role="option"
                  aria-selected={option.id === value || option.value === value}
                  className={`${styles.option} 
                    ${(option.id === value || option.value === value) ? styles.selected : ''} 
                    ${highlightedIndex === index ? styles.highlighted : ''}`}
                  onClick={() => handleOptionSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className={styles.optionLabel}>{option.label}</span>
                  {option.description && (
                    <span className={styles.optionDescription}>
                      {option.description}
                    </span>
                  )}
                </li>
              ))
            ) : (
              <li className={styles.noOptions}>Nenhuma opção disponível</li>
            )}
          </ul>
        )}
        
        {/* Descrição da opção selecionada */}
        {selectedDescription && (
          <div className={styles.selectedDescription} id={descriptionId}>
            {selectedDescription}
          </div>
        )}
      </div>

      {/* Mensagem de erro ou texto de ajuda */}
      {hasError ? (
        <p className={styles.errorMessage} id={`error-${selectId}`}>
          {errorMessage}
        </p>
      ) : helperText ? (
        <p id={helperId} className={styles.helperText}>
          {helperText}
        </p>
      ) : null}

      {/* Input oculto para integração com formulários */}
      <input
        type="hidden"
        name={rest.name}
        value={value || ''}
        required={required}
      />
    </div>
  );
}