import React, { useRef, useEffect, useState } from 'react';
import styles from './TextareaField.module.css';

export default function TextareaField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  helperText,
  errorMessage,
  required = false,
  rows = 4,
  maxRows = 8,
  autoResize = false,
  fieldConfig,
  maxWords,
  minWords,
  maxCount,
  minCount,
  showWordCount = false,
  ...props
}) {
  const textareaRef = useRef(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [progressBarStyle, setProgressBarStyle] = useState({});
  const fieldId = id || Math.random().toString(36).substring(2, 9);

  useEffect(() => {
    if (value) {
      const words = value.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
      setCharCount(value.length);
    } else {
      setWordCount(0);
      setCharCount(0);
    }
  }, [value]);

  useEffect(() => {
    if (!value) {
      setProgressBarStyle({
        width: '0%',
        backgroundColor: '#e0e0e0'
      });
      return;
    }

    if ((minWords && wordCount < minWords) || (minCount && charCount < minCount)) {
      setProgressBarStyle({
        width: '100%',
        backgroundColor: '#e53935'
      });
      return;
    }

    let percentage = 0;
    if (maxCount && charCount > 0) {
      percentage = (charCount / maxCount) * 100;
    } else if (maxWords && wordCount > 0) {
      percentage = (wordCount / maxWords) * 100;
    }

    percentage = Math.min(percentage, 100);

    let color;
    if (percentage > 90) {
      color = percentage >= 100 ? '#e53935' : `rgba(255, ${Math.floor(255 - (percentage - 90) * 25.5)}, 0)`;
    } else if (percentage > 75) {
      color = `rgba(255, ${Math.floor(255 - (percentage - 75) * 17)}, 0)`;
    } else if (percentage > 50) {
      color = `rgba(${Math.floor(128 + percentage)}, 200, 0)`;
    } else {
      color = `rgba(${Math.floor(76 + percentage * 1.5)}, 175, 80)`;
    }

    setProgressBarStyle({
      width: `${percentage}%`,
      backgroundColor: color
    });
  }, [charCount, wordCount, maxCount, maxWords, minCount, minWords, value]);

  useEffect(() => {
    const adjustHeight = () => {
      if (!textareaRef.current || !autoResize) return;

      textareaRef.current.style.height = 'auto';

      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = parseInt(getComputedStyle(textareaRef.current).lineHeight);
      const minHeight = rows * lineHeight;
      const maxHeight = maxRows * lineHeight;

      textareaRef.current.style.height = Math.min(Math.max(scrollHeight, minHeight), maxHeight) + 'px';
    };

    adjustHeight();
  }, [value, autoResize, rows, maxRows]);

  const handleChange = (e) => {
    onChange(e);
  };

  const isExceedingLimit = (maxWords && wordCount > maxWords) || (maxCount && charCount > maxCount);
  const isBelowMinimum = (minWords && wordCount < minWords) || (minCount && charCount < minCount);

  return (
    <div className={styles.textareaField}>
      {label && (
        <label htmlFor={fieldId} className={styles.label}>
          {label} {required && <span className={styles.requiredMark}>*</span>}
        </label>
      )}

      <div className={styles.textareaWrapper}>
        <textarea
          ref={textareaRef}
          id={id}
          name={name || id}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`${styles.textarea} ${errorMessage ? styles.error : ''}`}
          rows={rows}
          required={required}
          maxLength={maxCount}
          {...props}
        />

        <div style={{
          height: '4px',
          backgroundColor: '#e0e0e0',
          borderRadius: '0 0 4px 4px',
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
          marginTop: '-1px'
        }}>
          <div
            className={styles.progressBar}
            style={{
              width: progressBarStyle.width || '0%',
              backgroundColor: progressBarStyle.backgroundColor || '#4caf50'
            }}
          />
        </div>
      </div>

      {errorMessage && (
        <div className={styles.errorMessage}>{errorMessage}</div>
      )}

      <p className={styles.infoRow}>
        {helperText && (
          <span>{helperText}</span>
        )}

        {(maxCount || maxWords || showWordCount) && (
          <span className={`${isExceedingLimit ? styles.countExceeding : ''}`}>
            <span className={styles.currentCount}>
              {maxWords ? `${wordCount}` : `${charCount}`}
            </span>
            {(maxCount || maxWords) && (
              <span className={styles.maxCount} style={{ marginLeft: '4px' }}>
                / {maxWords ? `${maxWords}` : `${maxCount}`}
              </span>
            )}
          </span>
        )}
      </p>

      {((minWords && maxWords) || (minCount && maxCount)) && value && (
        <p className={`${styles.minCountInfo} ${isBelowMinimum ? styles.belowMinimum : ''}`}>
          {minWords ? `Mínimo: ${minWords} palavra${minWords === 1 ? '' : 's'}` :
            minCount ? `Mínimo: ${minCount} caractere${minCount === 1 ? '' : 's'}` : ''}
        </p>
      )}

      {maxWords && maxCount && value && (
        <p className={styles.secondaryCounter}>
          {`${charCount} caractere${charCount === 1 ? '' : 's'} / Máximo: ${maxCount}`}
        </p>
      )}
    </div>
  );
}