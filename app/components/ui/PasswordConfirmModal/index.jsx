'use client';

import { useState, useEffect, useRef } from 'react';
import { FaLock, FaExclamationTriangle, FaTimes, FaArrowRight } from 'react-icons/fa';
import Button from '../Button';
import PasswordInput from '../PasswordInput';
import styles from './PasswordConfirmModal.module.css';

const PasswordConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  user,
  actionDetails
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // O foco será gerenciado internamente pelo PasswordInput
      setTimeout(() => {
        if (inputRef.current && inputRef.current.focus) {
          inputRef.current.focus();
        }
      }, 100);
    }

    // Reset estado quando o modal abrir/fechar
    if (!isOpen) {
      setPassword('');
      setError('');
      setIsSubmitting(false);
    }

    // Fechar modal com ESC
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  // Fechar quando clicar fora do modal
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onCancel();
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('Por favor, informe sua senha.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onConfirm(password);
    } catch (err) {
      setError(err.message || 'Ocorreu um erro ao confirmar a ação.');
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-modal-title"
      >
        <div className={styles.modalHeader}>
          <h3 id="password-modal-title" className={styles.modalTitle}>
            {title || 'Confirmar ação'}
          </h3>
          <button
            className={styles.closeButton}
            onClick={onCancel}
            aria-label="Fechar"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleConfirm}>
          <div className={styles.modalBody}>
            <div className={styles.securityIcon}>
              <FaLock className={styles.lockIcon} />
            </div>

            {user && actionDetails && (
              <div className={styles.actionDetails}>
                <p className={styles.userName}>{user.name}</p>
                <div className={styles.changeDetails}>
                  <div className={styles.fromRole}>
                    <span className={styles.roleLabel}>De:</span>
                    <span className={styles.roleName}>{actionDetails.fromRoleName}</span>
                  </div>
                  <div className={styles.arrow}><FaArrowRight /></div>
                  <div className={styles.toRole}>
                    <span className={styles.roleLabel}>Para:</span>
                    <span className={styles.roleName}>{actionDetails.toRoleName}</span>
                  </div>
                </div>
              </div>
            )}

            <p className={styles.message}>
              {message || 'Por favor, confirme sua senha para continuar.'}
            </p>

            <div className={styles.inputGroup}>
              {/* Substituindo o input padrão pelo componente PasswordInput */}
              <PasswordInput
                id="password"
                label="Sua senha:"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Digite sua senha"
                disabled={isSubmitting}
                error={error}
                required
                autoComplete="current-password"
                className={styles.passwordInputWrapper}
                // Não exibir validação complexa para confirmação de senha
                showValidation={false}
                // Permitir que o input seja focalizável via ref
                ref={inputRef}
              />
            </div>

            {error && (
              <div className={styles.errorMessage}>
                <FaExclamationTriangle className={styles.errorIcon} />
                {error}
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <Button
              type="button"
              variant="text"
              onClick={onCancel}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>

            <Button
              type="submit"
              variant="primary"
              className={styles.confirmButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Verificando...' : confirmLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordConfirmModal;