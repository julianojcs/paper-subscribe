import { FaLock } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Button from '../Button';
import styles from './NoAccessPage.module.css';

const NoAccessPage = ({ title = "Acesso Restrito", message = "Você não tem permissão para acessar esta página." }) => {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <FaLock className={styles.icon} />
        </div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <Button
            onClick={() => router.push('/')}
            variant="secondary"
          >
            Voltar para o início
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NoAccessPage;