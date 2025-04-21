import { useState } from 'react';
import styles from './ExpandableDescription.module.css';

// Componente para descrições longas expansíveis com exibição inline
function ExpandableDescription({ description, maxLength = 120 }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = description.length > maxLength;

  return (
    <span className={styles.inlineDescriptionContainer}>
      {expanded || !isLong
        ? description
        : `${description.substring(0, maxLength)}... `}
      
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className={styles.inlineToggleButton}
        >
          {expanded ? '[Mostrar menos]' : '[Mostrar mais]'}
        </button>
      )}
    </span>
  );
}

export default ExpandableDescription;