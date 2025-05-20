'use client'

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useDataContext } from '../../../../context/DataContext';
import styles from './Header.module.css';
import { FaBars, FaTimes, FaUser, FaSignOutAlt, FaFileAlt, FaCloudUploadAlt,
         FaHome, FaUsers, FaCog, FaBuilding, FaCaretDown, FaCalendarAlt,
         FaQuestionCircle, FaBan, FaLock } from 'react-icons/fa';

const Header = () => {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [adminSubmenuOpen, setAdminSubmenuOpen] = useState(false);
  const [buttonPosition, setButtonPosition] = useState('top'); // 'top' ou 'bottom'
  const pathname = usePathname();
  const adminMenuRef = useRef(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const dragStartRef = useRef(null);
  const isDraggingRef = useRef(false);

  const { eventData } = useDataContext();
  const [localEventData, setLocalEventData] = useState(null);

  // Carregar dados do evento do localStorage se não estiverem disponíveis no contexto
  useEffect(() => {
    if (!eventData && typeof window !== 'undefined') {
      try {
        const storedEventData = localStorage.getItem('event_data');
        if (storedEventData) {
          const parsedData = JSON.parse(storedEventData);
          setLocalEventData(parsedData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do evento do localStorage:', error);
      }
    }
  }, [eventData]);

  // Determinar os dados atuais do evento para verificações
  const currentEventData = eventData || localEventData;

  // Verificar se as submissões estão encerradas
  const isSubmissionClosed =
    currentEventData?.isSubmissionClosed ||
    currentEventData?.isReviewPhase ||
    currentEventData?.isEventFinished ||
    (currentEventData?.submissionEndDate && new Date(currentEventData.submissionEndDate) < new Date());

  const isAdmin = session?.user?.role === 'ADMIN' ||
    (session?.user?.organizationMemberships &&
    session.user.organizationMemberships.some(m => m.role === 'ADMIN'));

  // Carregar a preferência de posição do botão do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPosition = localStorage.getItem('menuButtonPosition');
      if (savedPosition) {
        setButtonPosition(savedPosition);
      }
    }
  }, []);

  // Verificar tamanho da tela e definir estado mobile
  useEffect(() => {
    setIsLoaded(true);

    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fechar submenu quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
        setAdminSubmenuOpen(false);
      }

      // Verificar se o clique NÃO foi no botão flutuante ou seus filhos
      const isFloatingButtonClick =
        event.target.classList.contains(styles.floatingMenuButton) ||
        event.target.closest(`.${styles.floatingMenuButton}`);

      // Fechar menu principal quando clicar fora (no mobile), exceto no botão
      if (isMobile && menuOpen &&
          menuRef.current &&
          !menuRef.current.contains(event.target) &&
          !isFloatingButtonClick) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, menuOpen]);

  // Fechar menu ao navegar
  useEffect(() => {
    setMenuOpen(false);
    setAdminSubmenuOpen(false);
  }, [pathname]);

  // Substituir o código do useEffect para eventos de toque
  useEffect(() => {
    const button = buttonRef.current;
    if (!button || !isMobile) return;

    // Variáveis para detectar se o usuário está arrastando ou apenas clicando
    let startX = 0;
    let startY = 0;
    let hasMoved = false;
    const moveThreshold = 10; // pixels para considerar um movimento como arraste

    const handleTouchStart = (e) => {
      // NÃO chamar e.preventDefault() aqui para permitir que o evento de clique ocorra
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      hasMoved = false;

      isDraggingRef.current = false; // Inicialmente não estamos arrastando
      dragStartRef.current = {
        y: startY,
        x: startX
      };
    };

    const handleTouchMove = (e) => {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = Math.abs(currentX - startX);
      const deltaY = Math.abs(currentY - startY);

      // Se o movimento exceder o limite, consideramos como um arraste
      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        hasMoved = true;
        isDraggingRef.current = true;

        // Adicionar classe visual para feedback do usuário
        button.classList.add(styles.dragging);

        // Prevenir apenas se estiver realmente arrastando
        e.preventDefault();

        // Aplicar transformação durante arraste para feedback visual
        const dragDistance = currentY - startY;
        button.style.transform = `translateY(${dragDistance}px)`;
      }
    };

    const handleTouchEnd = (e) => {
      // Se o usuário arrastou o botão
      if (hasMoved && isDraggingRef.current) {
        // Remover classe visual
        button.classList.remove(styles.dragging);

        // Resetar a transformação CSS
        button.style.transform = '';

        const dragDistance = e.changedTouches[0].clientY - startY;
        const windowHeight = window.innerHeight;

        // Se o usuário arrastou significativamente na direção vertical
        if (Math.abs(dragDistance) > windowHeight * 0.15) {
          const newPosition = buttonPosition === 'top' ? 'bottom' : 'top';
          setButtonPosition(newPosition);

          // Salvar a preferência no localStorage
          localStorage.setItem('menuButtonPosition', newPosition);
        }
      }

      isDraggingRef.current = false;
      hasMoved = false;
    };

    // Cancelar o arraste se o usuário sair da área do botão
    const handleTouchCancel = () => {
      button.style.transform = '';
      button.classList.remove(styles.dragging);
      isDraggingRef.current = false;
      hasMoved = false;
    };

    // Use passive: true para touchstart para não interferir no comportamento padrão de clique
    button.addEventListener('touchstart', handleTouchStart, { passive: true });

    // Use passive: false apenas para touchmove onde realmente precisamos impedir o comportamento padrão
    button.addEventListener('touchmove', handleTouchMove, { passive: false });
    button.addEventListener('touchend', handleTouchEnd);
    button.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      button.removeEventListener('touchstart', handleTouchStart);
      button.removeEventListener('touchmove', handleTouchMove);
      button.removeEventListener('touchend', handleTouchEnd);
      button.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [buttonPosition, isMobile]);

  // Verificar se o link está ativo
  const isActive = (path) => {
    if (path === '/') {
      return pathname === '/';
    }

    if (path === '/paper') {
      return pathname === '/paper' || pathname === '/paper/';
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const isAdminMenuActive = () => {
    return pathname.startsWith('/admin/organization');
  };

  const toggleMenu = () => {
    // Pequeno atraso para garantir que eventos em conflito não ocorram simultaneamente
    setTimeout(() => {
      setMenuOpen(prevState => !prevState);
    }, 10);
  };

  const toggleAdminSubmenu = (e) => {
    if (!isMobile) {
      e.preventDefault();
    }
    setAdminSubmenuOpen(!adminSubmenuOpen);
  };

  return (
    <>
      {/* Versão desktop: header normal */}
      {!isMobile && isLoaded && (
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <nav className={styles.nav}>
              {/* Item de Ajuda no canto esquerdo */}
              <div className={styles.leftNavItems}>
                <Link
                  href="/help"
                  className={`${styles.navLink} ${isActive('/help') ? styles.activeLink : ''}`}
                >
                  <FaQuestionCircle className={styles.navIcon} />
                  <span>Ajuda</span>
                </Link>
              </div>

              {/* Itens de navegação principais à direita */}
              <div className={styles.rightNavItems}>
                <Link
                  href="/"
                  className={`${styles.navLink} ${isActive('/') ? styles.activeLink : ''}`}
                >
                  <FaHome className={styles.navIcon} />
                  <span>Home</span>
                </Link>

                {session ? (
                  <>
                    <Link
                      href="/paper"
                      className={`${styles.navLink} ${isActive('/paper') ? styles.activeLink : ''}`}
                    >
                      <FaFileAlt className={styles.navIcon} />
                      <span>Meus Trabalhos</span>
                    </Link>

                    {isSubmissionClosed ? (
                      <span className={`${styles.disabledLink}`}>
                        <span className={`${styles.navIcon} ${styles.bannedIcon}`}>
                          <FaCloudUploadAlt />
                        </span>
                        <span>Enviar Trabalho</span>
                      </span>
                    ) : (
                      <Link
                        href="/paper/subscribe"
                        className={`${styles.navLink} ${isActive('/paper/subscribe') ? styles.activeLink : ''}`}
                      >
                        <FaCloudUploadAlt className={styles.navIcon} />
                        <span>Enviar Trabalho</span>
                      </Link>
                    )}

                    {/* Menu da Empresa para administradores */}
                    {isAdmin && (
                      <div className={styles.adminMenuContainer} ref={adminMenuRef}>
                        <a
                          href="#"
                          className={`${styles.navLink} ${styles.adminLink} ${isAdminMenuActive() ? styles.activeLink : ''}`}
                          onClick={toggleAdminSubmenu}
                        >
                          <FaBuilding className={styles.navIcon} />
                          <span>Empresa</span>
                          <FaCaretDown className={`${styles.submenuIndicator} ${adminSubmenuOpen ? styles.rotated : ''}`} />
                        </a>

                        <div className={`${styles.submenuContainer} ${adminSubmenuOpen ? styles.submenuVisible : ''}`}>
                          <Link
                            href="/admin/organization/users"
                            className={`${styles.submenuLink} ${isActive('/admin/organization/users') ? styles.activeSubmenuLink : ''}`}
                          >
                            <FaUsers className={styles.submenuIcon} />
                            <span>Usuários</span>
                          </Link>

                          <Link
                            href="/admin/organization/settings"
                            className={`${styles.submenuLink} ${isActive('/admin/organization/settings') ? styles.activeSubmenuLink : ''}`}
                          >
                            <FaCog className={styles.submenuIcon} />
                            <span>Configurações</span>
                          </Link>

                          <Link
                            href="/admin/organization/events"
                            className={`${styles.submenuLink} ${isActive('/admin/organization/events') ? styles.activeSubmenuLink : ''}`}
                          >
                            <FaCalendarAlt className={styles.submenuIcon} />
                            <span>Eventos</span>
                          </Link>
                        </div>
                      </div>
                    )}

                    <Link
                      href="/profile"
                      className={`${styles.navLink} ${isActive('/profile') ? styles.activeLink : ''}`}
                    >
                      <FaUser className={styles.navIcon} />
                      <span>Perfil</span>
                    </Link>

                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className={styles.signOutButton}
                    >
                      <FaSignOutAlt className={styles.navIcon} />
                      <span>Sair</span>
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className={`${styles.navLink} ${isActive('/login') ? styles.activeLink : ''}`}
                  >
                    <FaUser className={styles.navIcon} />
                    <span>Entrar</span>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </header>
      )}

      {/* Versão mobile: apenas botão flutuante e menu lateral quando aberto */}
      {isMobile && isLoaded && (
        <>
          {/* Botão hamburger flutuante com posição dinâmica */}
          <button
            ref={buttonRef}
            onClick={(e) => {
              // Somente abrir/fechar o menu se não estiver arrastando
              if (!isDraggingRef.current) {
                setMenuOpen(currentState => !currentState);
              }
            }}
            className={`
              ${styles.floatingMenuButton}
              ${menuOpen ? styles.floatingMenuButtonOpen : ''}
              ${buttonPosition === 'bottom' ? styles.floatingMenuButtonBottom : styles.floatingMenuButtonTop}
            `}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <FaTimes size={20} />
            ) : (
              <FaBars size={20} />
            )}
          </button>

          {/* Menu lateral móvel */}
          {menuOpen && (
            <div className={styles.mobileMenuContainer} ref={menuRef}>
              <nav className={styles.mobileNav}>
                <div className={styles.mobileNavTop}>
                  <Link
                    href="/"
                    className={`${styles.navLink} ${isActive('/') ? styles.activeLink : ''}`}
                  >
                    <FaHome className={styles.navIcon} />
                    <span>Home</span>
                  </Link>

                  {session ? (
                    <>
                      <Link
                        href="/paper"
                        className={`${styles.navLink} ${isActive('/paper') ? styles.activeLink : ''}`}
                      >
                        <FaFileAlt className={styles.navIcon} />
                        <span>Meus Trabalhos</span>
                      </Link>

                      {isSubmissionClosed ? (
                        <span className={`${styles.disabledLink}`}>
                          <span className={`${styles.navIcon} ${styles.bannedIcon}`}>
                            <FaCloudUploadAlt />
                          </span>
                          <span>Enviar Trabalho</span>
                        </span>
                      ) : (
                        <span className={`${styles.disabledLink}`}>
                          <span className={`${styles.navIcon} ${styles.bannedIcon}`}>
                            <FaCloudUploadAlt />
                          </span>
                          <span>Enviar Trabalho</span>
                        </span>
                      )}
                      {/* <Link
                        href="/paper/subscribe"
                        className={`${styles.navLink} ${isActive('/paper/subscribe') ? styles.activeLink : ''} ${isSubmissionClosed ? styles.disabledLink : ''}`}
                        onClick={(e) => {
                          if (isSubmissionClosed) {
                            e.preventDefault();
                            alert("O período de submissão de trabalhos está encerrado.");
                          }
                        }}
                      >
                        {isSubmissionClosed ? (
                          <FaLock className={styles.navIcon} />
                        ) : (
                          <FaCloudUploadAlt className={styles.navIcon} />
                        )}
                        <span>Enviar Trabalho</span>
                      </Link> */}

                      {/* Menu da Empresa para administradores */}
                      {isAdmin && (
                        <>
                          <button
                            className={`${styles.navLink} ${styles.adminLink} ${isAdminMenuActive() ? styles.activeLink : ''}`}
                            onClick={toggleAdminSubmenu}
                          >
                            <FaBuilding className={styles.navIcon} />
                            <span>Empresa</span>
                            <FaCaretDown className={`${styles.submenuIndicator} ${adminSubmenuOpen ? styles.rotated : ''}`} />
                          </button>

                          {adminSubmenuOpen && (
                            <div className={styles.mobileSubmenu}>
                              <Link
                                href="/admin/organization/users"
                                className={`${styles.submenuLink} ${isActive('/admin/organization/users') ? styles.activeSubmenuLink : ''}`}
                              >
                                <FaUsers className={styles.submenuIcon} />
                                <span>Usuários</span>
                              </Link>

                              <Link
                                href="/admin/organization/settings"
                                className={`${styles.submenuLink} ${isActive('/admin/organization/settings') ? styles.activeSubmenuLink : ''}`}
                              >
                                <FaCog className={styles.submenuIcon} />
                                <span>Configurações</span>
                              </Link>

                              <Link
                                href="/admin/organization/events"
                                className={`${styles.submenuLink} ${isActive('/admin/organization/events') ? styles.activeSubmenuLink : ''}`}
                              >
                                <FaCalendarAlt className={styles.submenuIcon} />
                                <span>Eventos</span>
                              </Link>
                            </div>
                          )}
                        </>
                      )}

                      <Link
                        href="/profile"
                        className={`${styles.navLink} ${isActive('/profile') ? styles.activeLink : ''}`}
                      >
                        <FaUser className={styles.navIcon} />
                        <span>Perfil</span>
                      </Link>

                      <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className={styles.signOutButton}
                      >
                        <FaSignOutAlt className={styles.navIcon} />
                        <span>Sair</span>
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      className={`${styles.navLink} ${isActive('/login') ? styles.activeLink : ''}`}
                    >
                      <FaUser className={styles.navIcon} />
                      <span>Entrar</span>
                    </Link>
                  )}
                </div>

                {/* Item de Ajuda posicionado no fim do menu mobile */}
                <div className={styles.mobileNavBottom}>
                  <Link
                    href="/help"
                    className={`${styles.navLink} ${isActive('/help') ? styles.activeLink : ''}`}
                  >
                    <FaQuestionCircle className={styles.navIcon} />
                    <span>Ajuda</span>
                  </Link>
                </div>
              </nav>
            </div>
          )}

          {/* Overlay que cobre a tela quando o menu estiver aberto */}
          {menuOpen && (
            <div
              className={styles.menuOverlay}
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
          )}
        </>
      )}
    </>
  );
};

export default Header;