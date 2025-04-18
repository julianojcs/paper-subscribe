'use client'

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import styles from './StateSelect.module.css';

export default function StateSelect({
    value,
    onChange,
    states,
    name="state",
    id="state",
    placeholder="Selecione um estado",
    showUF=false,
    listboxPosition="left",
    textDisplay="wrap",
    disabled=false,
    classNames={
      options: null,
      option: null,
      combobox: null,
      label: null,
      flag: null,
    }
  }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedState, setSelectedState] = useState(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const selectRef = useRef(null);
  const optionsRef = useRef(null);
  
  useEffect(() => {
    if (value) {
      if (typeof value === 'object' && value !== null && value.value) {
        setSelectedState(value);
      } else if (typeof value === 'string') {
        const foundState = states.find(state => state.value === value);
        if (foundState) {
          setSelectedState(foundState);
        }
      }
    } else {
      setSelectedState(null);
    }
  }, [value, states]);

  const handleStateSelect = (state) => {
    if (disabled) return;
    setSelectedState(state);
    onChange({ target: { name: name, value: state } });
    setIsOpen(false);
    selectRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'Tab':
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
        }
        break;
    }
  };

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const updatePosition = () => {
      if (selectRef.current && isOpen) {
        const rect = selectRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const optionsHeight = 200;
        
        let horizontalPosition = rect.left;
        
        if (listboxPosition === 'right') {
          horizontalPosition = rect.right - rect.width;
        }
        
        setPosition({
          top: spaceBelow >= optionsHeight ? rect.bottom : rect.top - optionsHeight,
          left: horizontalPosition,
          width: rect.width
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    if (isOpen) {
      updatePosition();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, listboxPosition]);

  const getTextDisplayClass = () => {
    switch (textDisplay) {
      case 'ellipsis':
        return styles.textEllipsis;
      case 'expand':
        return styles.textExpand;
      case 'wrap':
      default:
        return styles.textWrap;
    }
  };

  const getStateFlag = () => {
    if (!selectedState) return null;
    
    if (selectedState.flag) {
      return selectedState.flag;
    }
    
    const stateObj = states.find(s => s.value === selectedState.value);
    return stateObj?.flag || null;
  };

  return (
    <div 
      className={`${styles.selectContainer} ${disabled ? styles.disabled : ''}`}
      ref={selectRef} 
      id={id} 
      aria-labelledby="state-label"
    >
      <div
        tabIndex={disabled ? -1 : 0}
        className={`${styles.select} ${classNames.combobox || ''} ${getTextDisplayClass()} ${disabled ? styles.disabled : ''}`}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="state-listbox"
        aria-disabled={disabled}
      >
        {selectedState ? (
          <>
            {getStateFlag() && (
              <div className={styles.flagContainer}>
                <Image
                  src={getStateFlag()}
                  alt={`${selectedState.value}`}
                  width={24}
                  height={16}
                  className={`${styles.stateFlag} ${classNames.flag || ''}`}
                />
              </div>
            )}
            <span className={`${classNames.label || ''} ${getTextDisplayClass()}`}>
              {showUF ? selectedState.value : (selectedState.label || selectedState.value)}
            </span>
          </>
        ) : (
          <span className={getTextDisplayClass()}>{placeholder}</span>
        )}
      </div>

      {isOpen && !disabled && (
        <div
          id="state-listbox"
          className={`${styles.optionsContainer} ${classNames.options || ''} ${textDisplay === 'expand' ? styles.expandedOptions : ''}`}
          ref={optionsRef}
          role="listbox"
          aria-labelledby="state-label"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: textDisplay === 'expand' ? 'auto' : undefined,
            minWidth: `${position.width}px`
          }}
        >
          {states.map(state => (
            <div
              key={state.value}
              tabIndex={-1}
              className={`${styles.option} ${classNames.option || ''} ${selectedState?.value === state.value ? styles.selected : ''}`}
              onClick={() => handleStateSelect(state)}
              role="option"
              aria-selected={selectedState?.value === state.value}
            >
              {state.flag && (
                <div className={styles.flagContainer}>
                  <Image
                    src={state.flag}
                    alt={`Bandeira ${state.label}`}
                    width={24}
                    height={16}
                    className={`${styles.stateFlag} ${classNames.flag || ''}`}
                  />
                </div>
              )}
              <span className={getTextDisplayClass()}>
                {state.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}