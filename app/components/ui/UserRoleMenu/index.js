// app/components/ui/UserRoleMenu/UserRoleMenu.js
'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaUserShield, FaUserTie, FaUserEdit, FaUserGraduate, FaCheckCircle } from 'react-icons/fa';
import styles from './UserRoleMenu.module.css';
import useAnchoredPosition from '../../../hooks/useAnchoredPosition';

const UserRoleMenu = ({
  isOpen,
  anchorId,
  user,
  availableRoles,
  currentRole,
  onRoleSelect,
  onClose
}) => {
  const menuRef = useRef(null);
  const [mounted, setMounted] = useState(false);
console.log('user', user);
console.log('currentRole', currentRole);

  // Montar o componente apenas no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Usar o hook de posicionamento ancorado
  const { supportsAnchor, menuPosition } = useAnchoredPosition(
    menuRef,
    { current: mounted ? document.getElementById(anchorId) : null },
    isOpen,
    {
      position: 'bottom-start',  // Posicionar abaixo e alinhado à esquerda
      offset: 4,                 // Espaço entre o âncora e o menu
      flip: true,                // Virar o menu se não couber abaixo
      shift: true,               // Deslocar o menu se não couber na tela
      fallbackPlacements: ['top-start', 'bottom-end', 'top-end'] // Opções alternativas
    }
  );

  // Fechar o menu quando clicar fora dele
  useEffect(() => {
    if (!isOpen || !mounted) return;

    const handleClickOutside = (event) => {
      const anchorElement = document.getElementById(anchorId);
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !(anchorElement && anchorElement.contains(event.target))
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, anchorId, onClose, mounted]);

  const getRoleIcon = (roleId) => {
    switch (roleId) {
      case 'ADMIN': return <FaUserShield className={styles.roleIcon} />;
      case 'MANAGER': return <FaUserTie className={styles.roleIcon} />;
      case 'REVIEWER': return <FaUserEdit className={styles.roleIcon} />;
      default: return <FaUserGraduate className={styles.roleIcon} />;
    }
  };

  const getRoleClass = (roleId) => {
    switch (roleId) {
      case 'ADMIN': return styles.adminRole;
      case 'MANAGER': return styles.managerRole;
      case 'REVIEWER': return styles.reviewerRole;
      default: return styles.memberRole;
    }
  };

  const handleRoleClick = (roleId) => {
    if (roleId !== currentRole) {
      onRoleSelect(user, roleId);
    }
    onClose();
  };

  if (!isOpen || !mounted) return null;

  // Menu com posicionamento apropriado
  const menu = (
    <div
      ref={menuRef}
      className={styles.menu}
      style={
        supportsAnchor
          ? {
              positionAnchor: `--anchor-avatar-${user.id}`,
              positionArea: 'end',
              positionTryFallbacks: 'flip-block'
            }
          : {
              position: 'fixed',
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              zIndex: 9999,
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              minWidth: '180px',
              maxWidth: '280px',
            }
      }
    >
      <div className={styles.menuContent}>
        <div className={`${styles.menuHeader} ${getRoleClass(currentRole)}`}>
          <span className={styles.menuIcon}>{getRoleIcon(currentRole)}</span>
          <span className={`${styles.menuAvatarName}`}>{user.name}</span>
        </div>
        <div className={styles.menuOptions}>
          {availableRoles.map((role) => (
            <button
              key={role.id}
              className={`${styles.roleOption} ${getRoleClass(role.id)} ${role.id === currentRole ? styles.activeRole : ''}`}
              onClick={() => handleRoleClick(role.id)}
              disabled={role.id === currentRole}
            >
              <span className={styles.menuIcon}>{getRoleIcon(role.id)}</span>
              <span>{role.name}</span>
              {role.id === currentRole && (
                <FaCheckCircle style={{ color: '#3b82f6', marginLeft: '0.5rem' }} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(menu, document.body);
};

export default UserRoleMenu;
