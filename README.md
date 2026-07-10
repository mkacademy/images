# MK Academy Images

**Repository:** [mkacademy/images](https://github.com/mkacademy/images) — read-only PNC viewer (formerly the `website` repo).

- **Public site:** [mkacademy.ca](https://mkacademy.ca)
- **Studio editor:** [mkacademy/studio](https://github.com/mkacademy/studio)

## Workspace

Open the multi-root workspace (landing, studio, videos, images):

```bash
open ~/Desktop/mkacademy.code-workspace
```

## Development

```bash
npm install
npm run dev
```

Runs on http://localhost:3001.

## Build

```bash
npm run build
```

## Docker

```bash
docker build -t mkacademy-images .
```

Deployed via [mkacademy-deployment](https://github.com/mkacademy/mkacademy-deployment).

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | API base path (same on both domains) |
