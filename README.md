# MySeek Web

[English](README.md) | [简体中文](README.zh-CN.md)

[![React](https://img.shields.io/badge/React-19.3-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![React Router](https://img.shields.io/badge/React%20Router-7.18-CA4245?logo=reactrouter&logoColor=white)](https://reactrouter.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/guwan/my-seek-web?style=social)](https://github.com/guwan/my-seek-web)

**The web frontend for MySeek** — an AI chat workspace for enterprises with multi-model switching, streaming responses, web search, conversation management, knowledge base QA, and AI writing. It works with the [MySeek backend](https://github.com/guwan/my-seek).

---

## Preview

<p align="center">
  <img src="./assets/image.png" alt="MySeek chat UI" width="920" />
</p>

<p align="center">
  <em>Chat: multi-turn conversations, Markdown rendering, model switching, and conversation list</em>
</p>

---

## Features

- **Multi-model switching**: local Ollama, Doubao, Qwen, and OpenAI-compatible endpoints, selected per request
- **Streaming chat**: incremental output, Markdown / code highlighting / KaTeX math rendering, reasoning display, and time-grouped messages
- **Structured stream protocol**: parses `meta / content / done / error` frames, with legacy raw-text stream compatibility
- **Web search**: optional real-time search with source links in responses
- **Provider management**: visually add, edit, enable/disable third-party AI endpoints and test connectivity; API keys are encrypted by the backend
- **Knowledge base management**: upload documents, view parsing status and chunk count, delete documents, and generate model answers from retrieved snippets
- **User management**: admins can create internal accounts, maintain basic info, enable/disable accounts, and assign roles; hidden for regular users
- **AI writing workspace**: a dedicated writing page with local draft autosave and AI continue/polish/expand actions
- **Style-based imitation**: new writing can generate an opening from a style description without a reference sample; style remains editable as a work setting
- **Conversation management**: sidebar search, one-click new chat, persisted history, and per-user isolation
- **Unified authentication**: JWT login and automatic redirect to login with a return URL when unauthorized
- **Responsive layout**: collapsible sidebar for different screen sizes

## Tech Stack

| Area | Technology | Version |
| --- | --- | --- |
| UI framework | React | 19.3 |
| Routing | React Router | 7.18 (SPA mode) |
| Language | TypeScript | 5.9 (strict) |
| Build | Vite | 7.3 |
| Styling | Tailwind CSS | 4.3 |
| State | Redux Toolkit | 2.14 |
| Components | shadcn/ui (Radix UI) | — |
| Package manager | pnpm | 11 |

## Quick Start

### Requirements

- Node.js 24+
- pnpm 11+
- Backend running on port `8080` (see [my-seek](https://github.com/guwan/my-seek))

### Install and Run

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173`.

In development, Vite proxies all `/api` requests to the backend at `http://localhost:8080` by default. Override it with `VITE_API_PROXY_TARGET` in `.env`; see `vite.config.ts` for proxy rules.

### Verify and Build

```bash
pnpm test        # Vitest unit and component tests
pnpm typecheck   # react-router typegen + tsc
pnpm build       # output static site to build/client
```

## CI

`.github/workflows/ci.yml` runs on push / pull request to `main` or `master`:

1. `pnpm install --frozen-lockfile`
2. `pnpm test`
3. `pnpm typecheck`
4. `pnpm build`

## Deployment

This project uses **SPA mode** (`ssr: false`). `pnpm build` outputs pure static files to `build/client/`. Deployment requires:

1. serving `build/client/` with any static server and falling back to `index.html` for unknown paths;
2. configuring a reverse proxy that forwards `/api` to the backend.

The included `Dockerfile` uses Node 24 + pnpm 11 and Nginx to serve `build/client/`. `nginx.conf` configures SPA fallback and `/api/` reverse proxying, including disabled SSE buffering. Container orchestration is available in the repository root `docker-compose.yml`.

## Directory Structure

```
app/
├── components/   # UI components (chat, knowledge, users, login, providers, writing, layout, common UI)
├── routes/       # File routes (home / login / dashboard)
├── pages/        # Page components (Chat / Write / Knowledge / Users / Providers)
├── store/        # Redux slices (user, conversations, models, writing)
├── lib/          # HTTP client, auth utilities, event constants
├── auth/         # Login state context
└── services/     # Type declarations and API wrappers (knowledge, writing, stream parsing)
assets/           # README screenshot
```

## Related Projects

| Project | Description |
| --- | --- |
| [guwan/my-seek](https://github.com/guwan/my-seek) | Spring Boot 4 + Spring AI 2 backend with auth, chat, web search, vector store, and knowledge base APIs |
| [guwan/my-seek-page](https://github.com/guwan/my-seek-page) | MySeek official landing page |

## License

This project is licensed under the [MIT License](./LICENSE).
