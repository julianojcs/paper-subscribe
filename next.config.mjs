/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Ignorar o módulo problemático
    config.resolve.alias['@mapbox/node-pre-gyp'] = false;
    
    return config;
  },
}

export default nextConfig;