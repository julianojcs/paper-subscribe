'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import styles from './page.module.css';
import SubmissionForm from './components/SubmissionForm';

export default function SubscribePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <>
      <div className={styles.container}>
        <h1 className={styles.title}>Envie o seu Trabalho Científico</h1>
        <p className={styles.description}>
          Seja bem vindo, {session.user.name || session.user.email}!
          Preencha o formulário abaixo para submeter seu Trabalho Científico para revisão.
        </p>

        <SubmissionForm />
      </div>
    </>
  );
}