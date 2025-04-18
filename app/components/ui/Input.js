import React from 'react';
import styles from './Input.module.css';

const Input = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helpText,
  ...props
}) => {
  return (
    <div className={styles.container}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${styles.input} ${error ? styles.error : ''}`}
        required={required}
        {...props}
      />
      {helpText && <small className={styles.helpText}>{helpText}</small>}
      {error && <div className={styles.errorText}>{error}</div>}
    </div>
  );
};

export default Input;