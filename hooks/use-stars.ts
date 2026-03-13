"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { clearCachedStars, getCachedStars, setCachedStars } from "@/lib/db"
import type {
  GitHubProfile,
  RepoWithLabels,
  StarredRepo,
  SyncStatus,
} from "@/lib/types"

function toRepoWithLabels(
  repo: StarredRepo,
  existing?: RepoWithLabels,
): RepoWithLabels {
  return {
    ...repo,
    aiLabels: existing?.aiLabels ?? [],
    aiSummary: existing?.aiSummary ?? null,
  }
}

export function useStars(userId: string | undefined) {
  const [repos, setRepos] = useState<RepoWithLabels[]>([])
  const [lastFetched, setLastFetched] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: "idle",
    page: 0,
    fetched: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<GitHubProfile | null>(null)
  const hasSynced = useRef(false)
  const hasCache = useRef(false)
  const lastFetchedRef = useRef<string | null>(null)
  const existingMapRef = useRef(new Map<number, RepoWithLabels>())

  // Load cached data on mount
  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function loadCache() {
      const cached = await getCachedStars(userId!)
      if (cancelled) return

      if (cached && cached.repos.length > 0) {
        setRepos(cached.repos)
        setLastFetched(cached.lastFetched)
        lastFetchedRef.current = cached.lastFetched
        hasCache.current = true
        if (cached.githubProfile) setProfile(cached.githubProfile)
        for (const r of cached.repos) {
          existingMapRef.current.set(r.id, r)
        }
      }
      setIsLoading(false)
    }

    loadCache()
    return () => {
      cancelled = true
    }
  }, [userId])

  // Auto-sync only when there's no cached data (first login)
  useEffect(() => {
    if (!userId || isLoading || hasSynced.current) return
    hasSynced.current = true
    startSync(userId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isLoading])

  const startSync = useCallback(
    async (uid: string, force = false) => {
      setSyncStatus({ state: "syncing", page: 0, fetched: 0 })
      const allRepos: RepoWithLabels[] = []
      let phase1Done = false

      // Check if background phase should be skipped (last sync < 24h and not forced)
      const skipBackground =
        !force &&
        hasCache.current &&
        lastFetchedRef.current &&
        Date.now() - new Date(lastFetchedRef.current).getTime() <
          24 * 60 * 60 * 1000

      try {
        const res = await fetch("/api/stars")
        if (!res.ok) {
          throw new Error(`Sync failed: ${res.status}`)
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error("No response body")

        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            if (!line.trim()) continue
            const data = JSON.parse(line)

            if (data.error) {
              throw new Error(data.error)
            }

            if (data.done) {
              break
            }

            if (data.repos) {
              const pageRepos: RepoWithLabels[] = data.repos.map(
                (repo: StarredRepo) =>
                  toRepoWithLabels(repo, existingMapRef.current.get(repo.id)),
              )
              allRepos.push(...pageRepos)

              if (!phase1Done) {
                // Phase 1: first page — show new repos immediately
                phase1Done = true

                if (hasCache.current) {
                  // Merge: new repos at top + existing cached repos
                  const cachedIds = new Set(
                    existingMapRef.current.keys(),
                  )
                  const newRepos = pageRepos.filter(
                    (r) => !cachedIds.has(r.id),
                  )
                  if (newRepos.length > 0) {
                    setRepos((prev) => [...newRepos, ...prev])
                  }
                  // Transition to background phase
                  if (skipBackground) {
                    // Skip remaining pages, abort stream
                    reader.cancel()
                    setSyncStatus({ state: "done", page: 1, fetched: pageRepos.length })
                    const now = new Date().toISOString()
                    setLastFetched(now)
                    lastFetchedRef.current = now
                    return
                  }
                  setSyncStatus({
                    state: "background",
                    page: data.page,
                    fetched: data.fetched,
                  })
                } else {
                  // First sync — show everything progressively
                  setRepos([...allRepos])
                  setSyncStatus({
                    state: "syncing",
                    page: data.page,
                    fetched: data.fetched,
                  })
                }
              } else if (!hasCache.current) {
                // First sync: keep showing repos as they arrive
                setRepos([...allRepos])
                setSyncStatus({
                  state: "syncing",
                  page: data.page,
                  fetched: data.fetched,
                })
              }
              // Background phase for re-syncs: collect silently, don't update UI per page
            }

            if (data.profile) {
              setProfile(data.profile as GitHubProfile)
            }
          }
        }

        const now = new Date().toISOString()
        setLastFetched(now)
        lastFetchedRef.current = now
        setSyncStatus({ state: "done", page: 0, fetched: allRepos.length })

        // Update the existing map for future merges
        for (const r of allRepos) {
          existingMapRef.current.set(r.id, r)
        }

        // Final UI update with all fresh data
        setRepos(allRepos)

        // Persist to IndexedDB
        const cached = await getCachedStars(uid)
        await setCachedStars({
          userId: uid,
          repos: allRepos,
          lastFetched: now,
          lastCategorized: cached?.lastCategorized ?? null,
          taglines: cached?.taglines,
          githubProfile: cached?.githubProfile,
        })
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return
        const message =
          error instanceof Error ? error.message : "Sync failed"
        setSyncStatus({ state: "error", page: 0, fetched: 0, error: message })
      }
    },
    [],
  )

  const refetch = useCallback(
    (force = true) => {
      if (!userId || syncStatus.state === "syncing") return
      hasSynced.current = true
      startSync(userId, force)
    },
    [userId, syncStatus.state, startSync],
  )

  const clearAll = useCallback(async () => {
    if (!userId) return
    await clearCachedStars(userId)
    setRepos([])
    setLastFetched(null)
    setSyncStatus({ state: "idle", page: 0, fetched: 0 })
    existingMapRef.current.clear()
    hasCache.current = false
    hasSynced.current = false
  }, [userId])

  return {
    repos,
    isLoading,
    isFetching: syncStatus.state === "syncing" || syncStatus.state === "background",
    syncStatus,
    profile,
    refetch,
    clearAll,
    lastFetched,
  }
}
