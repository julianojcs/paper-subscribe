// app/redirect/page.js
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RedirectPage() {
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
      if (window.history.length > 1) {
        window.history.replaceState(null, '', '/login');
      }
    };
  }, [router, searchParams]);

  return (
    null
  );
}