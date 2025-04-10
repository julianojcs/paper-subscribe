'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './LoginForm.module.css';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function LoginForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');

  // Se o usuário já estiver autenticado, redirecione
  // useEffect(() => {
  //   if (status === 'authenticated') {
  //     console.log("Usuário já autenticado, redirecionando...");
  //     router.push('/paper');
  //   }
  // }, [status, router]);

  const validateForm = () => {
    const newErrors = {};

    if (!email) newErrors.email = 'Email é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email inválido';

    if (!password) newErrors.password = 'Senha é obrigatória';
    else if (password.length < 6) newErrors.password = 'A senha deve ter pelo menos 6 caracteres';

    if (!isLogin) {
      if (!name) newErrors.name = 'Nome é obrigatório';
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'As senhas não correspondem';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (email, password) => {
    setIsSubmitting(true);
    setServerError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setServerError('Email ou senha incorretos');
        return;
      }

      // Verificar se o login foi bem-sucedido
      if (result?.ok) {
        router.push('/paper');
      } else {
        setServerError('Erro ao iniciar sessão');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setServerError('Ocorreu um erro ao tentar fazer login');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    setIsSubmitting(true);
    setServerError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.message || 'Erro ao registrar usuário');
        return;
      }

      if (data.linkToExistingAccount) {
        setSuccess('Senha adicionada à sua conta existente. Agora você pode fazer login com email e senha.');
      } else {
        setSuccess('Conta criada com sucesso! Faça login para continuar.');
      }

      setIsLogin(true);
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Erro ao registrar:', error);
      setServerError('Ocorreu um erro ao tentar registrar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (isLogin) {
      await handleLogin(email, password);
    } else {
      await handleRegister();
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.tabButtons}>
        <button
          type="button"
          className={`${styles.tabButton} ${isLogin ? styles.active : ''}`}
          onClick={() => {
            setIsLogin(true);
            setServerError('');
            setSuccess('');
          }}
        >
          Login
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${!isLogin ? styles.active : ''}`}
          onClick={() => {
            setIsLogin(false);
            setServerError('');
            setSuccess('');
          }}
        >
          Registrar
        </button>
      </div>

      {serverError && (
        <div className={styles.error}>{serverError}</div>
      )}

      {success && (
        <div className={styles.success}>{success}</div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {!isLogin && (
          <Input
            label="Nome"
            id="name"
            type="text"
            placeholder="Seu nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            disabled={isSubmitting}
          />
        )}

        <Input
          label="Email"
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          disabled={isSubmitting}
        />

        <Input
          label="Senha"
          id="password"
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          disabled={isSubmitting}
        />

        {!isLogin && (
          <Input
            label="Confirmar Senha"
            id="confirmPassword"
            type="password"
            placeholder="Confirme sua senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            disabled={isSubmitting}
          />
        )}

        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Aguarde...' : isLogin ? 'Entrar' : 'Registrar'}
        </Button>
      </form>
    </div>
  );
}