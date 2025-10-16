const https = require('https');
const http = require('http');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');

// SSL sertifikatlari
const sslOptions = {
  key: fs.readFileSync('/home/administrator/ssl/nginx-selfsigned.key'),
  cert: fs.readFileSync('/home/administrator/ssl/nginx-selfsigned.crt')
};

// Frontend proxy
const frontendProxy = createProxyMiddleware({
  target: 'http://localhost:4563',
  changeOrigin: true,
  ws: true
});

// Backend API proxy
const backendProxy = createProxyMiddleware({
  target: 'http://localhost:7896',
  changeOrigin: true
});

// HTTPS server
const server = https.createServer(sslOptions, (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API routes to backend
  if (req.url.startsWith('/api/') || req.url.startsWith('/admin/')) {
    backendProxy(req, res);
  } 
  // Static files
  else if (req.url.startsWith('/static/') || req.url.startsWith('/media/')) {
    backendProxy(req, res);
  }
  // All other routes to frontend
  else {
    frontendProxy(req, res);
  }
});

// HTTP to HTTPS redirect
const httpServer = http.createServer((req, res) => {
  res.writeHead(301, {
    'Location': `https://${req.headers.host.replace(':80', ':8443')}${req.url}`
  });
  res.end();
});

// Start servers
const HTTPS_PORT = 8443;
const HTTP_PORT = 80;

server.listen(HTTPS_PORT, '0.0.0.0', () => {
  console.log(`✅ HTTPS Server running on https://0.0.0.0:${HTTPS_PORT}`);
  console.log(`🔗 Access: https://178.218.200.120:${HTTPS_PORT}`);
});

httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`🔄 HTTP Redirect server running on http://0.0.0.0:${HTTP_PORT}`);
});

// Error handling
server.on('error', (err) => {
  console.error('HTTPS Server error:', err);
});

httpServer.on('error', (err) => {
  console.error('HTTP Server error:', err);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  server.close();
  httpServer.close();
  process.exit(0);
});
