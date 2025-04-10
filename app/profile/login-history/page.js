'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css'; // Usar o arquivo CSS local
import Button from '../../components/ui/Button';

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
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
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
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Método</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.map((log, index) => (
                  <tr key={index} className={log.success ? styles.successRow : styles.failedRow}>
                    <td>{formatDate(log.createdAt)}</td>
                    <td>
                      {log.loginType === 'credentials' ? 'Email e Senha' : 
                      log.loginType.charAt(0).toUpperCase() + log.loginType.slice(1)}
                    </td>
                    <td>{log.success ? 'Bem-sucedido' : 'Falhou'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Exibir a paginação apenas se houver mais de uma página */}
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