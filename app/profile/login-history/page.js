'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Button from '../../components/ui/Button';
import Tooltip from '../../components/ui/Tooltip'; // Importe o componente Tooltip
import LoginHistoryTable from '../../components/ui/LoginHistoryTable';


export default function LoginHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchLoginHistory(currentPage);
    }
  }, [status, router, currentPage]);
  
  const fetchLoginHistory = async (page) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/user/login-history?page=${page}&limit=10`);
      const data = await res.json();
      
      if (res.ok) {
        setLoginHistory(data.loginLogs);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError('Não foi possível carregar o histórico de login');
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de login:', error);
      setError('Erro ao carregar o histórico de login');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para formatar a data de forma mais elegante
  function formatDate(dateString) {
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

  // Adicione esta função para formatar o IP
  function formatIP(ip) {
    if (!ip || ip === 'unknown') return 'Desconhecido';
    
    // Para IPs IPv4, adicione formatação
    const ipv4Pattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (ipv4Pattern.test(ip)) {
      // Retorne os primeiros dígitos e some pontos para privacidade parcial
      // Por exemplo 192.168.1.1 -> 192.168.1.*
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.*`;
      }
    }
    
    return ip;
  }
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  if (status === 'loading') {
    return <div className={styles.loading}>Carregando...</div>;
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Histórico de Login</h1>
        <Button onClick={() => router.push('/profile')} variant="secondary">
          Voltar ao perfil
        </Button>
      </div>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.loginHistory}>
        {loading ? (
          <div className={styles.loading}>Carregando histórico...</div>
        ) : loginHistory.length > 0 ? (
          <>
            <LoginHistoryTable 
              loginHistory={loginHistory} 
              compactMode={false} 
            />
            
            {totalPages > 1 && (
              <div className={styles.paginationContainer}>
                <div className={styles.pagination}>
                  <Button 
                    onClick={handlePrevPage} 
                    disabled={currentPage === 1}
                    variant="outline"
                  >
                    Anterior
                  </Button>
                  <span className={styles.pageInfo}>
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button 
                    onClick={handleNextPage} 
                    disabled={currentPage === totalPages}
                    variant="outline"
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <p>Nenhum registro de login encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}