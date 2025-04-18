'use client';

import { signIn } from 'next-auth/react';
import { searchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDataContext } from '../../../context/DataContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import styles from './LoginForm.module.css';

export default function LoginForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [registerPasswordValid, setRegisterPasswordValid] = useState(false);
  const [confirmPasswordValid, setConfirmPasswordValid] = useState(false);
  const { ip, userAgent } = useDataContext();
  const [activeTab, setActiveTab] = useState('login');
  const [eventToken, setEventToken] = useState('');

  useEffect(() => {
    // Verificar token na URL
    const token = searchParams?.get('t');
    // Verificar token em sessionStorage
    const storedToken = sessionStorage.getItem('event_registration_token');

    if (token) {
      // Salvar token, limpar URL e atualizar estado
      setEventToken(token);
      setActiveTab('register');

      // Limpar token da URL
      window.history.replaceState(null, '', window.location.pathname);
      router.replace(window.location.pathname, undefined, { shallow: true });

      // Armazenar como objeto JSON
      sessionStorage.setItem('event_registration_token', JSON.stringify({
        token,
        expires: Date.now() + 1000 * 60 * 10 // 10 minutos
      }));
    }
    else if (storedToken) {
      try {
        // Tentar fazer o parsing como JSON
        const storedData = JSON.parse(storedToken);
        if (storedData.token && storedData.expires > Date.now()) {
          setEventToken(storedData.token);
          setActiveTab('register');
        } else {
          sessionStorage.removeItem('event_registration_token');
        }
      } catch (error) {
        // Se falhar, assumir que é um token simples (compatibilidade com formato antigo)
        setEventToken(storedToken);
        setActiveTab('register');

        // Atualizar para o novo formato
        sessionStorage.setItem('event_registration_token', JSON.stringify({
          token: storedToken,
          expires: Date.now() + 1000 * 60 * 10 // 10 minutos
        }));
      }
    }

    // Função de limpeza
    return () => {
      if (success) {
        sessionStorage.removeItem('event_registration_token');
      }
    };
  }, [success, router]);

  const validateForm = () => {
    const newErrors = {};

    if (activeTab === 'login') {
      // Validação para login
      if (!email) newErrors.email = 'Email é obrigatório';
      if (!password) newErrors.password = 'Senha é obrigatória';
    } else {
      // Validação para registro
      if (!name) newErrors.name = 'Nome é obrigatório';
      if (!email) newErrors.email = 'Email é obrigatório';
      if (!password) newErrors.password = 'Senha é obrigatória';
      if (!confirmPassword) newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
      if (password !== confirmPassword) newErrors.confirmPassword = 'As senhas não coincidem';
      if (!eventToken) newErrors.eventToken = 'Token do evento é obrigatório'; // Validação condicional
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
        clientIp: ip,
        clientUserAgent: userAgent
      });

      if (result?.error) {
        setServerError('Email ou senha incorretos');
        return;
      }

      // Verificar se o login foi bem-sucedido
      if (result?.ok) {
        router.push('/');
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
      // Verificar se tem token
      if (!eventToken) {
        setServerError('Token do evento é obrigatório para registro');
        setIsSubmitting(false);
        return;
      }

      // Verificar o token do evento
      const tokenResponse = await fetch('/api/events/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: eventToken }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || !tokenData.valid) {
        setServerError(tokenData.message || 'Token do evento inválido');
        setIsSubmitting(false);
        return;
      }

      // Continuar com o registro
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          eventToken,
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

      // Limpar o formulário e token de registro após sucesso
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setEventToken('');
      sessionStorage.removeItem('event_registration_token');

      // Redirecionar para a aba de login
      setActiveTab('login');

    } catch (error) {
      console.error('Erro ao registrar:', error);
      setServerError('Ocorreu um erro ao tentar registrar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (activeTab === 'login') {
      await handleLogin(email, password);
    } else {
      await handleRegister();
    }
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className={styles.tabs}>
          <TabsList className={styles.tabsList}>
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Registro</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Input
              label="Email"
              id="email-login"
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              disabled={isSubmitting}
            />
            {/* Campo de senha simples para login (sem validação complexa) */}
            <PasswordInput
              label="Senha"
              id="password-login"
              name="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className={styles.submitButton}
              fullWidth
            >
              {isSubmitting ? 'Aguarde...' : 'Entrar'}
            </Button>

            {/* <SocialLogin label="Entre com o Google!" /> */}

            {/* <div className={styles.loginInfo}>
              <p className={styles.infoText}>
                <strong>Já tem uma conta com e-mail e senha?</strong> Se você fizer login com sua conta Google usando o mesmo email
                de uma conta existente, os métodos de login serão automaticamente vinculados.
              </p>
            </div> */}
          </TabsContent>

          <TabsContent value="register">
            <Input
              label="Nome"
              id="name-register"
              name="name"
              type="text"
              placeholder="Seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              disabled={isSubmitting}
            />
            <Input
              label="Email"
              id="email-register"
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              disabled={isSubmitting}
            />
            {/* Campo de senha com validação para registro */}
            <PasswordInput
              label="Senha"
              id="password-register"
              name="password"
              placeholder="Crie uma senha segura"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              disabled={isSubmitting}
              showValidation={true}
              minLength={8}
              requireLowercase={true}
              requireUppercase={true}
              requireNumber={true}
              requireSpecial={true}
              onValidationChange={(state) => setRegisterPasswordValid(state.isValid)}
            />
            <PasswordInput
              label="Confirmar Senha"
              id="confirm-password"
              name="confirmPassword"
              placeholder="Confirme sua senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              disabled={isSubmitting}
              showValidation={true}
              confirmPassword={password}
              onValidationChange={(state) => setConfirmPasswordValid(state.isValid)}
            />
            {/* Token do evento - exibição condicional */}
            {eventToken ? (
              <div className={styles.tokenConfirmation}>
                <div className={styles.tokenMessage}>
                  <span className={styles.tokenIcon}>✓</span>
                  <span className={styles.tokenText}>
                    Token do evento válido aplicado automaticamente
                  </span>
                </div>
                <input
                  type="hidden"
                  name="token"
                  value={eventToken}
                />
              </div>
            ) : (
              <Input
                label="Token do Evento"
                id="eventToken"
                name="token"
                type="text"
                placeholder="Digite o token fornecido pelo organizador"
                value={eventToken}
                onChange={(e) => setEventToken(e.target.value)}
                error={errors.eventToken}
                disabled={isSubmitting}
                helpText="Obrigatório para registro. Solicite ao organizador do evento."
              />
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || (!registerPasswordValid || !confirmPasswordValid)}
              className={styles.submitButton}
              fullWidth
            >
              {isSubmitting ? 'Aguarde...' : 'Registrar'}
            </Button>

            {/* <SocialLogin label="Registre com o Google!" /> */}
          </TabsContent>
          {serverError && (<div className={styles.error}>{serverError}</div>)}
          {success && (<div className={styles.success}>{success}</div>)}
        </Tabs>
      </form>
    </div>
  );
}