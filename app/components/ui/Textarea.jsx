import React from 'react';
import styles from './Textarea.module.css';

const Textarea = ({
  label,
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
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
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${styles.textarea} ${error ? styles.error : ''}`}
        rows={rows}
        required={required}
        {...props}
      />
      {helpText && <small className={styles.helpText}>{helpText}</small>}
      {error && <div className={styles.errorText}>{error}</div>}
    </div>
  );
};

export default Textarea;