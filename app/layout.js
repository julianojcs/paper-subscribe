import './globals.css';
import { Inter } from 'next/font/google';
import Providers from './providers';
import Header from './components/layout/Header';
import styles from './layout.module.css'; // Adicionar importação do CSS modular
import { DataProvider } from '../context/DataContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Scientific Work Submission System',
  description: 'Sistema para submissão de trabalhos científicos',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

const RootLayout = async ({ children }) => {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <DataProvider>
          <Providers>
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