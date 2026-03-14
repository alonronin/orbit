"use client"

import { memo, useCallback, useEffect, useRef, useState } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { RepoWithLabels, SyncStatus } from "@/lib/types"
import { RepoCard } from "@/components/repo-card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty"
import { SearchIcon, StarIcon, DownloadIcon } from "lucide-react"

interface RepoGridProps {
  repos: RepoWithLabels[]
  isLoading: boolean
  hasSearchQuery: boolean
  syncStatus: SyncStatus
  onRepoClick: (repo: RepoWithLabels) => void
}

const ROW_HEIGHT = 180
const ROW_GAP = 16

function useColumns() {
  const [cols, setCols] = useState(3)
  useEffect(() => {
    function update() {
      const w = window.innerWidth
      setCols(w < 768 ? 1 : w < 1024 ? 2 : 3)
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])
  return cols
}

export const RepoGrid = memo(function RepoGrid({
  repos,
  isLoading,
  hasSearchQuery,
  syncStatus,
  onRepoClick,
}: RepoGridProps) {
  const cols = useColumns()
  const parentRef = useRef<HTMLDivElement>(null)

  const rowCount = Math.ceil(repos.length / cols)

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT + ROW_GAP,
    overscan: 5,
  })

  const handleClick = useCallback(
    (repo: RepoWithLabels) => {
      onRepoClick(repo)
    },
    [onRepoClick]
  )

  // Initial load from IndexedDB
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  // Syncing with no repos yet
  if (syncStatus.state === "syncing" && repos.length === 0) {
    return (
      <Empty className="min-h-[40vh]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Spinner className="size-4" />
          </EmptyMedia>
          <EmptyTitle>Fetching your starred repos</EmptyTitle>
          <EmptyDescription>
            {syncStatus.fetched > 0
              ? `Page ${syncStatus.page} — ${syncStatus.fetched} repos found`
              : "Connecting to GitHub..."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  // Error state
  if (syncStatus.state === "error" && repos.length === 0) {
    return (
      <Empty className="min-h-[40vh]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <DownloadIcon />
          </EmptyMedia>
          <EmptyTitle>Sync failed</EmptyTitle>
          <EmptyDescription>
            {syncStatus.error ??
              "Could not fetch your starred repos. Try again."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  // No results from search/filter
  if (repos.length === 0 && hasSearchQuery) {
    return (
      <Empty className="min-h-[40vh]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchIcon />
          </EmptyMedia>
          <EmptyTitle>No results found</EmptyTitle>
          <EmptyDescription>
            Try adjusting your search or filters
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  // No stars at all
  if (repos.length === 0) {
    return (
      <Empty className="min-h-[40vh]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <StarIcon />
          </EmptyMedia>
          <EmptyTitle>No starred repos yet</EmptyTitle>
          <EmptyDescription>
            Star some repos on GitHub, then click Sync
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div ref={parentRef} className="absolute inset-0 overflow-auto">
      <div
        className="relative w-full px-4 pb-4"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIdx = virtualRow.index * cols
          const rowRepos = repos.slice(startIdx, startIdx + cols)

          return (
            <div
              key={virtualRow.key}
              className="absolute top-0 left-0 grid w-full gap-4 pt-1 px-4"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                height: ROW_HEIGHT,
              }}
            >
              {rowRepos.map((repo) => (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  onClick={() => handleClick(repo)}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
})

function SkeletonCard() {
  return (
    <Card size="sm" style={{ height: ROW_HEIGHT }}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="ml-auto h-4 w-10" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </CardHeader>
      <CardContent className="mt-auto flex items-center gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </CardContent>
      <CardFooter className="mt-auto gap-3 text-xs text-muted-foreground">
        <Skeleton className="size-2.5 rounded-full" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="ml-auto h-3 w-14" />
      </CardFooter>
    </Card>
  )
}
