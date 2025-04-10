'use client';

import { signIn } from 'next-auth/react';
import styles from './SocialLogin.module.css';
import Image from 'next/image';

export default function SocialLogin() {
  return (
    <div className={styles.container}>
      <div className={styles.divider}>
        <span>OU</span>
      </div>

      <div className={styles.buttons}>
        <button
          onClick={() => signIn('google', { callbackUrl: '/paper' })}
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