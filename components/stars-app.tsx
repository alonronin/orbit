"use client"

import { useCallback, useMemo, useRef, useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useStars } from "@/hooks/use-stars"
import { useSearch } from "@/hooks/use-search"
import { useCategorize } from "@/hooks/use-categorize"
import { useTaglines } from "@/hooks/use-taglines"
import { Header } from "@/components/header"
import { FilterBar } from "@/components/filter-bar"
import { StatsBar } from "@/components/stats-bar"
import { RepoGrid } from "@/components/repo-grid"
import { RepoDetail } from "@/components/repo-detail"
import type { RepoWithLabels } from "@/lib/types"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { ArrowUpDownIcon, CheckIcon, FilterIcon } from "lucide-react"

type SortKey = "starredAt" | "stargazersCount" | "updatedAt" | "name"
type SortDir = "asc" | "desc"

const SORT_OPTIONS: { key: SortKey; label: string; defaultDir: SortDir }[] = [
  { key: "starredAt", label: "Starred date", defaultDir: "desc" },
  { key: "stargazersCount", label: "Stars", defaultDir: "desc" },
  { key: "updatedAt", label: "Last updated", defaultDir: "desc" },
  { key: "name", label: "Name", defaultDir: "asc" },
]

function FilterToggle() {
  const { toggleSidebar } = useSidebar()
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon-sm" onClick={toggleSidebar} />
        }
      >
        <FilterIcon />
        <span className="sr-only">Toggle filters</span>
      </TooltipTrigger>
      <TooltipContent>Toggle filters</TooltipContent>
    </Tooltip>
  )
}

export function StarsApp({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const { data: session } = useSession()
  const userId = session?.user?.email ?? session?.user?.name ?? undefined

  const { repos, isLoading, syncStatus, profile, refetch, clearAll, lastFetched } =
    useStars(userId)
  const { query, setQuery, results: searchResults } = useSearch(repos)
  const { progress, total, isCategorizing, categorize } = useCategorize()
  const { tagline, isGenerating: isGeneratingTaglines, hasTaglines, generate: generateTags, regenerate: regenerateTaglines } =
    useTaglines(userId)

  // Auto-generate taglines when profile becomes available and none exist
  useEffect(() => {
    if (profile && !hasTaglines && !isGeneratingTaglines) {
      generateTags(profile)
    }
  }, [profile, hasTaglines, isGeneratingTaglines, generateTags])

  // Auto-categorize uncategorized repos (after sync or on refresh from cache)
  const hasTriggered = useRef(false)
  useEffect(() => {
    if (hasTriggered.current || isCategorizing) return
    if (repos.length === 0) return
    // Wait for sync to finish if one is in progress
    if (syncStatus.state === "syncing" || syncStatus.state === "background") return
    const uncategorized = repos.filter((r) => !r.aiLabels || r.aiLabels.length === 0)
    if (uncategorized.length === 0) return
    hasTriggered.current = true
    if (userId) categorize(uncategorized, userId)
  }, [syncStatus.state, repos, userId, isCategorizing, categorize])

  const [activeLanguages, setActiveLanguages] = useState<Set<string>>(new Set())
  const [activeLabels, setActiveLabels] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>("starredAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [selectedRepo, setSelectedRepo] = useState<RepoWithLabels | null>(null)

  const toggleLanguage = useCallback((lang: string) => {
    setActiveLanguages((prev) => {
      const next = new Set(prev)
      if (next.has(lang)) next.delete(lang)
      else next.add(lang)
      return next
    })
  }, [])

  const toggleLabel = useCallback((label: string) => {
    setActiveLabels((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }, [])

  const filtered = useMemo(() => {
    let list = searchResults

    if (activeLanguages.size > 0) {
      list = list.filter(
        (r) => r.language && activeLanguages.has(r.language)
      )
    }
    if (activeLabels.size > 0) {
      list = list.filter((r) =>
        r.aiLabels.some((l) => activeLabels.has(l))
      )
    }

    // When searching, preserve Fuse.js relevance order
    if (!query.trim()) {
      list = [...list].sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1
        if (sortKey === "name") {
          return dir * a.name.localeCompare(b.name)
        }
        if (sortKey === "stargazersCount") {
          return dir * (a.stargazersCount - b.stargazersCount)
        }
        const aVal = a[sortKey] ?? ""
        const bVal = b[sortKey] ?? ""
        return dir * aVal.localeCompare(bVal)
      })
    }

    return list
  }, [searchResults, activeLanguages, activeLabels, sortKey, sortDir, query])

  const closeDetail = useCallback(() => setSelectedRepo(null), [])

  const handleCategorize = useCallback(() => {
    if (!userId || repos.length === 0) return
    const uncategorized = repos.filter((r) => !r.aiLabels || r.aiLabels.length === 0)
    if (uncategorized.length === 0) return
    categorize(uncategorized, userId)
  }, [userId, repos, categorize])

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"))
      } else {
        const opt = SORT_OPTIONS.find((o) => o.key === key)
        setSortKey(key)
        setSortDir(opt?.defaultDir ?? "desc")
      }
    },
    [sortKey]
  )

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <FilterBar
        repos={repos}
        activeLanguages={activeLanguages}
        activeLabels={activeLabels}
        onToggleLanguage={toggleLanguage}
        onToggleLabel={toggleLabel}
      />
      <SidebarInset>
        <Header
          query={query}
          onQueryChange={setQuery}
          onSync={() => refetch()}
          onCategorize={handleCategorize}
          onClearAll={clearAll}
          onRegenerateTaglines={regenerateTaglines}
          syncStatus={syncStatus}
          isCategorizing={isCategorizing}
          categorizeProgress={progress}
          categorizeTotal={total}
          hasData={repos.length > 0}
          tagline={tagline}
          isGeneratingTaglines={isGeneratingTaglines}
        />

        <main className="flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-3 px-4 pt-4">
            <FilterToggle />
            <StatsBar
              repos={repos}
              filteredCount={filtered.length}
              lastFetched={lastFetched}
            />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="sm" className="ml-auto" />}
              >
                <ArrowUpDownIcon data-icon="inline-start" />
                {SORT_OPTIONS.find((o) => o.key === sortKey)?.label}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  {SORT_OPTIONS.map((opt) => (
                    <DropdownMenuItem
                      key={opt.key}
                      onClick={() => handleSort(opt.key)}
                    >
                      {sortKey === opt.key && (
                        <CheckIcon data-icon="inline-start" />
                      )}
                      {opt.label}
                      {sortKey === opt.key && (
                        <span className="ml-auto text-[10px] text-muted-foreground">
                          {sortDir === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex-1 relative">
            <RepoGrid
              repos={filtered}
              isLoading={isLoading}
              hasSearchQuery={
                query.length > 0 ||
                activeLanguages.size > 0 ||
                activeLabels.size > 0
              }
              syncStatus={syncStatus}
              onRepoClick={setSelectedRepo}
            />
          </div>
        </main>

        <RepoDetail
          repo={selectedRepo}
          onClose={closeDetail}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
