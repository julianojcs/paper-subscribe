'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { FaEnvelope, FaGoogle, FaKey } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoginHistoryTable from '../components/ui/LoginHistoryTable';
import Modal from '../components/ui/Modal';
import PasswordInput from '../components/ui/PasswordInput';
import StateSelect from '../components/ui/StateSelect';
import { brazilianStates } from '../utils/brazilianStates';
import styles from './profile.module.css';

// Componente de loading consistente para reutilização
const LoadingSpinner = ({ message = "Carregando..." }) => (
  <div className={styles.loadingContainer}>
    <div className={styles.loadingSpinner}></div>
    <p>{message}</p>
  </div>
);

// Componente principal que usa session
function ProfileContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true); // Iniciar como true para mostrar loading imediatamente
  const [contentReady, setContentReady] = useState(false); // Novo estado para controlar quando o conteúdo está pronto
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [accountToRemove, setAccountToRemove] = useState(null);
  const [passwordValid, setPasswordValid] = useState(false);
  const [confirmPasswordValid, setConfirmPasswordValid] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    institution: '',
    city: '',
    stateId: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch('/api/user/profile');
      const userData = await response.json();

      if (response.ok) {
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          cpf: userData.cpf || '',
          phone: userData.phone || '',
          institution: userData.institution || '',
          city: userData.city || '',
          stateId: userData.stateId
            ? brazilianStates.find(s => s.value === userData.stateId) || null
            : null
        });
        return true;
      } else {
        setError('Erro ao carregar dados do perfil');
        return false;
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro de conexão ao carregar seus dados');
      return false;
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    } 
    
    if (status === 'authenticated') {
      // Carregar dados em paralelo
      Promise.all([
        fetchUserData(),
        fetchLinkedAccounts(),
        fetchLoginHistory()
      ]).then(() => {
        // Quando todas as promises forem resolvidas, marcar como pronto
        setContentReady(true);
        setLoading(false);
      }).catch(error => {
        console.error("Erro ao carregar dados do perfil:", error);
        setContentReady(true);
        setLoading(false);
      });

      const token = session?.token;
      if (token?.newSocialLink && token?.provider) {
        setMessage(`Conta ${token.provider.charAt(0).toUpperCase() + token.provider.slice(1)} vinculada com sucesso à sua conta existente.`);
      }
    }
  }, [status, router, session, fetchUserData]);

  const fetchLinkedAccounts = async () => {
    try {
      setAccountsLoading(true);
      const res = await fetch('/api/user/linked-accounts');
      const data = await res.json();

      if (res.ok) {
        setAccounts(data.accounts);
      }
      return true;
    } catch (error) {
      console.error('Erro ao carregar contas vinculadas:', error);
      return false;
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
      return true;
    } catch (error) {
      console.error('Erro ao carregar histórico de login:', error);
      return false;
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleCancelEdit = () => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
        cpf: session.user.cpf || '',
        phone: session.user.phone || '',
        institution: session.user.institution || '',
        city: session.user.city || '',
        stateId: session.user.stateId
          ? brazilianStates.find(s => s.value === session.user.stateId) || null
          : null
      });
    }
    setError('');
    setSuccess('');
    setIsEditing(false);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const stateIdValue = typeof formData.stateId === 'object' && formData.stateId !== null
        ? formData.stateId.value
        : formData.stateId;

      const dataToUpdate = {
        name: formData.name,
        email: formData.email,
        cpf: formData.cpf,
        phone: formData.phone,
        institution: formData.institution,
        city: formData.city,
        stateId: stateIdValue
      };

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToUpdate)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Perfil atualizado com sucesso!');
        setIsEditing(false);

        if (fetchLinkedAccounts && typeof fetchLinkedAccounts === 'function') {
          await fetchLinkedAccounts();
        }
      } else {
        setError(data.message || 'Erro ao atualizar o perfil');
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const getLoginHistorySection = () => {
    if (session?.user?.organization === 'SRMG') {
      return null;
    }
    return (
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
    );
  };

  const getLinkedAccountsSection = () => {
    if (session?.user?.organization === 'SRMG') {
      return null;
    }
    return (
      <>
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
      </>
    );
  };

  const getAddPasswordSection = () => {
    if (session?.user?.organization === 'SRMG') {
      return null;
    }
    return (
      <>
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
      </>
    );
  };

  // Se estiver carregando (inicial ou durante fetch), mostrar loading spinner
  if (loading || status === 'loading' || !contentReady) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h1 className={styles.title}>Perfil do Usuário</h1>
          </header>
          <LoadingSpinner message="Carregando dados do perfil..." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Perfil do Usuário</h1>
        </header>

        <div className={styles.profileInfo}>
          <div className={styles.sectionHeader}>
            <h2>Suas Informações</h2>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className={styles.editButton}
              >
                Editar
              </Button>
            ) : null}
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          {!isEditing ? (
            <div className={styles.infoGrid}>
              <div className={styles.infoField}>
                <span className={styles.label}>Nome:</span>
                <span>{formData.name || 'Não informado'}</span>
              </div>

              <div className={styles.infoField}>
                <span className={styles.label}>Email:</span>
                <span>{formData.email || session?.user?.email || 'Não informado'}</span>
              </div>

              <div className={styles.infoField}>
                <span className={styles.label}>CPF:</span>
                <span>{formData.cpf || 'Não informado'}</span>
              </div>

              <div className={styles.infoField}>
                <span className={styles.label}>Celular:</span>
                <span>{formData.phone || 'Não informado'}</span>
              </div>

              <div className={styles.infoField}>
                <span className={styles.label}>Cidade:</span>
                <span>{formData.city || 'Não informada'}</span>
              </div>

              <div className={styles.infoField}>
                <span className={styles.label}>Estado:</span>
                <span>
                  {formData.stateId ? (
                    <div className={styles.stateDisplay}>
                      {formData.stateId.label || formData.stateId}
                    </div>
                  ) : 'Não informado'}
                </span>
              </div>

              <div className={styles.infoField}>
                <span className={styles.label}>Instituição:</span>
                <span>{formData.institution || 'Não informada'}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleProfileUpdate} className={styles.editForm}>
              <div className={styles.infoGrid}>
                <div className={styles.infoField}>
                  <Input
                    label="Nome Completo"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div className={styles.infoField + ' ' + styles.inputDisabled}>
                  <Input
                    label="Email"
                    id="email"
                    name="email"
                    value={formData.email}
                    disabled={true}
                  />
                </div>

                <div className={styles.infoField}>
                  <Input
                    label="CPF"
                    id="cpf"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className={styles.infoField}>
                  <Input
                    label="Celular"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className={styles.infoField}>
                  <Input
                    label="Cidade"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Sua cidade"
                  />
                </div>

                <div className={styles.infoField}>
                  <label htmlFor="stateId" className={styles.stateLabel}>Estado</label>
                  <StateSelect
                    value={formData.stateId}
                    onChange={handleInputChange}
                    states={brazilianStates}
                    id="stateId"
                    name="stateId"
                  />
                </div>
                <div className={styles.infoField + ' ' + styles.fullWidth}>
                  <Input
                    label="Instituição"
                    id="institution"
                    name="institution"
                    value={formData.institution}
                    onChange={handleInputChange}
                    placeholder="Nome da sua instituição"
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          )}
        </div>

        {message && <div className={styles.success}>{message}</div>}
        {error && <div className={styles.error}>{error}</div>}

        {getLinkedAccountsSection()}

        {getAddPasswordSection()}

        {getLoginHistorySection()}

      </div>
    </div>
  );
}

// Componente principal com Suspense
export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h1 className={styles.title}>Perfil do Usuário</h1>
          </header>
          <LoadingSpinner message="Carregando perfil..." />
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}