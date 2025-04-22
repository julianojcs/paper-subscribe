import React, { forwardRef } from 'react';
import styles from './Input.module.css';

const Input = forwardRef(({
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  className,
  id,
  name,
  autoComplete,
  required,
  disabled,
  label,
  leftIcon,
  ...props
}, ref) => {
  const inputClasses = `${styles.input} ${leftIcon ? styles.withLeftIcon : ''} ${className || ''}`;

  return (
    <div className={styles.inputWrapper}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.inputContainer}>
        {leftIcon && (
          <div className={styles.leftIconContainer}>
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={inputClasses}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          {...props}
        />
      </div>
    </div>
  );
});

Input.displayName = 'Input';

export default Input;