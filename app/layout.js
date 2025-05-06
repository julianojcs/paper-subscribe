import { Inter } from 'next/font/google';
import { DataProvider } from '../context/DataContext';
import SessionSync from './components/global/SessionSync';
import Header from './components/layout/Header';
import './globals.css';
import styles from './layout.module.css'; // Adicionar importação do CSS modular
import Providers from './providers';
import { ToastProvider } from '../context/ToastContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Scientific Work Submission System',
  description: 'Sistema para submissão de trabalhos científicos',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>
          <ToastProvider>
            <DataProvider>
              {/* Componente invisível para sincronizar sessão com contexto */}
              <SessionSync />
              <Header />
              <main className={styles.mainContent}> {/* Adicionar classe CSS */}
                {children}
              </main>
            </DataProvider>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}