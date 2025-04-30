'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDataContext } from '../../../../context/DataContext';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import PasswordInput from '../../../components/ui/PasswordInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import styles from './LoginForm.module.css';
import { formatName } from '../../../utils';
import { FaEnvelope, FaLock, FaTicketAlt, FaUser } from 'react-icons/fa';

// Modificar a definição do componente para aceitar props da página principal
export default function LoginForm({
  eventToken: initialToken = '',
  tokenValidated: initialTokenValidated = false,
  defaultTab = 'login'
}) {
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
  const { ip, userAgent, eventData } = useDataContext();
  // Usar valores iniciais das props
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [eventToken, setEventToken] = useState(initialToken);
  const [tokenValidated, setTokenValidated] = useState(initialTokenValidated);

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
      // Verificar se tem token validado
      if (!eventToken || !tokenValidated) {
        setServerError('Token do evento é inválido ou expirou');
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
          name: formatName(name.trim()),
          email: email.replace(/\s+/g, '').toLowerCase(),
          password,
          eventToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.message || 'Erro ao registrar usuário');
        return;
      }

      // Salvar dados do evento para uso persistente
      if (data.eventId && data.eventData) {
        // Remover o token de registro
        localStorage.removeItem('event_registration_token');

        // Salvar os dados do evento com validade até a data de fim do evento
        const eventEndDate = data.eventData.endDate ? new Date(data.eventData.endDate).getTime() :
                            (Date.now() + 1000 * 60 * 60 * 24 * 365); // Default: 1 ano

        localStorage.setItem('user_event_data', JSON.stringify({
          eventId: data.eventId,
          logoUrl: data.eventData.logoUrl,
          name: data.eventData.name,
          timeline: data.eventData.timeline || [],
          expires: eventEndDate
        }));
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
      setTokenValidated(false);

      // Redirecionar para a aba de login
      setActiveTab('login');

    } catch (error) {
      console.error('Erro ao registrar:', error);
      setServerError('Ocorreu um erro ao tentar registrar');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validar manualmente um token inserido pelo usuário
  const handleTokenInput = (inputToken) => {
    setEventToken(inputToken);
    // Nota: A validação propriamente dita deveria ser feita na página pai
    // Aqui só atualizamos o estado local
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
              autoComplete="email"
              autoFocus={true}
              autoCorrect="off"
              spellCheck="false"
              maxLength={100}
              minLength={5}
              leftIcon={<FaEnvelope />}
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
              minLength={8}
              maxLength={50}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className={`${styles.submitButton} ${isSubmitting ? styles.loading : ''}`}
              fullWidth
            >
              {isSubmitting ? 'Aguarde...' : 'Entrar'}
            </Button>
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
              autoComplete="name"
              autoCorrect="off"
              spellCheck="true"
              maxLength={100}
              minLength={3}
              autoFocus={true}
              leftIcon={<FaUser />}
              autoCapitalize="off"
            />
            <Input
              label="Email"
              id="email-register"
              name="email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              autoCorrect="off"
              spellCheck="false"
              maxLength={100}
              minLength={5}
              leftIcon={<FaEnvelope />}
              autoCapitalize="off"
              autoFocus={false}
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
            {!(eventToken || tokenValidated || eventData) && (
              <Input
                label="Token do Evento"
                id="eventToken"
                name="token"
                type="text"
                placeholder="Digite o token fornecido pelo organizador"
                value={eventToken}
                onChange={(e) => handleTokenInput(e.target.value)}
                error={errors.eventToken}
                disabled={isSubmitting}
                leftIcon={<FaTicketAlt />}
                helpText="Obrigatório para registro. Solicite ao organizador do evento."
              />
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || (!tokenValidated && !eventData) || !registerPasswordValid || !confirmPasswordValid}
              className={`${styles.submitButton} ${isSubmitting ? styles.loading : ''}`}
              fullWidth
            >
              {isSubmitting ? 'Aguarde...' : 'Registrar'}
            </Button>
          </TabsContent>
          {serverError && (<div className={styles.error}>{serverError}</div>)}
          {success && (<div className={styles.success}>{success}</div>)}
        </Tabs>
      </form>
    </div>
  );
}