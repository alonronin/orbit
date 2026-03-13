import { openDB, type IDBPDatabase } from "idb"
import type { GitHubProfile, StarsCache } from "@/lib/types"

const DB_NAME = "github-stars"
const DB_VERSION = 1
const STORE_NAME = "stars-cache"

interface GitHubStarsDB {
  "stars-cache": {
    key: string
    value: StarsCache
  }
}

let dbPromise: Promise<IDBPDatabase<GitHubStarsDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<GitHubStarsDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "userId" })
        }
      },
    })
  }
  return dbPromise
}

export async function getCachedStars(
  userId: string,
): Promise<StarsCache | undefined> {
  const db = await getDB()
  return db.get(STORE_NAME, userId)
}

export async function setCachedStars(cache: StarsCache): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, cache)
}

export async function clearCachedStars(userId: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, userId)
}

export async function getTaglines(
  userId: string,
): Promise<string[] | undefined> {
  const cache = await getCachedStars(userId)
  return cache?.taglines
}

export async function setTaglines(
  userId: string,
  taglines: string[],
  profile?: GitHubProfile,
): Promise<void> {
  const db = await getDB()
  const cache = await db.get(STORE_NAME, userId)
  if (cache) {
    cache.taglines = taglines
    if (profile) cache.githubProfile = profile
    await db.put(STORE_NAME, cache)
  } else {
    await db.put(STORE_NAME, {
      userId,
      repos: [],
      lastFetched: "",
      lastCategorized: null,
      taglines,
      githubProfile: profile,
    })
  }
}

export async function updateRepoLabels(
  userId: string,
  repoId: number,
  labels: string[],
  summary: string,
): Promise<void> {
  const db = await getDB()
  const cache = await db.get(STORE_NAME, userId)
  if (!cache) return

  const repo = cache.repos.find((r: { id: number }) => r.id === repoId)
  if (repo) {
    repo.aiLabels = labels
    repo.aiSummary = summary
    await db.put(STORE_NAME, cache)
  }
}
