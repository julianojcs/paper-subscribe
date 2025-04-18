// app/redirect/page.js
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

// Componente de loading simples
function LoadingState() {
  return null; // Ou uma UI mínima de carregamento
}

// Componente interno que usa useSearchParams
function RedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const token = searchParams.get('t');

    if (token) {
      // Salvar o token em sessionStorage temporariamente
      sessionStorage.setItem('event_registration_token', JSON.stringify({
        token,
        expires: Date.now() + 1000 * 60 * 10 // 10 minutos
      }));

      // Redirecionar para página de login sem o token na URL
      router.replace('/login');
    } else {
      router.replace('/');
    }

    // Limpar esta URL do histórico após o redirecionamento
    return () => {
      setIsProcessing(false);
      // Tentativa adicional de limpar o histórico (funciona em alguns navegadores)
      if (window.history && window.history.length > 1) {
        window.history.replaceState(null, '', '/login');
      }
    };
  }, [router, searchParams]);

  return null;
}

// Componente principal que usa Suspense
export default function RedirectPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <RedirectHandler />
    </Suspense>
  );
}