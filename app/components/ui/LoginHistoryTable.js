'use client';

import { useEffect, useState } from 'react';
import styles from './LoginHistoryTable.module.css';
import Tooltip from './Tooltip';
import {
  FaGoogle, FaKey, FaCheck, FaTimes,
  FaDesktop, FaMobile, FaTablet,
  FaWindows, FaApple, FaAndroid, FaLinux,
  FaChrome, FaFirefox, FaSafari, FaEdge, FaOpera,
  FaNetworkWired
} from 'react-icons/fa';

export default function LoginHistoryTable({
  loginHistory,
  compactMode = false // Novo parâmetro para modo compacto (usado em listas resumidas)
}) {
  const [isMobile, setIsMobile] = useState(false);

  // Detectar se estamos em dispositivo móvel
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Determinar quais colunas mostrar com base no modo e no tamanho da tela
  const showIP = !compactMode || !isMobile;
  const showDevices = !compactMode || !isMobile;

  return (
    <table className={styles.historyTable}>
      <thead>
        <tr>
          <th>Data/Hora</th>
          <th>Método</th>
          <th>Status</th>
          {showIP && <th className={styles.responsiveColumn}>IP</th>}
          {showDevices && <th className={styles.responsiveColumn}>Dispositivo</th>}
        </tr>
      </thead>
      <tbody>
        {loginHistory.map((log, index) => (
          <tr key={index} className={log.success ? styles.successRow : styles.failedRow}>
            <td>
              <DateTimeCell dateString={log.createdAt} />
            </td>
            <td className={styles.iconCell}>
              <LoginMethodCell loginType={log.loginType} />
            </td>
            <td className={styles.iconCell}>
              <StatusCell success={log.success} />
            </td>
            {showIP && (
              <td>
                <IPAddressCell ip={log.ip} />
              </td>
            )}
            {showDevices && (
              <td className={styles.deviceIconsCell}>
                <DeviceInfoCell userAgent={log.userAgent} />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Sub-componentes para cada tipo de célula
function DateTimeCell({ dateString }) {
  const date = new Date(dateString);
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return (
    <div className={styles.dateTimeContainer}>
      <span className={styles.dateValue}>{`${day}/${month}/${year}`}</span>
      <span className={styles.timeValue}>{`${hours}:${minutes}`}</span>
    </div>
  );
}

function LoginMethodCell({ loginType }) {
  const getLoginTypeIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'credentials':
        return <FaKey className={`${styles.methodIcon} ${styles.credentialsIcon}`} />;
      case 'google':
        return <FaGoogle className={`${styles.methodIcon} ${styles.googleIcon}`} />;
      default:
        return <FaKey className={`${styles.methodIcon} ${styles.defaultIcon}`} />;
    }
  };

  return (
    <Tooltip content={loginType === 'credentials' 
      ? 'Email e Senha' 
      : loginType?.charAt(0).toUpperCase() + loginType?.slice(1) || 'Desconhecido'}>
      {getLoginTypeIcon(loginType)}
    </Tooltip>
  );
}

function StatusCell({ success }) {
  return (
    <Tooltip content={success ? 'Bem-sucedido' : 'Falhou'}>
      {success ? 
        <FaCheck className={`${styles.statusIcon} ${styles.successIcon}`} /> : 
        <FaTimes className={`${styles.statusIcon} ${styles.failedIcon}`} />
      }
    </Tooltip>
  );
}

function IPAddressCell({ ip }) {
  const formatIP = (ipAddress) => {
    if (!ipAddress || ipAddress === 'unknown') return 'Desconhecido';
    
    // Para IPs IPv4, adicione formatação
    const ipv4Pattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (ipv4Pattern.test(ipAddress)) {
      const parts = ipAddress.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.*`;
      }
    }
    
    return ipAddress;
  };

  return (
    <Tooltip content={`Endereço IP: ${ip || 'Desconhecido'}`}>
      <div className={styles.ipContainer}>
        <FaNetworkWired className={styles.ipIcon} />
        <span className={styles.ipValue}>{formatIP(ip)}</span>
      </div>
    </Tooltip>
  );
}

function DeviceInfoCell({ userAgent }) {
  return (
    <div className={styles.deviceIcons}>
      <Tooltip content={getOSName(userAgent)}>
        {getOSIcon(userAgent)}
      </Tooltip>
      <Tooltip content={getDeviceTypeName(userAgent)}>
        {getDeviceTypeIcon(userAgent)}
      </Tooltip>
      <Tooltip content={getBrowserName(userAgent)}>
        {getBrowserIcon(userAgent)}
      </Tooltip>
    </div>
  );
}

// Função para obter o ícone do sistema operacional
function getOSIcon(userAgent) {
  if (!userAgent) return <FaDesktop className={`${styles.deviceIcon} ${styles.defaultIcon}`} />;
  
  if (userAgent.includes('Android')) {
    return <FaAndroid className={`${styles.deviceIcon} ${styles.androidIcon}`} />;
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('iOS')) {
    return <FaApple className={`${styles.deviceIcon} ${styles.appleIcon}`} />;
  } else if (userAgent.includes('Mac OS')) {
    return <FaApple className={`${styles.deviceIcon} ${styles.macIcon}`} />;
  } else if (userAgent.includes('Windows')) {
    return <FaWindows className={`${styles.deviceIcon} ${styles.windowsIcon}`} />;
  } else if (userAgent.includes('Linux')) {
    return <FaLinux className={`${styles.deviceIcon} ${styles.linuxIcon}`} />;
  } else {
    return <FaDesktop className={`${styles.deviceIcon} ${styles.defaultIcon}`} />;
  }
}

// Função para obter o nome do sistema operacional
function getOSName(userAgent) {
  if (!userAgent) return 'Sistema desconhecido';
  
  if (userAgent.includes('Android')) {
    return 'Android';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iOS')) {
    return 'iOS';
  } else if (userAgent.includes('iPad')) {
    return 'iPadOS';
  } else if (userAgent.includes('Mac OS')) {
    return 'macOS';
  } else if (userAgent.includes('Windows')) {
    return 'Windows';
  } else if (userAgent.includes('Linux')) {
    return 'Linux';
  } else {
    return 'Sistema desconhecido';
  }
}

// Função para obter o ícone do tipo de dispositivo
function getDeviceTypeIcon(userAgent) {
  if (!userAgent) return <FaDesktop className={styles.deviceIcon} />;
  
  if (userAgent.includes('Mobile') || userAgent.includes('iPhone')) {
    return <FaMobile className={`${styles.deviceIcon} ${styles.mobileIcon}`} />;
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    return <FaTablet className={`${styles.deviceIcon} ${styles.tabletIcon}`} />;
  } else {
    return <FaDesktop className={`${styles.deviceIcon} ${styles.desktopIcon}`} />;
  }
}

// Função para obter o nome do tipo de dispositivo
function getDeviceTypeName(userAgent) {
  if (!userAgent) return 'Dispositivo desconhecido';
  
  if (userAgent.includes('Mobile') || userAgent.includes('iPhone')) {
    return 'Celular';
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    return 'Tablet';
  } else {
    return 'Desktop';
  }
}

// Função para obter o ícone do navegador
function getBrowserIcon(userAgent) {
  if (!userAgent) return <FaChrome className={`${styles.deviceIcon} ${styles.defaultIcon}`} />;
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    return <FaChrome className={`${styles.deviceIcon} ${styles.chromeIcon}`} />;
  } else if (userAgent.includes('Firefox')) {
    return <FaFirefox className={`${styles.deviceIcon} ${styles.firefoxIcon}`} />;
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return <FaSafari className={`${styles.deviceIcon} ${styles.safariIcon}`} />;
  } else if (userAgent.includes('Edg')) {
    return <FaEdge className={`${styles.deviceIcon} ${styles.edgeIcon}`} />;
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    return <FaOpera className={`${styles.deviceIcon} ${styles.operaIcon}`} />;
  } else {
    return <FaChrome className={`${styles.deviceIcon} ${styles.defaultIcon}`} />;
  }
}

// Função para obter o nome do navegador
function getBrowserName(userAgent) {
  if (!userAgent) return 'Navegador desconhecido';
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    return 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    return 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return 'Safari';
  } else if (userAgent.includes('Edg')) {
    return 'Edge';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    return 'Opera';
  } else {
    return 'Navegador desconhecido';
  }
}