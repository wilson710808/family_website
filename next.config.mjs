/** @type {import('next').NextConfig} */
const nextConfig = {
 serverExternalPackages: ['better-sqlite3', 'bcryptjs', 'jsonwebtoken', 'socket.io'],
 
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
 // 性能优化
 experimental: {
 optimizePackageImports: ['lucide-react', 'date-fns'],
 },
 // 启用压缩
 compress: true,
 // 优化构建
 swcMinify: true,
 // 生产环境优化
 productionBrowserSourceMaps: false,
};

export default nextConfig;
