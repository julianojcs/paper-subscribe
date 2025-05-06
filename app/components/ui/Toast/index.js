'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import styles from './Toast.module.css';

export const ToastType = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
};

const Toast = ({ message, type = ToastType.INFO, duration = 5000, onClose }) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const intervalIdRef = useRef(null); // Usando useRef em vez de useState para o intervalId

  const handleClose = useCallback(() => {
    setVisible(false);
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }

    // Pequeno delay para animação de saída
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    // Inicia o progresso de desaparecimento
    const step = 100 / (duration / 100);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(intervalIdRef.current);
          return 0;
        }
        return prev - step;
      });
    }, 100);

    // Armazenar o ID do intervalo no ref em vez de um estado
    intervalIdRef.current = interval;

    // Timer para fechar o toast
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearInterval(intervalIdRef.current);
      clearTimeout(timer);
    };
  }, [duration, handleClose]); // handleClose já inclui onClose como dependência

  // Define o ícone conforme o tipo de toast
  const getIcon = () => {
    switch (type) {
      case ToastType.SUCCESS:
        return <FaCheckCircle className={styles.icon} />;
      case ToastType.ERROR:
        return <FaExclamationTriangle className={styles.icon} />;
      case ToastType.WARNING:
        return <FaExclamationTriangle className={styles.icon} />;
      default:
        return <FaInfoCircle className={styles.icon} />;
    }
  };

  // Não renderizar se não estiver visível
  if (!visible) return null;

  return (
    <div className={`${styles.toast} ${styles[type]} ${styles.visible}`}>
      <div className={styles.content}>
        <div className={styles.iconContainer}>{getIcon()}</div>
        <div className={styles.message}>{message}</div>
        <button className={styles.closeButton} onClick={handleClose} aria-label="Fechar notificação">
          <FaTimes />
        </button>
      </div>
      <div className={styles.progressContainer}>
        <div
          className={styles.progressBar}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default Toast;