'use client';

import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './page.module.css';
import Button from '/app/components/ui/Button';
import Input from '/app/components/ui/Input';

export default function VerifyTokenPage() {
  const { data: session, update } = useSession({ required: true });
  const router = useRouter();
  
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Se o usuário já tiver um token verificado, redirecionar para o dashboard
  useEffect(() => {
    if (session?.user?.eventTokenVerified) {
      router.push('/');
    }
  }, [session, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!token.trim()) {
      setError('Por favor, informe um token');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Verificar se o token é válido
      const validateResponse = await fetch('/api/events/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      const validateData = await validateResponse.json();
      
      if (!validateResponse.ok || !validateData.valid) {
        setError(validateData.message || 'Token inválido ou expirado');
        return;
      }
      
      // Associar o token à conta do usuário
      const linkResponse = await fetch('/api/auth/link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      const linkData = await linkResponse.json();
      
      if (!linkResponse.ok) {
        setError(linkData.message || 'Erro ao associar token à sua conta');
        return;
      }
      
      // Atualizar a sessão para incluir a informação de token verificado
      setSuccess(true);
      await update({ eventTokenVerified: true });
      
      // Redirecionar depois de 1.5 segundos
      setTimeout(() => {
        router.push('/');
      }, 1500);
      
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      setError('Ocorreu um erro ao processar sua solicitação');
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Verificação de Token</h1>
        </div>
        
        <div className={styles.content}>
          {session?.user && (
            <div className={styles.userInfo}>
              {session.user.image && (
                <Image 
                  src={session.user.image} 
                  alt={session.user.name || 'Perfil'} 
                  width={64} 
                  height={64} 
                  className={styles.avatar}
                />
              )}
              <div>
                <p className={styles.userName}>{session.user.name}</p>
                <p className={styles.userEmail}>{session.user.email}</p>
              </div>
            </div>
          )}
          
          <div className={styles.instructions}>
            <p>Para continuar usando a plataforma, por favor informe o token do evento fornecido pelo organizador.</p>
            <p>Se você não possui um token, entre em contato com o organizador do evento.</p>
          </div>
          
          {success ? (
            <div className={styles.success}>
              <svg className={styles.successIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
              </svg>
              <p>Token verificado com sucesso! Redirecionando...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <Input
                label="Token do Evento"
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Digite o token fornecido pelo organizador"
                error={error}
                disabled={isSubmitting}
              />
              
              <div className={styles.buttons}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  Sair
                </Button>
                
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting || !token}
                >
                  {isSubmitting ? 'Verificando...' : 'Verificar Token'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}