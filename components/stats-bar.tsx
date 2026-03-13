"use client"

import type { RepoWithLabels } from "@/lib/types"
import { cn } from "@/lib/utils"

interface StatsBarProps {
  repos: RepoWithLabels[]
  filteredCount: number
  lastFetched: string | null
}

export function StatsBar({ repos, filteredCount, lastFetched }: StatsBarProps) {
  const showFiltered = filteredCount !== repos.length

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className={cn("font-mono", showFiltered && "text-foreground")}>
        {showFiltered ? `${filteredCount} / ${repos.length}` : repos.length}{" "}
        {repos.length === 1 ? "star" : "stars"}
      </span>
      {lastFetched && (
        <>
          <span className="h-3 w-px bg-border" />
          <span>
            Synced{" "}
            {new Date(lastFetched).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </>
      )}
    </div>
  )
}
