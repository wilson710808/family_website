const { createServer } = require('http');
const { createServer: createHttpsServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

// 直接导入 TypeScript 源文件，tsx 会处理编译
const { socketManager } = require('./lib/socket.ts');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// HTTPS 配置 - 当证书存在时启用 HTTPS
let httpsOptions: { key: Buffer; cert: Buffer; ca?: Buffer } | null = null;
const sslKeyPath = process.env.SSL_KEY_PATH || './certs/private.key';
const sslCertPath = process.env.SSL_CERT_PATH || './certs/certificate.crt';
const sslCaPath = process.env.SSL_CA_PATH || './certs/ca-bundle.crt';

if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
  httpsOptions = {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath),
  };
  // 如果有 CA 证书链，也加上
  if (fs.existsSync(sslCaPath)) {
    httpsOptions.ca = fs.readFileSync(sslCaPath);
  }
  console.log('> HTTPS certificates found, enabling HTTPS');
} else {
  console.log('> HTTPS certificates not found, running in HTTP only');
  console.log(`> To enable HTTPS, place your certificates at:`);
  console.log(`>   - ${sslKeyPath}`);
  console.log(`>   - ${sslCertPath}`);
  console.log(`>   - ${sslCaPath} (optional)`);
}

// 初始化 Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const requestHandler = async (req: any, res: any) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  };

  let server;
  let protocol;

  if (httpsOptions) {
    // HTTPS 模式
    server = createHttpsServer(httpsOptions, requestHandler);
    protocol = 'https';
  } else {
    // HTTP 模式
    server = createServer(requestHandler);
    protocol = 'http';
  }

  // 初始化 Socket.IO
  socketManager.init(server);

  // 定期清理不活跃用户
  setInterval(() => {
    socketManager.cleanupInactiveUsers();
  }, 60 * 1000); // 每分钟检查一次

  server
    .once('error', (err: any) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on ${protocol}://${hostname}:${port}`);
      console.log('> Socket.IO initialized ✓');
    });
});
