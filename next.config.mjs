/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone', - removed, caused issues with next start
  serverExternalPackages: ['better-sqlite3', 'bcryptjs', 'jsonwebtoken', 'socket.io'],
  
  // 禁用 Turbopack 以避免編譯錯誤
  experimental: {
    turbo: {
      enabled: false,
    },
  },
  
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
