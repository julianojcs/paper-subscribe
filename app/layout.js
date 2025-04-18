import { Inter } from 'next/font/google';
import { DataProvider } from '../context/DataContext';
import Header from './components/layout/Header';
import './globals.css';
import styles from './layout.module.css'; // Adicionar importação do CSS modular
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Scientific Work Submission System',
  description: 'Sistema para submissão de trabalhos científicos',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

const RootLayout = async ({ children, session }) => {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <DataProvider>
          <Providers session={session}>
            <Header />
            <main className={styles.mainContent}> {/* Adicionar classe CSS */}
              {children}
            </main>
          </Providers>
        </DataProvider>
      </body>
    </html>
  );
}

export default RootLayout;