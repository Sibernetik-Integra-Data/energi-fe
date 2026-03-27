const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('node:fs');
const path = require('node:path');

const envName = process.env.NODE_ENV || 'development';
const envFile = path.resolve(__dirname, `.env.${envName}`);

dotenv.config({ path: fs.existsSync(envFile) ? envFile : undefined });

const app = express();
const distDir = process.env.DIST_DIR || path.resolve(__dirname, 'dist');
const indexFile = path.join(distDir, 'index.html');
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

app.use(cors());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
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

const server = app.listen(port, host, () => {
  const displayHost = host === '0.0.0.0' ? 'localhost' : host;
  console.log(`Serving ${envName} build on http://${displayHost}:${port}`);
});

server.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] connection from ${socket.remoteAddress || 'unknown'}`);
});