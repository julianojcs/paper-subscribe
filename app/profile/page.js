'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { FaEnvelope, FaGoogle, FaKey, FaExclamationTriangle, FaUser, FaRegIdCard, FaPhone, FaCity, FaUniversity } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoginHistoryTable from '../components/ui/LoginHistoryTable';
import Modal from '../components/ui/Modal';
import PasswordInput from '../components/ui/PasswordInput';
import { brazilianStates } from '../utils/brazilianStates';
import styles from './profile.module.css';
import Select from 'react-select';
import { validateCPF, formatPhone, formatCPF, formatName } from '@/utils';
import PageContainer from '/app/components/layout/PageContainer';
import HeaderContentTitle from '/app/components/layout/HeaderContentTitle';
import LoadingSpinner from '/app/components/ui/LoadingSpinner';

// Componente para exibir mensagens de erro
const ErrorMessage = ({ message }) => (
  <div className={styles.error}>
    <FaExclamationTriangle className={styles.errorIcon} />
    <span>{message}</span>
  </div>
);

// Componente principal que usa session
const ProfilePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [contentReady, setContentReady] = useState(false);
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
  const eventLogoUrl = session?.user?.activeEventLogoUrl;
  const eventName = session?.user?.activeEventName;

  // Função para processar erros da API
  const processApiErrors = useCallback((data) => {
    // Limpar erros anteriores
    const newErrors = {};

    // Se o erro tem um campo específico
    if (data.field && data.message) {
      newErrors[data.field] = data.message;
    }
    // Se temos um objeto de erros
    else if (data.errors && typeof data.errors === 'object') {
      Object.keys(data.errors).forEach(key => {
        newErrors[key] = data.errors[key];
      });
    }
    // Se temos apenas uma mensagem de erro geral
    else if (data.message) {
      newErrors.general = data.message;
    }
    // Fallback para erros desconhecidos
    else {
      newErrors.general = 'Ocorreu um erro inesperado';
    }

    return newErrors;
  }, []);

  // Função para validar e definir erros de campo
  const validateField = (field, value) => {
    // Limpar erro anterior do campo
    const updatedErrors = { ...fieldErrors };

    // Remover o erro do backend para este campo, pois o usuário está modificando o valor
    delete updatedErrors[field];

    // Validações específicas por campo
    switch (field) {
      case 'name':
        if (value.trim().length > 0 && value.trim().length < 3) {
          updatedErrors.name = 'Nome deve ter pelo menos 3 caracteres';
        }
        break;

      case 'cpf':
        // Validar CPF apenas quando tem o formato completo
        if (value && value.length === 14 && !validateCPF(value)) {
          updatedErrors.cpf = 'CPF inválido';
        } else if (value && value.length > 0 && value.length < 14) {
          updatedErrors.cpf = 'CPF incompleto';
        }
        break;

      case 'phone':
        const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
        if (value && value.length > 0 && !phoneRegex.test(value)) {
          if (value.length < 15) {
            updatedErrors.phone = 'Telefone incompleto';
          } else {
            updatedErrors.phone = 'Formato de telefone inválido';
          }
        }
        break;

      case 'institution':
        if (value && value.trim().length > 0 && value.trim().length < 3) {
          updatedErrors.institution = 'Instituição deve ter pelo menos 3 caracteres';
        }
        break;

      case 'city':
        if (value && value.trim().length > 0 && value.trim().length < 2) {
          updatedErrors.city = 'Cidade deve ter pelo menos 2 caracteres';
        }
        break;
    }

    setFieldErrors(updatedErrors);
  };

  // Verifica se há erros de validação
  const hasValidationErrors = () => {
    return Object.keys(fieldErrors).filter(key => key !== 'general').length > 0;
  };

  // Funções para buscar dados - definidas antes do useEffect
  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch('/api/user/profile');

      if (!response.ok) {
        const errorData = await response.json();
        setFieldErrors(processApiErrors(errorData));
        return false;
      }

      const userData = await response.json();
      const formattedData = {
        name: userData.name || '',
        email: userData.email || '',
        cpf: userData.cpf || '',
        phone: userData.phone || '',
        institution: userData.institution || '',
        city: userData.city || '',
        stateId: userData.stateId
          ? brazilianStates.find(s => s.value === userData.stateId) || null
          : null
      };

      // Atualizar o form data
      setFormData(formattedData);
      return true;
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setFieldErrors(prev => ({
        ...prev,
        general: 'Erro de conexão ao carregar seus dados. Verifique sua internet e tente novamente.'
      }));
      return false;
    }
  }, [processApiErrors]);

  const fetchLinkedAccounts = useCallback(async () => {
    try {
      setAccountsLoading(true);
      const res = await fetch('/api/user/linked-accounts');

      if (!res.ok) {
        const errorData = await res.json();
        setFieldErrors(prev => ({ ...prev, ...processApiErrors(errorData) }));
        return false;
      }

      const data = await res.json();
      setAccounts(data.accounts);
      return true;
    } catch (error) {
      console.error('Erro ao carregar contas vinculadas:', error);
      setFieldErrors(prev => ({ ...prev, linkedAccounts: 'Falha ao carregar métodos de login' }));
      return false;
    } finally {
      setAccountsLoading(false);
    }
  }, [processApiErrors]);

  const fetchLoginHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch('/api/user/login-history?limit=5');

      if (!res.ok) {
        const errorData = await res.json();
        setFieldErrors(prev => ({ ...prev, ...processApiErrors(errorData) }));
        return false;
      }

      const data = await res.json();
      setLoginHistory(data.loginLogs);
      return true;
    } catch (error) {
      console.error('Erro ao carregar histórico de login:', error);
      setFieldErrors(prev => ({ ...prev, loginHistory: 'Falha ao carregar histórico de login' }));
      return false;
    } finally {
      setHistoryLoading(false);
    }
  }, [processApiErrors]);

  // useEffect agora usa funções já definidas
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
  }, [status, router, session, fetchUserData, fetchLinkedAccounts, fetchLoginHistory]);

  const handleAddPassword = async (e) => {
    e.preventDefault();

    if (!passwordValid) {
      setFieldErrors(prev => ({ ...prev, password: 'Sua senha não atende aos requisitos de segurança' }));
      return;
    }

    if (!confirmPasswordValid) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: 'As senhas não correspondem' }));
      return;
    }

    setLoading(true);

    // Limpar mensagens anteriores
    setFieldErrors({});
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
        setFieldErrors(processApiErrors(data));
      }
    } catch (error) {
      console.error('Erro ao adicionar senha:', error);
      setFieldErrors(prev => ({
        ...prev,
        general: 'Erro de conexão ao adicionar senha. Verifique sua internet e tente novamente.'
      }));
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

    // Limpar mensagens anteriores
    setFieldErrors({});
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
        setFieldErrors(processApiErrors(data));
      }
    } catch (error) {
      console.error('Erro ao desvincular conta:', error);
      setFieldErrors(prev => ({
        ...prev,
        general: 'Erro de conexão ao remover método de login. Verifique sua internet e tente novamente.'
      }));
    } finally {
      setUnlinkLoading(false);
      setModalIsOpen(false);
      setAccountToRemove(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Formatação específica para cada campo
    switch (name) {
      case 'phone':
        formattedValue = formatPhone(value);
        break;

      case 'cpf':
        formattedValue = formatCPF(value);
        break;
    }

    // Atualizar o valor do campo
    setFormData((prevData) => ({
      ...prevData,
      [name]: formattedValue
    }));

    // Validar o campo após a alteração
    validateField(name, formattedValue);
  };

  const handleCancelEdit = () => {
    // Recarregar os dados do usuário do banco de dados
    fetchUserData();

    // Limpar erros e mensagens
    setFieldErrors({});
    setSuccess('');
    setIsEditing(false);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    // Validar campos obrigatórios antes de enviar
    const requiredFields = {
      name: formData.name,
      cpf: formData.cpf,
      phone: formData.phone,
      city: formData.city,
      institution: formData.institution,
    };

    const updatedErrors = { ...fieldErrors };

    // Verificar campos obrigatórios
    Object.entries(requiredFields).forEach(([field, value]) => {
      if (!value || value.trim() === '') {
        updatedErrors[field] = `${field === 'name' ? 'Nome' :
                               field === 'cpf' ? 'CPF' :
                               field === 'phone' ? 'Telefone' :
                               field === 'city' ? 'Cidade' :
                               'Instituição'} é obrigatório`;
      } else {
        // Se tem valor, valida conforme as regras específicas
        validateField(field, value);
      }
    });

    // Verificar estado (é um caso especial por ser um objeto)
    if (!formData.stateId) {
      updatedErrors.stateId = 'Estado é obrigatório';
    }

    // Atualizar erros
    setFieldErrors(updatedErrors);

    // Verificar se há erros
    if (Object.keys(updatedErrors).length > 0) {
      return; // Não prosseguir com o envio se houver erros
    }

    // Resto da função permanece igual
    setIsSaving(true);

    // Limpar mensagens anteriores
    setFieldErrors({});
    setSuccess('');

    try {
      const stateIdValue = typeof formData.stateId === 'object' && formData.stateId !== null
        ? formData.stateId.value
        : formData.stateId;

      const dataToUpdate = {
        userId: session?.user?.id,
        name: formatName(formData.name.trim()),
        email: formData.email,
        cpf: formData.cpf,
        phone: formData.phone,
        institution: formData.institution.trim(),
        city: formatName(formData.city.trim()),
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

        // Recarregar dados relacionados
        await fetchUserData();
        await fetchLinkedAccounts();
      } else {
        // Processar erros retornados do servidor
        const errors = processApiErrors(data);
        setFieldErrors(errors);
        console.log('Erro ao atualizar perfil:', errors);

        // Se houver erro de campo específico, manter edição ativa
        if (Object.keys(errors).some(key => key !== 'general')) {
          // Manter no modo edição
        } else {
          // Se for só erro geral, podemos sair do modo edição
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setFieldErrors(prev => ({
        ...prev,
        general: 'Erro de conexão ao atualizar perfil. Verifique sua internet e tente novamente.'
      }));
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

        {fieldErrors.loginHistory && (
          <ErrorMessage message={fieldErrors.loginHistory} />
        )}

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

          {fieldErrors.linkedAccounts && (
            <ErrorMessage message={fieldErrors.linkedAccounts} />
          )}

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
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors(prev => {
                      const updated = {...prev};
                      delete updated.password;
                      return updated;
                    });
                  }
                }}
                placeholder="Crie uma senha forte"
                disabled={loading}
                showValidation={true}
                minLength={8}
                requireLowercase={true}
                requireUppercase={true}
                requireNumber={true}
                requireSpecial={true}
                onValidationChange={(state) => setPasswordValid(state.isValid)}
                error={fieldErrors.password}
              />

              <PasswordInput
                label="Confirmar Senha"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors(prev => {
                      const updated = {...prev};
                      delete updated.confirmPassword;
                      return updated;
                    });
                  }
                }}
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
                error={fieldErrors.confirmPassword}
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
      <LoadingSpinner message="Carregando dados do perfil ..." />
    );
  }

  return (
    <PageContainer>
      <HeaderContentTitle
        eventData={{eventLogoUrl, eventName}}
        onImageLoad={() => {}}
        subtitle='Perfil do Usuário'
        fallbackTitle="Sistema de Submissão de Trabalhos Científicos"
      />

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

        {/* Mensagens gerais */}
        {fieldErrors.general && (
          <ErrorMessage message={fieldErrors.general} />
        )}

        {success && <div className={styles.success}>{success}</div>}

        <form onSubmit={handleProfileUpdate} className={styles.editForm}>
          <div className={styles.infoGrid}>
            <div className={styles.infoField}>
              <Input
                label="Nome Completo"
                id="name"
                name="name"
                value={formData.name}
                autoComplete="name"
                autoCorrect="off"
                spellCheck="true"
                type="text"
                maxLength={100}
                minLength={3}
                autoFocus={true}
                leftIcon={<FaUser />}
                autoCapitalize="off"
                onChange={handleInputChange}
                onBlur={() => { formatName(formData.name) }}
                placeholder="Seu nome completo"
                required
                disabled={!isEditing}
                error={fieldErrors.name}
                isValid={!fieldErrors.name}
                isLoading={loading}
              />
            </div>

            <div className={styles.infoField + ' ' + styles.inputDisabled}>
              <Input
                label="Email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="seu@email.com"
                autoComplete="email"
                autoCorrect="off"
                spellCheck="false"
                maxLength={100}
                minLength={5}
                type="email"
                leftIcon={<FaEnvelope />}
                autoCapitalize="off"
                autoFocus={false}
                disabled={!isEditing}
                // disabled={true} // Email sempre desabilitado
                required
                error={fieldErrors.email}
                isValid={!fieldErrors.email}
                isLoading={loading}
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
                autoComplete="cpf"
                autoCorrect="off"
                spellCheck="false"
                type="text"
                leftIcon={<FaRegIdCard />}
                autoCapitalize="off"
                autoFocus={false}
                disabled={!isEditing}
                required
                maxLength={14}
                error={fieldErrors.cpf}
                isValid={!fieldErrors.cpf}
                isLoading={loading}
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
                autoCorrect="off"
                spellCheck="false"
                type="text"
                leftIcon={<FaPhone />}
                autoCapitalize="off"
                autoFocus={false}
                disabled={!isEditing}
                maxLength={15}
                error={fieldErrors.phone}
                isValid={!fieldErrors.phone}
                isLoading={loading}
              />
            </div>

            <div className={styles.infoField}>
              <Input
                label="Cidade"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                onBlur={() => { formatName(formData.city) }}
                placeholder="Sua cidade"
                autoComplete="address-level2"
                autoCorrect="off"
                spellCheck="false"
                type="text"
                leftIcon={<FaCity />}
                autoCapitalize="words"
                autoFocus={false}
                maxLength={50}
                minLength={2}
                disabled={!isEditing}
                required
                error={fieldErrors.city}
                isValid={!fieldErrors.city}
                isLoading={loading}
              />
            </div>

            <div className={styles.infoField}>
              <label htmlFor="stateId" className={fieldErrors.stateId ? styles.labelError : styles.stateLabel}>
                {fieldErrors.stateId ? (
                  <span className={styles.errorText}>{fieldErrors.stateId}</span>
                ) : (
                  "Estado"
                )}
                <span className={styles.requiredMark}>*</span>
              </label>
              <Select
                className="basic-single"
                classNamePrefix="select"
                defaultValue={brazilianStates[12]}
                value={formData.stateId}
                required
                onChange={(selectedOption) => {
                  setFormData((prevData) => ({
                    ...prevData,
                    stateId: selectedOption
                  }));

                  // Limpar erro de estado
                  if (fieldErrors.stateId) {
                    setFieldErrors(prev => {
                      const updated = { ...prev };
                      delete updated.stateId;
                      return updated;
                    });
                  }
                }}
                isDisabled={!isEditing}
                isLoading={false}
                isClearable={true}
                isRtl={false}
                isSearchable={true}
                name="stateId"
                id='stateId'
                options={brazilianStates}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    borderColor: fieldErrors.stateId ? '#ef4444' : state.isFocused ? '#3b82f6' : '#cbd5e1',
                    boxShadow: fieldErrors.stateId
                      ? '0 0 0 1px #ef4444'
                      : state.isFocused
                        ? '0 0 0 2px rgba(59, 130, 246, 0.2)'
                        : 'none',
                  }),
                }}
              />
            </div>

            <div className={styles.infoField + ' ' + styles.fullWidth}>
              <Input
                label="Instituição"
                id="institution"
                name="institution"
                value={formData.institution}
                onChange={handleInputChange}
                onBlur={() => { formData.institution }}
                placeholder="Nome da sua instituição"
                autoComplete="organization"
                autoCorrect="off"
                spellCheck="false"
                type="text"
                leftIcon={<FaUniversity />}
                autoCapitalize="off"
                autoFocus={false}
                maxLength={100}
                minLength={3}
                disabled={!isEditing}
                required
                error={fieldErrors.institution}
                isValid={!fieldErrors.institution}
                isLoading={loading}
              />
            </div>
          </div>

          {isEditing && (
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
          )}
        </form>
      </div>

      {message && <div className={styles.success}>{message}</div>}

      {getLinkedAccountsSection()}

      {getAddPasswordSection()}

      {getLoginHistorySection()}
    </PageContainer>
  );
}

export default ProfilePage;