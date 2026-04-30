/** @type {import('next').NextConfig} */
const nextConfig = {
 // Webspace 子路徑前綴
 basePath: '/ws/01-family-portal',
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

 // Turbopack root 設定（避免多 lockfile 衝突）
 turbopack: {
 root: '/root/webspaces/01-family-portal',
 },
 // 启用压缩
 compress: true,
 // 生产环境优化
 productionBrowserSourceMaps: false,
};

export default nextConfig;
