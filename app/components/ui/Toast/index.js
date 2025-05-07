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
  const [isPaused, setIsPaused] = useState(false);

  // Refs para armazenar valores que não devem causar re-renderização
  const startTimeRef = useRef(Date.now());
  const pausedAtRef = useRef(0);
  const intervalIdRef = useRef(null);
  const timerIdRef = useRef(null);
  const totalPausedTimeRef = useRef(0);
  const effectiveStartTimeRef = useRef(Date.now());

  // Função para limpar os timers
  const clearTimers = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
  }, []);

  // Função para fechar o toast
  const handleClose = useCallback(() => {
    setVisible(false);
    clearTimers();

    // Pequeno delay para animação de saída
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  }, [onClose, clearTimers]);

  // Função para pausar o timer
  const pauseTimer = useCallback(() => {
    if (isPaused) return;

    setIsPaused(true);
    pausedAtRef.current = Date.now();
    clearTimers();
  }, [isPaused, clearTimers]);

  // Função para retomar o timer
  const resumeTimer = useCallback(() => {
    if (!isPaused) return;

    // Calcular tempo adicional que ficou pausado
    const additionalPauseTime = Date.now() - pausedAtRef.current;
    totalPausedTimeRef.current += additionalPauseTime;

    setIsPaused(false);

    // Recalcular o tempo decorrido considerando as pausas
    const elapsedTime = Date.now() - startTimeRef.current - totalPausedTimeRef.current;
    const remainingTime = Math.max(0, duration - elapsedTime);

    // Calcular a porcentagem restante
    const currentProgress = Math.max(0, (remainingTime / duration) * 100);
    setProgress(currentProgress);

    // Se ainda houver tempo, configurar os novos timers
    if (remainingTime > 0) {
      // Atualização da barra de progresso
      const step = currentProgress / (remainingTime / 100); // Normaliza para o tempo restante

      intervalIdRef.current = setInterval(() => {
        setProgress(prev => {
          const newValue = Math.max(0, prev - step);
          if (newValue <= 0) {
            clearInterval(intervalIdRef.current);
            return 0;
          }
          return newValue;
        });
      }, 100);

      // Timer para fechar o toast
      timerIdRef.current = setTimeout(() => {
        handleClose();
      }, remainingTime);
    } else {
      // Se o tempo acabou, feche o toast
      handleClose();
    }
  }, [isPaused, duration, handleClose]);

  // Efeito inicial para configurar os timers
  useEffect(() => {
    startTimeRef.current = Date.now();
    effectiveStartTimeRef.current = Date.now();
    totalPausedTimeRef.current = 0;

    // Barra de progresso
    const step = 100 / (duration / 100);

    intervalIdRef.current = setInterval(() => {
      setProgress(prev => {
        const newValue = Math.max(0, prev - step);
        if (newValue <= 0) {
          clearInterval(intervalIdRef.current);
          return 0;
        }
        return newValue;
      });
    }, 100);

    // Timer para fechar o toast
    timerIdRef.current = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimers();
    };
  }, [duration, handleClose, clearTimers]);

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
    <div
      className={`${styles.toast} ${styles[type]} ${styles.visible} ${isPaused ? styles.paused : ''}`}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      onTouchStart={pauseTimer}
      onTouchEnd={resumeTimer}
    >
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
          style={{
            width: `${progress}%`,
            transition: isPaused ? 'none' : 'width 0.1s linear'
          }}
        />
      </div>
    </div>
  );
};

export default Toast;