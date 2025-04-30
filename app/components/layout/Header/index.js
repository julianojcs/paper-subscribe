'use client'

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';
import { FaBars, FaTimes, FaUser, FaSignOutAlt, FaFileAlt, FaCloudUploadAlt,
         FaHome, FaUsers, FaCog, FaBuilding, FaCaretDown, FaCalendarAlt } from 'react-icons/fa';

const Header = () => {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [adminSubmenuOpen, setAdminSubmenuOpen] = useState(false);
  const pathname = usePathname();
  const adminMenuRef = useRef(null);
  const menuRef = useRef(null);

  const isAdmin = session?.user?.role === 'ADMIN' ||
    (session?.user?.organizationMemberships &&
    session.user.organizationMemberships.some(m => m.role === 'ADMIN'));

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

                  <Link
                    href="/paper/subscribe"
                    className={`${styles.navLink} ${isActive('/paper/subscribe') ? styles.activeLink : ''}`}
                  >
                    <FaCloudUploadAlt className={styles.navIcon} />
                    <span>Enviar Trabalho</span>
                  </Link>

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
            </nav>
          </div>
        </header>
      )}

      {/* Versão mobile: apenas botão flutuante e menu lateral quando aberto */}
      {isMobile && isLoaded && (
        <>
          {/* Botão hamburger flutuante */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen(currentState => !currentState);
            }}
            onMouseDown={(e) => e.preventDefault()} // Prevenir comportamento padrão de mouseDown
            onTouchStart={(e) => e.preventDefault()} // Importante para dispositivos móveis
            className={`${styles.floatingMenuButton} ${menuOpen ? styles.floatingMenuButtonOpen : ''}`}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <FaTimes size={20} /> /* Tamanho em pixels */
            ) : (
              <FaBars size={20} />
            )}
          </button>

          {/* Menu lateral móvel */}
          {menuOpen && (
            <div className={styles.mobileMenuContainer} ref={menuRef}>
              <nav className={styles.mobileNav}>
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

                    <Link
                      href="/paper/subscribe"
                      className={`${styles.navLink} ${isActive('/paper/subscribe') ? styles.activeLink : ''}`}
                    >
                      <FaCloudUploadAlt className={styles.navIcon} />
                      <span>Enviar Trabalho</span>
                    </Link>

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