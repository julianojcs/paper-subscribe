/** @type {import('next').NextConfig} */

// Lista de domínios permitidos
const allowedImageDomains = [
  'jornada.srmg.org.br',
  'res.cloudinary.com',
  'images.unsplash.com',
  'upload.wikimedia.org',
  's3.amazonaws.com',
  'storage.googleapis.com',
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