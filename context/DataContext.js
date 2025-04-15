'use client';

import { createContext, useContext, useState, useEffect } from 'react';

// Criar o contexto
const DataContext = createContext({
  ip: 'unknown',
  userAgent: 'unknown',
  isLoaded: false,
});

// Hook personalizado para usar o contexto
export const useDataContext = () => useContext(DataContext);

// Função para extrair IPv4
const extractIPv4 = (ip) => {
  if (!ip) return 'unknown';
  // Regex para encontrar endereço IPv4 na string
  const match = ip.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
  return match ? match[0] : 'unknown';
};

// Provider component
export function DataProvider({ children }) {
  const [metadata, setMetadata] = useState({
    ip: 'unknown',
    userAgent: 'unknown',
    isLoaded: false,
  });

  useEffect(() => {
    // Função para obter o IP
    const fetchIpInfo = async () => {
      try {
        // Usando um serviço público para obter o IP real do cliente
        const response = await fetch('https://api.ipify.org?format=json');
        if (response.ok) {
          const data = await response.json();
          setMetadata({
            ip: data.ip,
            userAgent: navigator.userAgent,
            isLoaded: true,
          });

          // Opcionalmente, salve em sessionStorage para persistência
          sessionStorage.setItem('auth_metadata', JSON.stringify({
            ip: data.ip,
            userAgent: navigator.userAgent,
            timestamp: new Date().getTime(),
          }));
        }
      } catch (error) {
        console.error('Erro ao obter informações de IP:', error);
        // Tentar usar outros métodos ou definir como desconhecido
        setMetadata({
          ip: 'unknown',
          userAgent: navigator.userAgent,
          isLoaded: true,
        });
      }
    };

    // Verificar se já temos os dados no sessionStorage (e se não são muito antigos)
    const storedMetadata = sessionStorage.getItem('auth_metadata');
    if (storedMetadata) {
      try {
        const parsedData = JSON.parse(storedMetadata);
        const isRecent = (new Date().getTime() - parsedData.timestamp) < 3600000; // 1 hora

        if (isRecent) {
          setMetadata({
            ip: parsedData.ip,
            userAgent: parsedData.userAgent,
            isLoaded: true,
          });
        } else {
          // Dados muito antigos, buscar novos
          fetchIpInfo();
        }
      } catch (e) {
        console.error('Erro ao recuperar metadata do sessionStorage:', e);
        fetchIpInfo();
      }
    } else {
      fetchIpInfo();
    }
  }, []);

  return (
    <DataContext.Provider value={metadata}>
      {children}
    </DataContext.Provider>
  );
}