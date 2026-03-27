#!/usr/bin/env node

const net = require('node:net');

function parseArgs(argv) {
  const args = {
    listenHost: '0.0.0.0',
    listenPort: null,
    targetHost: '127.0.0.1',
    targetPort: null,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    switch (current) {
      case '--listen-host':
        args.listenHost = next;
        index += 1;
        break;
      case '--listen-port':
        args.listenPort = Number(next);
        index += 1;
        break;
      case '--target-host':
        args.targetHost = next;
        index += 1;
        break;
      case '--target-port':
        args.targetPort = Number(next);
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${current}`);
    }
  }

  if (!args.listenPort || !args.targetPort) {
    throw new Error(
      'Usage: node scripts/start-port-forward.js --listen-port <port> --target-port <port> [--listen-host <host>] [--target-host <host>]',
    );
  }

  return args;
}

function forwardConnection(clientSocket, targetHost, targetPort) {
  const upstreamSocket = net.connect(targetPort, targetHost);

  clientSocket.on('error', () => {
    upstreamSocket.destroy();
  });

  upstreamSocket.on('error', () => {
    clientSocket.destroy();
  });

  clientSocket.pipe(upstreamSocket);
  upstreamSocket.pipe(clientSocket);

  const closeBoth = () => {
    clientSocket.destroy();
    upstreamSocket.destroy();
  };

  clientSocket.on('close', closeBoth);
  upstreamSocket.on('close', closeBoth);
}

function main() {
  const { listenHost, listenPort, targetHost, targetPort } = parseArgs(process.argv);

  const server = net.createServer((clientSocket) => {
    forwardConnection(clientSocket, targetHost, targetPort);
  });

  server.on('error', (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });

  server.listen(listenPort, listenHost, () => {
    console.log(`Forwarding ${listenHost}:${listenPort} -> ${targetHost}:${targetPort}`);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main();