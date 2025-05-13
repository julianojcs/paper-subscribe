import { FaSpinner } from 'react-icons/fa';
import styles from './Button.module.css';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  className = null,
  ...props
}) => {
  // Criar classe composta baseada nas props
  const buttonClasses = [
    styles.button,
    variant==="submited" ? styles["pending"] : styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    loading ? styles.loading : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
      {...props}
    >
      {loading && (
        <span className={styles.spinner}>
          <FaSpinner />
        </span>
      )}
      <span className={loading ? styles.buttonTextWithSpinner : styles.buttonContent}>
        {children}
      </span>
    </button>
  );
};

export default Button;