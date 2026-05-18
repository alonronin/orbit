"use client"

import { useEffect, useDeferredValue, useMemo, useState } from "react"
import Fuse from "fuse.js"
import type { RepoWithLabels } from "@/lib/types"

const fuseOptions = {
  keys: [
    { name: "name", weight: 3 },
    { name: "fullName", weight: 2 },
    { name: "topics", weight: 1 },
    { name: "description", weight: 0.7 },
    { name: "aiLabels", weight: 0.5 },
    { name: "language", weight: 0.3 },
    { name: "aiSummary", weight: 0.3 },
  ],
  threshold: 0.3,
  useExtendedSearch: false,
  includeScore: true,
}

// Normalize separators so "generative ui" matches "generative-ui", "generative_UI", etc.
function norm(s: string): string {
  return s.toLowerCase().replace(/[-_./]/g, " ")
}

// Lower rank = better match. Prioritize exact/substring matches over fuzzy.
function matchRank(repo: RepoWithLabels, q: string): number {
  const name = norm(repo.name)
  const fullName = norm(repo.fullName)
  const nq = norm(q)

  // Rank 0: exact name/fullName
  if (name === nq || fullName === nq) return 0

  // Rank 1: query is substring of name/fullName
  if (name.includes(nq) || fullName.includes(nq)) return 1

  // Rank 2: query is substring of any topic or aiLabel (normalized)
  const topicsText = (repo.topics ?? []).map(norm).join(" ")
  const labelsText = (repo.aiLabels ?? []).map(norm).join(" ")
  if (topicsText.includes(nq) || labelsText.includes(nq)) return 2

  const words = nq.split(/\s+/).filter(Boolean)
  if (words.length > 1) {
    const fields = [name, fullName, norm(repo.description ?? ""), topicsText, labelsText, norm(repo.aiSummary ?? "")]

    // Rank 3: ALL query words found in a SINGLE field (high co-occurrence)
    if (fields.some((f) => words.every((w) => f.includes(w)))) return 3

    // Rank 4: ALL query words found across ANY fields
    const blob = fields.join(" ")
    if (words.every((w) => blob.includes(w))) return 4
  }

  return 5 // fuzzy only
}

export function useSearch(repos: RepoWithLabels[]) {
  const [query, setQuery] = useState("")

  // Debounce: avoid running expensive search on every keystroke
  const [debouncedQuery, setDebouncedQuery] = useState("")
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 150)
    return () => clearTimeout(id)
  }, [query])
  const deferredQuery = useDeferredValue(debouncedQuery)

  // Build the Fuse index + prefix-match blob cache, keyed on repos.length so
  // it rebuilds only when repos are added or removed — not on every array
  // reference change (e.g. labels streaming in during categorization).
  const index = useMemo(() => {
    const fuse = new Fuse(repos, fuseOptions)
    const blobCache = new Map<string, string[]>()
    for (const repo of repos) {
      const blob = [
        norm(repo.name), norm(repo.fullName),
        norm(repo.description ?? ""),
        ...(repo.topics ?? []).map(norm),
        ...(repo.aiLabels ?? []).map(norm),
        norm(repo.aiSummary ?? ""),
      ].join(" ")
      blobCache.set(repo.fullName, blob.split(/\s+/))
    }
    return { fuse, blobCache, repos }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on count only (see comment above)
  }, [repos.length])

  const results = useMemo(() => {
    const { fuse, blobCache, repos: indexedRepos } = index
    if (!deferredQuery.trim()) return indexedRepos
    const q = deferredQuery.trim().toLowerCase()
    const raw = fuse.search(deferredQuery)

    // Supplement Fuse results with prefix-based matches.
    const queryWords = norm(q).split(/\s+/).filter(Boolean)
    if (queryWords.length > 0) {
      const seen = new Set(raw.map((r) => r.item.fullName))
      for (const repo of indexedRepos) {
        if (seen.has(repo.fullName)) continue
        const words = blobCache.get(repo.fullName)
        if (words && queryWords.every((qw) => words.some((w) => w.startsWith(qw)))) {
          raw.push({ item: repo, score: 0.5, refIndex: 0 })
        }
      }
    }

    // Cache matchRank per item (avoid recomputing in O(n log n) comparisons)
    const rankCache = new Map<string, number>()
    for (const r of raw) {
      rankCache.set(r.item.fullName, matchRank(r.item, q))
    }

    raw.sort((a, b) => {
      const aRank = rankCache.get(a.item.fullName)!
      const bRank = rankCache.get(b.item.fullName)!
      if (aRank !== bRank) return aRank - bRank
      const scoreDiff = (a.score ?? 0) - (b.score ?? 0)
      if (Math.abs(scoreDiff) < 0.05) {
        return b.item.stargazersCount - a.item.stargazersCount
      }
      return scoreDiff
    })
    return raw.map((r) => r.item)
  }, [deferredQuery, index])

  // When repos change but no search query, return the latest repos
  if (!deferredQuery.trim()) return { query, setQuery, results: repos }

  return { query, setQuery, results }
}
