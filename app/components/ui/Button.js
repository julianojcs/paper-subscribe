import styles from './Button.module.css';

export default function Button({ children, onClick, type = 'button', variant = 'primary' }) {
  const variantClasses = {
    primary: styles.primary,
    secondary: styles.secondary,
    outline: styles.outline,
    danger: styles.danger, // Adicione esta linha
    // outras variantes...
  };

  return (
    <button
      className={`${styles.button} ${variantClasses[variant]}`}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}