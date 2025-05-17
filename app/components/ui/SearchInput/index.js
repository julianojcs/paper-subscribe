import React, { forwardRef } from 'react';
import styles from './SearchInput.module.css';

const SearchInput = forwardRef(({
  placeholder,
  value,
  onChange,
  className = '',
  leftIcon,
  onKeyDown,
  ...props
}, ref) => {
  return (
    <div className={styles.inputWrapper}>
      <div className={styles.inputContainer}>
        {leftIcon && (
          <div className={styles.leftIconContainer}>
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          className={`${styles.input} ${leftIcon ? styles.withLeftIcon : ''} ${className}`}
          {...props}
        />
      </div>
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

export default SearchInput;