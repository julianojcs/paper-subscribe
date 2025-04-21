import { useRouter } from 'next/navigation';
import Button from '../../../components/ui/Button';
import styles from "./ProfileRedirectModal.module.css";
import { FaExclamationTriangle } from "react-icons/fa";

const ProfileRedirectModal = ({ profileRedirectUrl = '/profile' }) => {
  const router = useRouter();

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Perfil Incompleto</h3>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.warningIcon}>
            <FaExclamationTriangle size={48} color="#f59e0b" />
          </div>
          <p>Para submeter um trabalho, você precisa completar seu perfil com todas as informações necessárias:</p>
          <ul className={styles.requiredInfoList}>
            <li>Nome completo</li>
            <li>Instituição</li>
            <li>Cidade</li>
            <li>Estado</li>
          </ul>
          <p>Você será redirecionado para a página de perfil e poderá retornar aqui depois.</p>
        </div>
        <div className={styles.modalFooter}>
          <Button
            variant="primary"
            onClick={() => router.push(profileRedirectUrl)}
            className={styles.modalButton}
          >
            Completar Perfil
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileRedirectModal;