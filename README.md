# Orbit

Browse, search, and organize your GitHub starred repositories with AI-powered categorization.

## Features

- **GitHub OAuth** — Sign in with your GitHub account
- **Star syncing** — Fetches all starred repos with streaming progress
- **Full-text search** — Instant client-side search powered by Fuse.js
- **AI categorization** — Automatically labels repos (Framework, Library, Tool, DevOps, AI/ML, Database, UI, Testing, Security, etc.)
- **AI summaries** — Generates one-line descriptions for each repo
- **Filtering** — Filter by programming language or AI-generated label
- **Sorting** — By starred date, star count, last updated, or name
- **Offline caching** — Persists data in IndexedDB for instant loads
- **Dark/light theme** — System-aware theme switching
- **Virtualized grid** — Smooth scrolling with thousands of repos

## Tech Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS · shadcn/ui · next-auth · Vercel AI SDK · TanStack Query · TanStack Virtual · Fuse.js · IndexedDB (idb)

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Bun](https://bun.sh/)
- A GitHub OAuth application
- An AI Gateway API key (for AI features)

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/oneqmethod/github-stars.git
   cd github-stars
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Copy the example env file and fill in your values:

   ```bash
   cp .env.example .env.local
   ```

4. Start the development server:

   ```bash
   bun dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Obtaining API Keys

### GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Set the **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github`
4. Copy the **Client ID** → `GITHUB_ID`
5. Generate a **Client Secret** → `GITHUB_SECRET`

### AUTH_SECRET

Generate a random secret for NextAuth session encryption:

```bash
npx auth secret
```

### AI Gateway

The app uses the [Vercel AI SDK](https://sdk.vercel.ai/) with AI Gateway for model access. The default model is `groq/qwen-3-32b`. Set `AI_GATEWAY_API_KEY` to your AI Gateway API key, and optionally change `MODEL` to use a different provider/model.

## Available Scripts

| Command          | Description                     |
| ---------------- | ------------------------------- |
| `bun dev`        | Start dev server with Turbopack |
| `bun run build`  | Production build                |
| `bun start`      | Start production server         |
| `bun run lint`   | Run ESLint                      |
| `bun run format` | Format code with Prettier       |
| `bun run typecheck` | TypeScript type checking     |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run lint and type checks:
   ```bash
   bun run lint
   bun run typecheck
   ```
5. Commit and push your branch
6. Open a Pull Request
