'use client';

import { signIn } from 'next-auth/react';
import styles from './SocialLogin.module.css';
import Image from 'next/image';
import { useDataContext } from '../../../context/DataContext';

export default function SocialLogin() {
  const { ip, userAgent } = useDataContext();

  const handleSocialLogin = (provider) => {
    // Salvar no sessionStorage antes do redirecionamento
    sessionStorage.setItem('auth_metadata', JSON.stringify({
      provider: provider.charAt(0).toUpperCase() + provider.slice(1),
      ip,
      userAgent,
      timestamp: new Date().getTime()
    }));

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
        >
          <div className={styles.icon}>
            <Image
              src="/assets/google-icon.png"
              alt="Google"
              width={20}
              height={20}
            />
          </div>
          Entre com o Google
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