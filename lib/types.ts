export interface StarredRepo {
  id: number
  fullName: string // "owner/repo"
  name: string
  owner: { login: string; avatarUrl: string }
  description: string | null
  language: string | null
  topics: string[]
  stargazersCount: number
  htmlUrl: string
  homepage: string | null
  starredAt: string // ISO date from GitHub API
  updatedAt: string
  isArchived: boolean
  isFork: boolean
}

export interface RepoWithLabels extends StarredRepo {
  aiLabels: string[] // AI-generated categories
  aiSummary: string | null // one-line AI summary
}

export interface GitHubProfile {
  login: string
  name: string | null
  bio: string | null
  publicRepos: number
  followers: number
  createdAt: string
}

export interface StarsCache {
  userId: string
  repos: RepoWithLabels[]
  lastFetched: string // ISO date
  lastCategorized: string | null
  taglines?: string[]
  githubProfile?: GitHubProfile
}

export interface SyncStatus {
  state: "idle" | "syncing" | "background" | "done" | "error"
  page: number
  fetched: number
  error?: string
}
