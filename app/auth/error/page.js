'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import styles from './error.module.css';
import Button from '../../components/ui/Button';

// Componente interno que usa useSearchParams
function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const router = useRouter();

  // Mapear códigos de erro para mensagens amigáveis
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'AccessDenied': 'Acesso negado. Você não tem permissão para acessar esta página.',
      'CredentialsSignin': 'Falha na autenticação. Verifique seu email e senha.',
      'OAuthSignin': 'Ocorreu um erro ao tentar entrar com o provedor de autenticação.',
      'OAuthCallback': 'Ocorreu um erro ao processar a resposta do provedor de autenticação.',
      'OAuthCreateAccount': 'Não foi possível criar uma conta usando o provedor de autenticação.',
      'EmailCreateAccount': 'Não foi possível criar uma conta usando o e-mail fornecido.',
      'Callback': 'Ocorreu um erro durante o processo de autenticação.',
      'OAuthAccountNotLinked': 'Este e-mail já está associado a uma conta existente. Faça login usando o método original.',
      'default': 'Ocorreu um erro durante a autenticação. Por favor, tente novamente.',
    };

    return errorMessages[errorCode] || errorMessages.default;
  };

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorCard}>
        <h1 className={styles.errorTitle}>Erro de Autenticação</h1>
        <div className={styles.errorMessage}>
          {getErrorMessage(error)}
        </div>
        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={() => router.push('/login')}
            className={styles.actionButton}
          >
            Voltar para Login
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className={styles.actionButton}
          >
            Página Inicial
          </Button>
        </div>
      </div>
    </div>
  );
}

// Componente principal com Suspense
export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Carregando...</div>}>
      <ErrorContent />
    </Suspense>
  );
}