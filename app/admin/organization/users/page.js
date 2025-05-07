'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  FaSearch,
  FaFilter,
  FaSortAmountDown,
  FaSortAmountUp,
  FaUserShield,
  FaUserGraduate,
  FaUserTie, // Para MANAGER
  FaUserEdit, // Para REVIEWER
  FaSpinner,
  FaFileAlt,
  FaCalendarAlt,
  FaBuilding,
  FaTimes,
  FaTable,
  FaThLarge
} from 'react-icons/fa';

import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Tooltip from '../../../components/ui/Tooltip';
import UserRoleMenu from '../../../components/ui/UserRoleMenu';
import PasswordConfirmModal from '../../../components/ui/PasswordConfirmModal';
import styles from './users.module.css';
import HeaderContentTitle from '../../../components/layout/HeaderContentTitle';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import PageContainer from '../../../components/layout/PageContainer';
import { useToast } from '../../../../context/ToastContext';
import { ToastType } from '../../../components/ui/Toast';

export default function OrganizationUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 1
  });

  // Filtros e ordenação
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [roleFilter, setRoleFilter] = useState('');

  // Estado para controlar a exibição de filtros
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Estado para controlar o modo de visualização (tabela ou cards)
  const [viewMode, setViewMode] = useState('table');

  // Key para forçar re-renderização de componentes de Tooltip
  const [tooltipKey, setTooltipKey] = useState(0);

  const { data: session, status } = useSession();
  const router = useRouter();

  // Verificar permissão para acessar a página
  const [hasAccess, setHasAccess] = useState(false);

  // Estado para controlar o menu flutuante de papéis
  const [activeRoleMenu, setActiveRoleMenu] = useState(null);

  // Estado para controlar mudanças de papel
  const [pendingRoleChange, setPendingRoleChange] = useState(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  // Adicione este estado para controlar se o usuário atual é administrador
  const [isAdmin, setIsAdmin] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Adicione este useEffect logo após os outros useEffects existentes
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Verifica se o usuário atual tem papel de administrador
      setIsAdmin(session.user.role === 'ADMIN');
    }
  }, [status, session]);

  // Efeito para detectar tamanho da tela e ajustar modo de visualização
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('card');
      }
    };

    // Configurar inicialmente
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Função para buscar usuários
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search,
        sortBy,
        sortOrder,
        ...(roleFilter && { role: roleFilter })
      });

      const response = await fetch(`/api/organization/users?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setOrganization(data.organization);
        setActiveEvent(data.activeEvent);
        setPagination(data.pagination);
        setHasAccess(true);

        // Incrementar tooltipKey para forçar recriação dos tooltips
        setTooltipKey(prevKey => prevKey + 1);
      } else {
        if (response.status === 403) {
          setHasAccess(false);
        }
        throw new Error(data.error || 'Erro ao carregar usuários');
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, sortBy, sortOrder, roleFilter]);

  // Carregar dados dos usuários
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetchUsers();
  }, [status, fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Resetar para a página 1 ao realizar uma nova busca
    setPagination(prev => ({ ...prev, page: 1 }));

    // Em dispositivos móveis, fechar os filtros após busca
    if (window.innerWidth < 768) {
      setFiltersVisible(false);
    }
  };

  const handleSortToggle = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    // Scrollar para o topo da lista de usuários
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
    // Reset tooltips quando o filtro mudar
    setTooltipKey(prevKey => prevKey + 1);
  };

  const toggleFilters = () => {
    setFiltersVisible(prev => !prev);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'table' ? 'card' : 'table');
  };

  const roleOptions = [
    { id: '', name: 'Todos' },
    { id: 'ADMIN', name: 'Administrador' },
    { id: 'MEMBER', name: 'Membro' },
    { id: 'MANAGER', name: 'Gerente' },
    { id: 'REVIEWER', name: 'Revisor' },
  ];

  const sortOptions = [
    { id: 'name', name: 'Nome' },
    { id: 'email', name: 'Email' },
    { id: 'createdAt', name: 'Data de cadastro' },
    { id: 'papersCount', name: 'Quantidade de trabalhos' }
  ];

  // Formatação de data e hora
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Função para abrir/fechar o menu flutuante com destaque visual
  const toggleRoleMenu = (userId) => {
    // Se está abrindo um menu para um novo usuário
    if (userId !== activeRoleMenu) {
      // Destacar visualmente o elemento selecionado
      setTimeout(() => {
        const element = document.getElementById(`user-role-avatar-${userId}`);
        if (element) {
          // Verificar se o elemento está visível na viewport
          const rect = element.getBoundingClientRect();
          const isVisible = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
          );

          // Se não estiver visível, role suavemente para ele
          if (!isVisible) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
    }

    // Armazena o ID do usuário para o qual o menu está sendo exibido
    setActiveRoleMenu(activeRoleMenu === userId ? null : userId);
  };

  // Função para obter o nome do papel
  const getRoleName = (role) => {
    const roleMap = {
      ADMIN: 'Administrador',
      MEMBER: 'Membro',
      MANAGER: 'Gerente',
      REVIEWER: 'Revisor'
    };
    return roleMap[role] || 'Desconhecido';
  };

  // Função para selecionar um papel no menu flutuante
  const handleRoleSelect = (user, newRole) => {
    setPendingRoleChange({
      userId: user.id,
      userName: user.name,
      currentRole: user.role,
      newRole,
      fromRoleName: getRoleName(user.role),
      toRoleName: getRoleName(newRole)
    });
    setPasswordModalOpen(true);
    setActiveRoleMenu(null); // Fecha o menu flutuante
  };

  const handlePasswordConfirm = async (password) => {
    if (!pendingRoleChange) return;

    try {
      setLoading(true);

      // Usar o caminho correto da API
      const response = await fetch(`/api/organization/users/${pendingRoleChange.userId}/role`, {
        method: 'PUT',  // Usando PUT conforme implementado na API
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newRole: pendingRoleChange.newRole,
          password: password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao alterar o papel do usuário');
      }

      // Atualizar a lista de usuários localmente
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === pendingRoleChange.userId
            ? { ...user, role: pendingRoleChange.newRole }
            : user
        )
      );

      // Substituindo alert por Toast
      addToast(
        `O papel do usuário ${pendingRoleChange.userName} foi alterado para ${pendingRoleChange.toRoleName} com sucesso!`,
        ToastType.SUCCESS
      );

      // Incrementar tooltipKey para forçar recriação dos tooltips com os novos papéis
      setTooltipKey(prevKey => prevKey + 1);
    } catch (error) {
      console.error('Erro ao alterar papel do usuário:', error);
      // Substituindo alert por Toast para erros
      addToast(`Erro: ${error.message}`, ToastType.ERROR);
    } finally {
      setPasswordModalOpen(false);
      setPendingRoleChange(null);
      setLoading(false);
    }
  };

  const handlePasswordModalClose = () => {
    setPasswordModalOpen(false);
    setPendingRoleChange(null);
  };

  // Exibir mensagem de acesso negado
  // Renderizar o ícone do usuário com Tooltip de forma segura e clicável
  const renderUserIcon = (user) => {
    let roleInfo;

    // Verifica se este é o avatar com o menu ativo
    const isActiveMenu = user.id === activeRoleMenu;

    switch (user.role) {
      case 'ADMIN':
        roleInfo = {
          name: 'Administrador',
          class: styles.adminAvatar,
          icon: <FaUserShield className={styles.roleIcon} />
        };
        break;
      case 'MANAGER':
        roleInfo = {
          name: 'Gerente',
          class: styles.managerAvatar,
          icon: <FaUserTie className={styles.roleIcon} />
        };
        break;
      case 'REVIEWER':
        roleInfo = {
          name: 'Revisor',
          class: styles.reviewerAvatar,
          icon: <FaUserEdit className={styles.roleIcon} />
        };
        break;
      default: // MEMBER
        roleInfo = {
          name: 'Membro',
          class: styles.memberAvatar,
          icon: <FaUserGraduate className={styles.roleIcon} />
        };
    }

    // Verifica se o usuário é o próprio usuário logado
    const isCurrentUser = user.id === session?.user?.id;

    // Se for o próprio usuário, ou se o usuário atual não for admin, apenas renderiza o ícone sem ação
    if (isCurrentUser || !isAdmin) {
      return (
        <div key={`user-icon-${user.id}-${tooltipKey}`}>
          <Tooltip content={roleInfo.name}>
            <div className={roleInfo.class}>
              {roleInfo.icon}
            </div>
          </Tooltip>
        </div>
      );
    }

    // Se for outro usuário e o usuário atual for admin, torna o ícone clicável
    return (
      <div key={`user-icon-${user.id}-${tooltipKey}`} className={styles.avatarContainer}>
        <Tooltip content={`${roleInfo.name} (Clique para alterar)`}>
          <button
            id={`user-role-avatar-${user.id}`}
            type="button"
            className={`
              ${roleInfo.class}
              ${styles.clickableAvatar}
              ${isActiveMenu ? styles.activeAvatar : ''}
            `}
            onClick={(e) => {
              e.preventDefault(); // Previne o comportamento padrão
              e.stopPropagation(); // Evita propagação do evento
              toggleRoleMenu(user.id);
            }}
            aria-label={`Alterar papel de ${user.name}`}
            aria-expanded={isActiveMenu}
            style={{ anchorName: `--anchor-avatar-${user.id}` }}
          >
            {roleInfo.icon}
            {isActiveMenu && <span className={styles.avatarActiveDot}></span>}
          </button>
        </Tooltip>
      </div>
    );
  };

  // Renderizar card compacto para mobile
  const renderCompactCard = (user) => {
    return (
      <div key={`user-compact-card-${user.id}-${tooltipKey}`} className={styles.compactCard}>
        <div className={styles.compactCardContent}>
          <div className={styles.compactUserInfo}>
            {renderUserIcon(user)}
            <div className={styles.compactUserDetails}>
              <div className={styles.userName}>{user.name}</div>
              <div className={styles.userCpf}>{user.cpf}</div>
              <div className={styles.userEmail}>{user.email}</div>
            </div>
          </div>
          <div className={styles.compactCardMeta}>
            <div className={styles.dateTimeContainer}>
              <div className={styles.dateValue}>{formatDate(user.createdAt)}</div>
              <div className={styles.timeValue}>{formatTime(user.createdAt)}</div>
            </div>
            <div className={styles.papersCount}>
              <FaFileAlt className={styles.paperIcon} />
              <span>{user.papersCount}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar card normal para desktop (modo grid)
  const renderDesktopCard = (user) => {
    return (
      <div key={`user-desktop-card-${user.id}-${tooltipKey}`} className={styles.desktopCard}>
        <div className={styles.cardHeader}>
          {renderUserIcon(user)}
          <h3 className={styles.cardName}>{user.name}</h3>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardDetail}>
            <span className={styles.detailLabel}>Email:</span>
            <span className={styles.detailValue}>{user.email}</span>
          </div>

          {user.phone && (
            <div className={styles.cardDetail}>
              <span className={styles.detailLabel}>Telefone:</span>
              <span className={styles.detailValue}>{user.phone}</span>
            </div>
          )}

          {user.cpf && (
            <div className={styles.cardDetail}>
              <span className={styles.detailLabel}>CPF:</span>
              <span className={styles.detailValue}>{user.cpf}</span>
            </div>
          )}

          <div className={`${styles.cardDetail} ${styles.detailGrow}`}>
            <span className={styles.detailLabel}>Cadastro:</span>
            <div className={styles.dateTimeContainer}>
              <div className={styles.dateValue}>{formatDate(user.createdAt)}</div>
              <div className={styles.timeValue}>{formatTime(user.createdAt)}</div>
            </div>
          </div>
        </div>
        <div className={styles.cardFooter}>
          <div className={styles.papersCount}>
            <FaFileAlt className={styles.paperIcon} />
            <span>{user.papersCount} trabalho{user.papersCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    );
  };

  const MainContent = () => {
    return (
      <>
        <HeaderContentTitle
          eventData={{
            eventLogoUrl: activeEvent?.logoUrl,
            eventName: activeEvent?.shortName
          }}
          subtitle="Gerencie os usuários vinculados à sua organização"
          fallbackTitle="Gerencie os usuários vinculados à sua organização"
          background="linear-gradient(135deg, rgba(var(--paper-success-rgb), 1) 0%, var(--paper-success-dark) 100%)"
        />
        {loading && !users.length ? (
          <div className={styles.loadingContainer}>
            <FaSpinner className={styles.spinnerIcon} />
            <p>Carregando usuários...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{error}</p>
            <Button variant="primary" onClick={() => fetchUsers()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div className={styles.container}>
            <div className={styles.contextInfo}>
              {organization && (
                <div className={styles.organizationInfo}>
                  <FaBuilding className={styles.infoIcon} />
                  <span className={styles.infoLabel}>Organização:</span>
                  <span className={styles.infoValue}>{organization.name}</span>
                </div>
              )}

              {activeEvent && (
                <div className={styles.eventInfo}>
                  <FaCalendarAlt className={styles.infoIcon} />
                  <span className={styles.infoLabel}>Evento Ativo:</span>
                  <span className={styles.infoValue}>{activeEvent.name}</span>
                  {activeEvent.shortName && (
                    <span className={styles.eventShortName}>({activeEvent.shortName})</span>
                  )}
                </div>
              )}
            </div>

            <div className={styles.controlBar}>
              <button
                onClick={toggleFilters}
                className={styles.filterToggleButton}
                aria-expanded={filtersVisible}
                aria-label={filtersVisible ? "Ocultar filtros" : "Mostrar filtros"}
              >
                {filtersVisible ? (
                  <>Ocultar Filtros <FaTimes className={styles.toggleIcon} /></>
                ) : (
                  <>Filtros e Busca <FaFilter className={styles.toggleIcon} /></>
                )}
              </button>

              {/* Botões para alternar entre modo tabela e cards (visível apenas no desktop) */}
              <div className={styles.viewToggleContainer}>
                <button
                  onClick={() => setViewMode('table')}
                  className={`${styles.viewToggleButton} ${viewMode === 'table' ? styles.viewToggleActive : ''}`}
                  aria-label="Visualizar como tabela"
                  title="Visualizar como tabela"
                >
                  <FaTable />
                </button>
                <button
                  onClick={() => setViewMode('card')}
                  className={`${styles.viewToggleButton} ${viewMode === 'card' ? styles.viewToggleActive : ''}`}
                  aria-label="Visualizar como cards"
                  title="Visualizar como cards"
                >
                  <FaThLarge />
                </button>
              </div>
            </div>

            <div className={`${styles.filtersContainer} ${filtersVisible ? styles.filtersVisible : styles.filtersHidden}`}>
              <form onSubmit={handleSearch} className={styles.searchForm}>
                <Input
                  type="text"
                  placeholder="Buscar por nome, email, CPF ou telefone"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={<FaSearch />}
                  className={styles.searchInput}
                />
                <Button type="submit" variant="primary">
                  Buscar
                </Button>
              </form>

              <div className={styles.filtersRow}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>
                    <FaFilter className={styles.filterIcon} />
                    Papel:
                  </label>
                  <Select
                    options={roleOptions}
                    value={roleFilter}
                    onChange={handleRoleFilterChange}
                    className={styles.filterSelect}
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>
                    <FaSortAmountDown className={styles.filterIcon} />
                    Ordenar por:
                  </label>
                  <Select
                    options={sortOptions}
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className={styles.filterSelect}
                  />
                  <button
                    onClick={handleSortToggle}
                    className={styles.sortOrderButton}
                    aria-label="Alterar direção da ordenação"
                  >
                    {sortOrder === 'asc' ? (
                      <FaSortAmountUp className={styles.sortIcon} />
                    ) : (
                      <FaSortAmountDown className={styles.sortIcon} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Resumo dos filtros aplicados - visível quando os filtros estão escondidos */}
            {!filtersVisible && (search || roleFilter || sortBy !== 'name' || sortOrder !== 'asc') && (
              <div className={styles.appliedFilters}>
                <span>Filtros: </span>
                {search && <span className={styles.filterTag}>Busca: &quot;{search}&quot;</span>}
                {roleFilter && (
                  <span className={styles.filterTag}>
                    Papel: {roleOptions.find(o => o.id === roleFilter)?.name}
                  </span>
                )}
                {(sortBy !== 'name' || sortOrder !== 'asc') && (
                  <span className={styles.filterTag}>
                    Ordenado por: {sortOptions.find(o => o.id === sortBy)?.name} ({sortOrder === 'asc' ? 'crescente' : 'decrescente'})
                  </span>
                )}
              </div>
            )}

            {/* Visualização de tabela (desktop) */}
            {viewMode === 'table' && (
              <div className={styles.usersTableContainer}>
                <table className={styles.usersTable}>
                  <thead>
                    <tr>
                      <th>Ação</th>
                      <th>Usuário</th>
                      <th>Email/Celular</th>
                      <th>Cadastro</th>
                      <th>Trabalhos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr key={`user-row-${user.id}-${tooltipKey}`}>
                          <td>
                            <div className={styles.userInfo}>
                              {renderUserIcon(user)}
                            </div>
                          </td>
                          <td>
                            <div className={styles.userInfo}>
                              <div className={styles.userNameCPF}>
                                {<span className={styles.userName}>{user.name}</span>}
                                {user.cpf && <span className={styles.userCpf}>CPF: {user.cpf}</span>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className={styles.userEmailPhone}>
                              <span className={styles.userEmail}>{user.email}</span>
                              {user.phone && <span className={styles.userPhone}>{user.phone}</span>}
                            </div>
                          </td>
                          <td>
                            <div className={styles.dateTimeContainer}>
                              <div className={styles.dateValue}>{formatDate(user.createdAt)}</div>
                              <div className={styles.timeValue}>{formatTime(user.createdAt)}</div>
                            </div>
                          </td>
                          <td>
                            <div className={styles.papersCount}>
                              <FaFileAlt className={styles.paperIcon} />
                              <span>{user.papersCount}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className={styles.emptyState}>
                          <p>Nenhum usuário encontrado com os filtros selecionados.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Visualização de cards para desktop (modo grid) */}
            {viewMode === 'card' && (
              <div className={styles.desktopCardGrid}>
                {users.length > 0 ? (
                  users.map(user => renderDesktopCard(user))
                ) : (
                  <div className={styles.emptyState}>
                    <p>Nenhum usuário encontrado com os filtros selecionados.</p>
                  </div>
                )}
              </div>
            )}

            {/* Visualização compacta para mobile (sempre cards) */}
            <div className={styles.mobileCardList}>
              {users.length > 0 ? (
                users.map(user => renderCompactCard(user))
              ) : (
                <div className={styles.emptyState}>
                  <p>Nenhum usuário encontrado com os filtros selecionados.</p>
                </div>
              )}
            </div>

            {pagination.pages > 1 && (
              <div className={styles.paginationContainer}>
                <div className={styles.paginationControls}>
                  <Button
                    variant="text"
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                    className={`${styles.paginationButton} ${styles.desktopOnlyInline}`}
                  >
                    Primeira
                  </Button>

                  <Button
                    variant="text"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={styles.paginationButton}
                  >
                    Anterior
                  </Button>

                  <span className={styles.paginationInfo}>
                    {pagination.page}/{pagination.pages}
                  </span>

                  <Button
                    variant="text"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className={styles.paginationButton}
                  >
                    Próxima
                  </Button>

                  <Button
                    variant="text"
                    onClick={() => handlePageChange(pagination.pages)}
                    disabled={pagination.page === pagination.pages}
                    className={`${styles.paginationButton} ${styles.desktopOnlyInline}`}
                  >
                    Última
                  </Button>
                </div>
              </div>
            )}

            <div className={styles.resultsInfo}>
              <p>
                Exibindo {users.length} de {pagination.total} usuário{pagination.total !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {loading
        ? <LoadingSpinner />
        : <PageContainer>
            <MainContent />
          </PageContainer>
      }

      {/* Indicador de menu ativo */}
      {/* {activeRoleMenu && (
        <div className={styles.activeMenuIndicator}>
          <span>Menu ativo para {users.find(u => u.id === activeRoleMenu)?.name}</span>
          <button
            className={styles.closeIndicatorButton}
            onClick={() => setActiveRoleMenu(null)}
          >
            <FaTimes />
          </button>
        </div>
      )} */}

      {/* Portal para o menu flutuante */}
      {activeRoleMenu !== null && (
        <UserRoleMenu
          isOpen={true}
          anchorId={`user-role-avatar-${activeRoleMenu}`}
          user={users.find(u => u.id === activeRoleMenu)}
          availableRoles={roleOptions.filter(r => r.id !== '' && r.id !== users.find(u => u.id === activeRoleMenu)?.role)}
          currentRole={users.find(u => u.id === activeRoleMenu)?.role || ''}
          onRoleSelect={handleRoleSelect}
          onClose={() => setActiveRoleMenu(null)}
        />
      )}

      {/* Modal de confirmação com senha */}
      {pendingRoleChange && (
        <PasswordConfirmModal
          isOpen={passwordModalOpen}
          title="Confirmar alteração de privilégios"
          message="Para garantir a segurança, informe sua senha para alterar os privilégios deste usuário."
          confirmLabel="Alterar privilégios"
          onConfirm={handlePasswordConfirm}
          onCancel={handlePasswordModalClose}
          user={{ name: pendingRoleChange.userName }}
          actionDetails={{
            fromRoleName: pendingRoleChange.fromRoleName,
            toRoleName: pendingRoleChange.toRoleName
          }}
        />
      )}
    </>
  );
}