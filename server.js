const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { socketManager } = require('./lib/socket');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// 初始化 Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // 初始化 Socket.IO
  socketManager.init(httpServer);

  // 定期清理不活跃用户
  setInterval(() => {
    socketManager.cleanupInactiveUsers();
  }, 60 * 1000); // 每分钟检查一次

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log('> Socket.IO initialized ✓');
    });
});
