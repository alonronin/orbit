"use client"

import { useDeferredValue, useMemo, useRef, useState } from "react"
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

// Lower rank = better match. Prioritize exact/substring matches over fuzzy.
function matchRank(repo: RepoWithLabels, q: string): number {
  const name = repo.name.toLowerCase()
  const fullName = repo.fullName.toLowerCase()
  if (name === q) return 0                        // exact name match: "react" = "react"
  if (fullName === q) return 0                     // exact fullName match
  if (name.includes(q) || fullName.includes(q)) return 1  // substring match anywhere in name/owner
  return 2                                         // fuzzy only
}

export function useSearch(repos: RepoWithLabels[]) {
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)

  // Only rebuild Fuse index when the number of repos changes,
  // not on every array reference change (e.g. during streaming sync)
  const reposCountRef = useRef(0)
  const fuseRef = useRef<Fuse<RepoWithLabels>>(new Fuse([], fuseOptions))
  const reposRef = useRef(repos)

  if (repos.length !== reposCountRef.current) {
    reposCountRef.current = repos.length
    fuseRef.current = new Fuse(repos, fuseOptions)
    reposRef.current = repos
  }

  const results = useMemo(() => {
    if (!deferredQuery.trim()) return reposRef.current
    const q = deferredQuery.trim().toLowerCase()
    const raw = fuseRef.current.search(deferredQuery)

    // Rank by: exact name match > exact substring in name/fullName > Fuse score > stars
    raw.sort((a, b) => {
      const aRank = matchRank(a.item, q)
      const bRank = matchRank(b.item, q)
      if (aRank !== bRank) return aRank - bRank
      const scoreDiff = (a.score ?? 0) - (b.score ?? 0)
      if (Math.abs(scoreDiff) < 0.15) {
        return b.item.stargazersCount - a.item.stargazersCount
      }
      return scoreDiff
    })
    return raw.map((r) => r.item)
  }, [deferredQuery])

  // When repos change but no search query, return the latest repos
  if (!deferredQuery.trim()) return { query, setQuery, results: repos }

  return { query, setQuery, results }
}
