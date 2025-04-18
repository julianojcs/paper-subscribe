'use client';

import Link from 'next/link';
import { useState } from 'react';
import LoginForm from './components/LoginForm';
import styles from './page.module.css';

export default function LoginPage() {
  const [error, setError] = useState('');

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Envio de Trabalho Científico</h1>
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.tabs}>
          <LoginForm />
        </div>

        <div className={styles.footer}>
          <p>
            Ao fazer login, você concorda com nossos <Link href="/terms">Termos de Serviço</Link> e <Link href="/privacy">Política de Privacidade</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}