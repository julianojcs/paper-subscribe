'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Input from '../components/ui/Input';
import PasswordInput from '../components/ui/PasswordInput'; // Importar o componente PasswordInput
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { FaGoogle, FaEnvelope, FaKey } from 'react-icons/fa';
import LoginHistoryTable from '../components/ui/LoginHistoryTable'; // Importe o novo componente

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [accountToRemove, setAccountToRemove] = useState(null);
  const [passwordValid, setPasswordValid] = useState(false);
  const [confirmPasswordValid, setConfirmPasswordValid] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchLinkedAccounts();
      fetchLoginHistory();

      const token = session?.token;
      if (token?.newSocialLink && token?.provider) {
        setMessage(`Conta ${token.provider.charAt(0).toUpperCase() + token.provider.slice(1)} vinculada com sucesso à sua conta existente.`);
      }
    }
  }, [status, router, session]);

  const fetchLinkedAccounts = async () => {
    try {
      setAccountsLoading(true);
      const res = await fetch('/api/user/linked-accounts');
      const data = await res.json();

      if (res.ok) {
        setAccounts(data.accounts);
      }
    } catch (error) {
      console.error('Erro ao carregar contas vinculadas:', error);
    } finally {
      setAccountsLoading(false);
    }
  };

  const fetchLoginHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch('/api/user/login-history?limit=5');
      const data = await res.json();

      if (res.ok) {
        setLoginHistory(data.loginLogs);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de login:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAddPassword = async (e) => {
    e.preventDefault();

    if (!passwordValid) {
      setError('Sua senha não atende aos requisitos de segurança');
      return;
    }

    if (!confirmPasswordValid) {
      setError('As senhas não correspondem');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const email = session?.user?.email;

      const res = await fetch('/api/user/add-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Senha adicionada com sucesso! Agora você pode fazer login com email e senha.');
        setPassword('');
        setConfirmPassword('');
        fetchLinkedAccounts();
      } else {
        setError(data.message || 'Ocorreu um erro ao adicionar senha');
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const showRemoveConfirmation = (account) => {
    setAccountToRemove(account);
    setModalIsOpen(true);
  };

  const handleUnlinkAccount = async () => {
    if (!accountToRemove) return;

    setUnlinkLoading(true);
    setError('');
    setMessage('');

    try {
      const provider = accountToRemove.provider || 'credentials';

      const res = await fetch('/api/user/unlink-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`Método de login removido com sucesso`);
        fetchLinkedAccounts();
      } else {
        setError(data.message || 'Ocorreu um erro ao remover método de login');
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setUnlinkLoading(false);
      setModalIsOpen(false);
      setAccountToRemove(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (status === 'loading') {
    return <div className={styles.loading}>Carregando perfil...</div>;
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Perfil do Usuário</h1>
        </header>

        <div className={styles.profileInfo}>
          <h2>Suas Informações</h2>
          <p><strong>Nome:</strong> {session?.user?.name || 'Não informado'}</p>
          <p><strong>Email:</strong> {session?.user?.email}</p>
        </div>

        {message && <div className={styles.success}>{message}</div>}
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.linkedAccounts}>
          <h2>Métodos de Login</h2>

          {accountsLoading ? (
            <p>Carregando métodos de login...</p>
          ) : accounts.length > 0 ? (
            <ul className={styles.accountsList}>
              {accounts.map((account, index) => (
                <li
                  key={index}
                  className={`${styles.accountItem} ${accounts.length === 1 ? styles.singleAccount : ''}`}
                >
                  <div className={styles.accountInfo}>
                    <div className={styles.accountIcon}>
                      {account.type === 'credentials' ? (
                        <FaKey className={styles.credentialsIcon} />
                      ) : account.provider === 'google' ? (
                        <FaGoogle className={styles.googleIcon} />
                      ) : (
                        <FaEnvelope className={styles.defaultIcon} />
                      )}
                    </div>
                    <div className={styles.accountName}>
                      {account.type === 'credentials' ? 'Email e Senha' : 
                      account.provider.charAt(0).toUpperCase() + account.provider.slice(1)}
                    </div>
                  </div>

                  {accounts.length > 1 && (
                    <button
                      onClick={() => showRemoveConfirmation(account)}
                      className={styles.unlinkButton}
                    >
                      Remover
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhum método de login configurado</p>
          )}
        </div>

        {!accountsLoading && !accounts.some(acc => acc.type === 'credentials') && (
          <div className={styles.addPasswordSection}>
            <h2>Adicionar Login com Email e Senha</h2>
            <p className={styles.sectionDescription}>
              Atualmente você só pode acessar sua conta usando provedores sociais. 
              Adicione uma senha para também poder fazer login diretamente com seu email.
            </p>

            <form onSubmit={handleAddPassword}>
              <div className={styles.emailDisplay}>
                <label>Email</label>
                <div className={styles.emailField}>
                  {session?.user?.email}
                </div>
              </div>

              <PasswordInput
                label="Nova Senha"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Crie uma senha forte"
                disabled={loading}
                showValidation={true}
                minLength={8}
                requireLowercase={true}
                requireUppercase={true}
                requireNumber={true}
                requireSpecial={true}
                onValidationChange={(state) => setPasswordValid(state.isValid)}
              />

              <PasswordInput
                label="Confirmar Senha"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua senha"
                disabled={loading}
                showValidation={true}
                minLength={8}
                requireLowercase={true}
                requireUppercase={true}
                requireNumber={true}
                requireSpecial={true}
                confirmPassword={password}
                onValidationChange={(state) => setConfirmPasswordValid(state.isValid)}
              />

              <Button
                type="submit"
                disabled={loading || !passwordValid || !confirmPasswordValid}
              >
                {loading ? 'Salvando...' : 'Adicionar Senha'}
              </Button>
            </form>
          </div>
        )}

        <div className={styles.loginHistory}>
          <h2>Histórico de Login Recente</h2>

          {historyLoading ? (
            <p>Carregando histórico...</p>
          ) : loginHistory.length > 0 ? (
            <LoginHistoryTable 
              loginHistory={loginHistory} 
              compactMode={true} 
            />
          ) : (
            <p>Nenhum registro de login encontrado</p>
          )}

          <div className={styles.historyFooter}>
            <Button
              onClick={() => router.push('/profile/login-history')}
              type="button"
              variant="secondary"
              className={styles.viewMoreButton}
            >
              Ver histórico completo
            </Button>
          </div>
        </div>

        <Modal
          isOpen={modalIsOpen}
          onClose={() => setModalIsOpen(false)}
          title="Confirmar remoção"
          actions={
            <>
              <Button
                onClick={() => setModalIsOpen(false)}
                variant="outline"
                disabled={unlinkLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUnlinkAccount}
                variant="danger"
                disabled={unlinkLoading}
              >
                {unlinkLoading ? 'Removendo...' : 'Remover'}
              </Button>
            </>
          }
        >
          <p className={styles.confirmationText}>
            Tem certeza que deseja remover este método de login:
            <span className={styles.accountHighlight}>
              {accountToRemove?.type === 'credentials'
                ? 'Email e Senha'
                : accountToRemove?.provider?.charAt(0).toUpperCase() + accountToRemove?.provider?.slice(1)}
            </span>?
          </p>
          <p className={styles.warningText}>
            Se você remover este método, não poderá mais usá-lo para acessar sua conta.
          </p>
        </Modal>
      </div>
    </div>
  );
}