# Podman Rootless Frontend Deployment

Build the frontend first so the `dist` folder exists:

```bash
npm run build
```

Build the Podman image from the prebuilt `dist` output:

```bash
podman build -f dockerfile.development -t energi-fe:dev .
```

Prune Podman images older than 24 hours:

```bash
podman image prune -f --filter until=24h
```

Run the container in rootless mode with published port mapping and explicit environment variables:

```bash
podman run \
  -d \
  -p 127.0.0.1:11001:10001 \
  -e NODE_ENV=development \
  -e PORT=10001 \
  -e HOST=0.0.0.0 \
  -e DIST_DIR=/app/dist \
  --restart always \
  energi-fe:dev
```

The container works from `/app`, and the SPA is served from `/app/dist`.
The container command is `npm run server:dev`, so the image installs devDependencies too.

On Windows, the deployment script also starts a small host forwarder so `0.0.0.0:10001` forwards to the loopback port `11001`. No elevation is required for that step.