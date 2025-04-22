'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';
import { FaBars, FaTimes, FaUser, FaSignOutAlt, FaFileAlt, FaCloudUploadAlt, FaHome, FaUsers, FaCog } from 'react-icons/fa';

const Header = () => {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); // Estado para controlar carregamento inicial
  const pathname = usePathname();
  const isAdmin = session?.user?.role === 'ADMIN' ||
    (session?.user?.organizationMemberships &&
    session.user.organizationMemberships.some(m => m.role === 'ADMIN'));

  // Verificar tamanho da tela e definir estado mobile
  useEffect(() => {
    setIsLoaded(true); // Marcar como carregado assim que o componente montar no cliente

    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    };

    // Verificar tamanho inicial
    checkScreenSize();

    // Adicionar listener para redimensionamento
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fechar menu ao navegar (importante para experiência móvel)
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Verificar se o link está ativo
  const isActive = (path) => {
    // Caso especial para a home page
    if (path === '/') {
      return pathname === '/';
    }

    // Caso especial para /paper (não deve ativar para subrotas)
    if (path === '/paper') {
      return pathname === '/paper' || pathname === '/paper/';
    }

    // Para outros caminhos, verificar se começam com o path
    // e se é exatamente a rota ou uma subrota direta
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        {/* Nav para Desktop ou Mobile com menu aberto */}
        <nav className={`${styles.nav}
                         ${isMobile ? styles.mobileNav : ''}
                         ${menuOpen ? styles.menuOpen : ''}
                         ${!isLoaded ? styles.hiddenOnLoad : ''}`}>
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

              {/* Menu item exclusivo para administradores */}
              {isAdmin && (
                <Link
                  href="/admin/organization/users"
                  className={`${styles.navLink} ${styles.adminLink} ${isActive('/admin/organization/users') ? styles.activeLink : ''}`}
                >
                  <FaUsers className={styles.navIcon} />
                  <span>Usuários</span>
                </Link>
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

        {/* Botão Menu Hambúrguer */}
        {(isMobile || !isLoaded) && (
          <button
            onClick={toggleMenu}
            className={styles.menuToggle}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        )}

        {/* Overlay para fechar menu ao clicar fora */}
        {isMobile && menuOpen && (
          <div
            className={styles.menuOverlay}
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
        )}
      </div>
    </header>
  );
}

export default Header;