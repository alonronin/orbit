<p align="center">
  <img src="app/icon.svg" width="128" alt="Orbit logo" />
</p>

<h1 align="center">Orbit</h1>

<p align="center">
  Browse, search, and organize your GitHub starred repositories with AI-powered categorization.
</p>

## 🌟 Highlights

- **AI categorization** — Automatically labels each starred repo (Framework, Tool, AI/ML, DevOps, Database, UI, and more)
- **AI summaries** — Generates a one-line description for every repo
- **Instant search** — Client-side full-text search powered by Fuse.js
- **Smart filtering** — Filter by programming language or AI-generated label
- **Offline-first** — Persists everything in IndexedDB for instant loads across sessions
- **Streaming sync** — Fetches all your stars with real-time progress, resumable on refresh

## ℹ️ Overview

Orbit turns your GitHub stars from a forgotten bookmark graveyard into a searchable, organized library. Sign in with GitHub, sync your stars, and let AI sort through hundreds (or thousands) of repos so you can actually find what you need.

Built with Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Vercel AI SDK, TanStack Query, TanStack Virtual, Fuse.js, and IndexedDB via idb.

## 🚀 Usage

1. **Sign in** with your GitHub account
2. **Sync** — Orbit streams all your starred repos with live progress
3. **Categorize** — AI automatically labels and summarizes each repo
4. **Search & filter** — Find repos instantly by name, description, language, or AI label
5. **Sort** — By starred date, star count, last updated, or name

## ⬇️ Installation

```bash
git clone https://github.com/oneqmethod/github-stars.git
cd github-stars
bun install
cp .env.example .env.local
```

Fill in your `.env.local` values (see below), then start the dev server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Obtaining API keys

**GitHub OAuth App**

1. Go to [GitHub Developer Settings](https://github.com/settings/developers) > **OAuth Apps** > **New OAuth App**
2. Set the callback URL to `http://localhost:3000/api/auth/callback/github`
3. Copy the **Client ID** and **Client Secret** into `GITHUB_ID` and `GITHUB_SECRET`

**AUTH_SECRET**

```bash
npx auth secret
```

**AI Gateway**

The app uses the [Vercel AI SDK](https://sdk.vercel.ai/) with AI Gateway. The default model is `groq/gpt-oss-20b`. Set `AI_GATEWAY_API_KEY` to your gateway key, and optionally change `MODEL` for a different provider.

## 📜 Available Scripts

| Command              | Description                     |
| -------------------- | ------------------------------- |
| `bun dev`            | Start dev server with Turbopack |
| `bun run build`      | Production build                |
| `bun start`          | Start production server         |
| `bun run lint`       | Run ESLint                      |
| `bun run format`     | Format code with Prettier       |
| `bun run typecheck`  | TypeScript type checking        |

## 💭 Feedback and Contributing

Found a bug or have an idea? [Open an issue](https://github.com/oneqmethod/github-stars/issues)!

Contributions are welcome — fork the repo, create a feature branch, and open a pull request.
