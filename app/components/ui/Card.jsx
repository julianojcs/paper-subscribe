import React from 'react';
import styles from './Card.module.css';

const Card = ({ 
  children, 
  title, 
  className = '', 
  footer,
  variant = 'default',
  ...props 
}) => {
  return (
    <div className={`${styles.card} ${styles[variant]} ${className}`} {...props}>
      {title && <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{title}</h3>
      </div>}
      <div className={styles.cardBody}>{children}</div>
      {footer && <div className={styles.cardFooter}>{footer}</div>}
    </div>
  );
};

export default Card;