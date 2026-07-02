const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const path = require('node:path');

const envName = process.env.NODE_ENV || 'development';
const envFile = path.resolve(__dirname, `.env.${envName}`);

dotenv.config({ path: fs.existsSync(envFile) ? envFile : undefined });

const app = express();
const distDir = process.env.DIST_DIR || path.resolve(__dirname, 'dist');
const indexFile = path.join(distDir, 'index.html');
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const apiProxyTarget = process.env.VITE_PROXY_DEVELOP || '';
const credProxyTarget = process.env.VITE_CRED_PROXY_TARGET || '';

function proxyRequestToTarget(target, req, res, errorMessage) {
  if (!target) {
    return res.status(502).send(errorMessage);
  }

  const targetUrl = new URL(req.originalUrl, target);
  const targetClient = targetUrl.protocol === 'https:' ? https : http;
  const headers = { ...req.headers };

  delete headers.host;
  delete headers.connection;
  delete headers['content-length'];
  delete headers['transfer-encoding'];

  const proxyRequest = targetClient.request(targetUrl, {
    method: req.method,
    headers
  }, (proxyResponse) => {
    res.status(proxyResponse.statusCode || 502);

    Object.entries(proxyResponse.headers).forEach(([headerName, headerValue]) => {
      if (typeof headerValue !== 'undefined') {
        res.setHeader(headerName, headerValue);
      }
    });

    proxyResponse.pipe(res);
  });

  proxyRequest.on('error', (error) => {
    console.error('Proxy request failed', error);
    if (!res.headersSent) {
      res.status(502).send(errorMessage);
      return;
    }
    res.end();
  });

  req.pipe(proxyRequest);
}

app.use(cors());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api', (req, res) => {
  proxyRequestToTarget(apiProxyTarget, req, res, 'API proxy target is not configured.');
});

app.use('/cred', (req, res) => {
  proxyRequestToTarget(credProxyTarget, req, res, 'Credential proxy target is not configured.');
});

app.use(express.static(distDir, { fallthrough: true }));

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }

  return res.status(500).send('dist/index.html was not found. Run npm run build first.');
});

console.log(`Backend proxy target ${apiProxyTarget ? `is set to ${apiProxyTarget}` : 'is not set'}`);
console.log(`Credential proxy target ${credProxyTarget ? `is set to ${credProxyTarget}` : 'is not set'}`);

const server = app.listen(port, host, () => {
  const displayHost = host === '0.0.0.0' ? 'localhost' : host;
  console.log(`Serving ${envName} build on http://${displayHost}:${port}`);
});

server.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] connection from ${socket.remoteAddress || 'unknown'}`);
});