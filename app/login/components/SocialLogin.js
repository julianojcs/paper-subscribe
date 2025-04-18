'use client';

import Cookies from 'js-cookie';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useDataContext } from '../../../context/DataContext';
import styles from './SocialLogin.module.css';

export default function SocialLogin({ label = 'Entre com o Google' }) {
  const { ip, userAgent } = useDataContext();

  const handleSocialLogin = (provider) => {
    // Salvar no cookie em vez de sessionStorage para compatibilidade com servidor
    const metadata = {
      provider: provider.charAt(0).toUpperCase() + provider.slice(1),
      ip,
      userAgent,
      timestamp: new Date().getTime()
    };

    Cookies.set('auth_metadata', JSON.stringify(metadata), {
      expires: 1 / 24, // 1 hora
      sameSite: 'Lax',
      path: '/'
    });

    // Iniciar login social
    signIn(provider, {
      callbackUrl: '/'
    });
  };
  return (
    <div className={styles.container}>
      <div className={styles.divider}>
        <span>OU</span>
      </div>

      <div className={styles.buttons}>
        <button
          onClick={() => handleSocialLogin('google')}
          className={styles.socialButton}
          type="button"
        >
          <div className={styles.icon}>
            <Image
              src="/assets/google-icon.png"
              alt="Google"
              width={20}
              height={20}
            />
          </div>
          {label}
        </button>

        {/* <button
          onClick={() => signIn('facebook', { callbackUrl: '/paper/subscribe' })}
          className={styles.socialButton}
        >
          <div className={styles.icon}>
            <Image
              src="/assets/facebook-icon.png"
              alt="Facebook"
              width={20}
              height={20}
            />
          </div>
          Continue with Facebook
        </button>

        <button
          onClick={() => signIn('linkedin', { callbackUrl: '/paper/subscribe' })}
          className={styles.socialButton}
        >
          <div className={styles.icon}>
            <Image
              src="/assets/linkedin-icon.png"
              alt="LinkedIn"
              width={20}
              height={20}
            />
          </div>
          Continue with LinkedIn
        </button> */}
      </div>
    </div>
  );
}