# HomeLab C4 Viewer

IcePanel-inspired C4 architecture viewer for Structurizr workspaces.

This repository contains only the generic public front-end code. Private homelab topology, live workspace data, generated documentation, and registry overlays stay in the infrastructure repository.

## Architecture

```text
Structurizr workspace JSON + C4 registry overlay
  -> normalized C4 model
  -> Next.js / React Flow viewer
```

Default endpoints are relative so the app can be served behind the same reverse proxy as Structurizr:

- `/api/workspace/1`
- `/exports/versions/index.json`

## Features

- Structurizr JSON loader
- C4 registry overlay support
- Live/test/deprecated version lifecycle model
- Element and relationship detail panels
- Documentation provenance badges: AsCode, Human, AI
- React Flow graph canvas
- Public-safe fixture data only

## Development

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

## Privacy boundary

Do not commit live homelab exports, internal service documentation, private hostnames, LAN IPs, secrets, or detailed dependency maps to this public repository. Use anonymized fixtures only.
