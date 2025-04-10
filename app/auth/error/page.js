'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import Button from '../../components/ui/Button';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const error = searchParams.get('error');
  
  // Mapear códigos de erro para mensagens amigáveis
  const errorMessages = {
    'EmailMismatch': 'O email da conta Google não corresponde ao email da sua conta atual. Por favor, use a mesma conta de email.',
    'AccessDenied': 'Acesso negado. Você cancelou a autenticação ou não tem permissão para acessar esta conta.',
    'Default': 'Ocorreu um erro durante a autenticação. Por favor, tente novamente.'
  };
  
  const errorMessage = errorMessages[error] || errorMessages.Default;
  
  return (
    <div className={styles.container}>
      <div className={styles.errorCard}>
        <h1>Erro de Autenticação</h1>
        
        <div className={styles.errorMessage}>
          {errorMessage}
        </div>
        
        <div className={styles.actions}>
          <Button onClick={() => router.push('/profile')}>
            Voltar ao Perfil
          </Button>
          <Link href="/login" className={styles.linkButton}>
            Ir para Login
          </Link>
        </div>
      </div>
    </div>
  );
}