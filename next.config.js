/** @type {import('next').NextConfig} */

// Lista de domínios permitidos
const allowedImageDomains = [
  'jornada.srmg.org.br',
  'res.cloudinary.com',
  'images.unsplash.com',
  'upload.wikimedia.org',
  's3.amazonaws.com',
  'storage.googleapis.com',
  'firebasestorage.googleapis.com', // Adicionando o domínio completo do Firebase Storage
  // Adicione mais domínios conforme necessário
];

// Configuração de padrões remotos
const allowedRemotePatterns = [
  {
    protocol: 'https',
    hostname: 'jornada.srmg.org.br',
    pathname: '/logo_jornada/**',
  },
  {
    protocol: 'https',
    hostname: '*.cloudinary.com',
  },
  {
    protocol: 'https',
    hostname: 'firebasestorage.googleapis.com', // Correção do padrão Firebase Storage
    pathname: '/v0/**', // Permitindo todos os caminhos que começam com v0/
  },
  // Adicione mais padrões conforme necessário
];

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: allowedImageDomains,
    remotePatterns: allowedRemotePatterns,
  },
};

export default nextConfig;