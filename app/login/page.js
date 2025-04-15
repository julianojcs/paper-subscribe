'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import LoginForm from './components/LoginForm';
import SocialLogin from './components/SocialLogin';

export default function LoginPage() {
  const [error, setError] = useState('');

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Envio de Trabalho Científico</h1>
        <h2>Login ou Registro</h2>
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.tabs}>
          <LoginForm />
          <SocialLogin />
        </div>

        <div className={styles.loginInfo}>
          <p className={styles.infoText}>
            <strong>Já tem uma conta com e-mail e senha?</strong> Se você fizer login com sua conta Google usando o mesmo email
            de uma conta existente, os métodos de login serão automaticamente vinculados.
          </p>
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