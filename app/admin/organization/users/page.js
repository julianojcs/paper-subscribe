'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  FaSearch, FaFilter, FaSortAmountDown, FaSortAmountUp, FaUserShield,
  FaUserGraduate, FaSpinner, FaFileAlt, FaCalendarAlt, FaBuilding, FaTimes,
  FaTable, FaThLarge, FaUserCog, FaUserTie, FaUserEdit
} from 'react-icons/fa';

import Button from '../../../components/ui/Button';
import PageHeader from '../../../components/ui/PageHeader';
import NoAccessPage from '../../../components/ui/NoAccessPage';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Tooltip from '../../../components/ui/Tooltip';
import UserRoleModal from '../../../components/ui/UserRoleModal';
import styles from './users.module.css';
import HeaderContentTitle from '../../../components/layout/HeaderContentTitle';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import PageContainer from '../../../components/layout/PageContainer';

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

  // Novo estado para gerenciamento de papel de usuário
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserRoleModalOpen, setIsUserRoleModalOpen] = useState(false);
  const [roleChangeSuccess, setRoleChangeSuccess] = useState(null);

  const { data: session, status } = useSession();
  const router = useRouter();

  // Verificar permissão para acessar a página
  const [hasAccess, setHasAccess] = useState(false);
  // Verificar se o usuário atual é admin
  const [isAdmin, setIsAdmin] = useState(false);

  // Opções de papéis disponíveis
  const roleOptions = [
    { id: '', name: 'Todos' },
    { id: 'ADMIN', name: 'Administrador' },
    { id: 'MANAGER', name: 'Gerente' },
    { id: 'REVIEWER', name: 'Revisor' },
    { id: 'MEMBER', name: 'Membro' }
  ];

  const sortOptions = [
    { id: 'name', name: 'Nome' },
    { id: 'email', name: 'Email' },
    { id: 'createdAt', name: 'Data de cadastro' },
    { id: 'papersCount', name: 'Quantidade de trabalhos' }
  ];

  // Verificar permissões do usuário
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      setIsAdmin(session.user.role === 'ADMIN');
    }
  }, [status, router, session]);

  // Efeito para detectar tamanho da tela e ajustar modo de visualização
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('card');
      }
    };

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
    setPagination(prev => ({ ...prev, page: 1 }));
    if (window.innerWidth < 768) {
      setFiltersVisible(false);
    }
  };

  const handleSortToggle = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
    setTooltipKey(prevKey => prevKey + 1);
  };

  const toggleFilters = () => {
    setFiltersVisible(prev => !prev);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'table' ? 'card' : 'table');
  };

  // Formatação de data e hora
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Novo - Manipuladores para alteração de role do usuário
  const handleOpenUserRoleModal = (user) => {
    setSelectedUser(user);
    setIsUserRoleModalOpen(true);
  };

  const handleCloseUserRoleModal = () => {
    setIsUserRoleModalOpen(false);
    setSelectedUser(null);
  };

  const handleRoleChange = async ({ userId, newRole, password }) => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newRole, password })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Não foi possível alterar o papel do usuário.'
        };
      }

      // Atualizar a lista de usuários localmente
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      // Mostrar mensagem de sucesso temporária
      setRoleChangeSuccess({
        userId,
        message: `Papel do usuário alterado com sucesso para ${getRoleName(newRole)}`
      });

      setTimeout(() => {
        setRoleChangeSuccess(null);
      }, 5000);

      return { success: true };
    } catch (error) {
      console.error('Erro ao alterar papel do usuário:', error);
      return {
        success: false,
        error: 'Erro ao processar a solicitação. Tente novamente.'
      };
    }
  };

  // Função para obter o nome amigável do papel
  const getRoleName = (roleId) => {
    const role = roleOptions.find(r => r.id === roleId);
    return role ? role.name : roleId;
  };

  // Renderizar o ícone do usuário com Tooltip de forma segura
  const renderUserIcon = (user) => {
    let roleInfo, iconComponent;

    switch (user.role) {
      case 'ADMIN':
        roleInfo = { name: 'Administrador', class: styles.adminAvatar };
        iconComponent = <FaUserShield className={styles.roleIcon} />;
        break;
      case 'MANAGER':
        roleInfo = { name: 'Gerente', class: styles.managerAvatar };
        iconComponent = <FaUserTie className={styles.roleIcon} />;
        break;
      case 'REVIEWER':
        roleInfo = { name: 'Revisor', class: styles.reviewerAvatar };
        iconComponent = <FaUserEdit className={styles.roleIcon} />;
        break;
      default:
        roleInfo = { name: 'Membro', class: styles.memberAvatar };
        iconComponent = <FaUserGraduate className={styles.roleIcon} />;
    }

    return (
      <div key={`user-icon-${user.id}-${tooltipKey}`}>
        <Tooltip content={roleInfo.name}>
          <div className={roleInfo.class}>
            {iconComponent}
          </div>
        </Tooltip>
      </div>
    );
  };

  // Renderizar os botões de ação do usuário
  const renderUserActions = (user) => {
    if (user.id === session?.user?.id) return null;

    return (
      <div className={styles.userActions}>
        {isAdmin && (
          <Button
            variant="icon"
            className={styles.actionButton}
            onClick={() => handleOpenUserRoleModal(user)}
            title="Alterar papel do usuário"
          >
            <FaUserCog />
          </Button>
        )}
      </div>
    );
  };

  // Renderizar card compacto para mobile com ações do usuário
  const renderCompactCard = (user) => {
    const isCurrentUserCard = user.id === session?.user?.id;
    const showRoleSuccessMessage = roleChangeSuccess?.userId === user.id;

    return (
      <div
        key={`user-compact-card-${user.id}-${tooltipKey}`}
        className={`${styles.compactCard} ${isCurrentUserCard ? styles.currentUserCard : ''}`}
      >
        <div className={styles.compactCardContent}>
          <div className={styles.compactUserInfo}>
            {renderUserIcon(user)}
            <div className={styles.compactUserDetails}>
              <div className={styles.userName}>
                {user.name}
                {isCurrentUserCard && <span className={styles.currentUser}>(Você)</span>}
              </div>
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
            {renderUserActions(user)}
          </div>
        </div>

        {showRoleSuccessMessage && (
          <div className={styles.roleChangeSuccess}>
            {roleChangeSuccess.message}
          </div>
        )}
      </div>
    );
  };

  // Renderizar card normal para desktop (modo grid) com ações do usuário
  const renderDesktopCard = (user) => {
    const isCurrentUserCard = user.id === session?.user?.id;
    const showRoleSuccessMessage = roleChangeSuccess?.userId === user.id;

    return (
      <div
        key={`user-desktop-card-${user.id}-${tooltipKey}`}
        className={`${styles.desktopCard} ${isCurrentUserCard ? styles.currentUserCard : ''}`}
      >
        <div className={styles.cardHeader}>
          {renderUserIcon(user)}
          <h3 className={styles.cardName}>
            {user.name}
            {isCurrentUserCard && <span className={styles.currentUser}>(Você)</span>}
          </h3>
          {renderUserActions(user)}
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

        {showRoleSuccessMessage && (
          <div className={styles.roleChangeSuccess}>
            {roleChangeSuccess.message}
          </div>
        )}
      </div>
    );
  };

  // Exibir mensagem de acesso negado
  if (status === 'authenticated' && !hasAccess && !loading) {
    return (
      <NoAccessPage
        title="Acesso Restrito"
        message="Você não tem permissão para acessar esta página. Apenas administradores podem visualizar usuários da organização."
      />
    );
  }

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

            {viewMode === 'table' && (
              <div className={styles.usersTableContainer}>
                <table className={styles.usersTable}>
                  <thead>
                    <tr>
                      <th>Usuário</th>
                      <th>Email/Celular</th>
                      <th>Cadastro</th>
                      <th><FaFileAlt className={styles.paperIcon} /></th>
                      {isAdmin && <th className={styles.actionsColumn}>Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((user) => {
                        const isCurrentUser = user.id === session?.user?.id;
                        const showRoleSuccessMessage = roleChangeSuccess?.userId === user.id;

                        return (
                          <tr
                            key={`user-row-${user.id}-${tooltipKey}`}
                            className={isCurrentUser ? styles.currentUserRow : ''}
                          >
                            <td>
                              <div className={styles.userInfo}>
                                {renderUserIcon(user)}
                                <div className={styles.userNameCPF}>
                                  {<span className={styles.userName}>
                                    {user.name}
                                    {isCurrentUser && <span className={styles.currentUser}>(Você)</span>}
                                  </span>}
                                  {user.cpf && <span className={styles.userCpf}>CPF: {user.cpf}</span>}
                                </div>
                              </div>
                              {showRoleSuccessMessage && (
                                <div className={styles.roleChangeSuccess}>
                                  {roleChangeSuccess.message}
                                </div>
                              )}
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
                            {isAdmin && (
                              <td className={styles.actionsCell}>
                                {!isCurrentUser && renderUserActions(user)}
                              </td>
                            )}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={isAdmin ? "5" : "4"} className={styles.emptyState}>
                          <p>Nenhum usuário encontrado com os filtros selecionados.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

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

        {selectedUser && (
          <UserRoleModal
            isOpen={isUserRoleModalOpen}
            onClose={handleCloseUserRoleModal}
            user={selectedUser}
            availableRoles={roleOptions.filter(r => r.id !== '')}
            onRoleChange={handleRoleChange}
          />
        )}
      </>
    );
  }

  return (
    <>
      {loading && !users.length
        ? <LoadingSpinner />
        : <PageContainer>
            <MainContent />
          </PageContainer>
      }
    </>
  );
}