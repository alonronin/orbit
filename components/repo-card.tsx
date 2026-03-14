"use client"

import { memo } from "react"
import type { RepoWithLabels } from "@/lib/types"
import { languageColors } from "@/lib/languages"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { StarIcon, GitForkIcon, ArchiveIcon } from "lucide-react"
import { cn, stringToColor } from "@/lib/utils"

interface RepoCardProps {
  repo: RepoWithLabels
  onClick: () => void
  style?: React.CSSProperties
  className?: string
}

const MAX_TAGS = 2

type TagItem = { text: string; type: "topic" | "label"; color?: string }

function allTags(repo: RepoWithLabels) {
  const seen = new Set<string>()
  const tags: TagItem[] = []
  for (const t of repo.topics) {
    const key = `topic-${t}`
    if (!seen.has(key)) { seen.add(key); tags.push({ text: t, type: "topic" }) }
  }
  for (const l of repo.aiLabels) {
    const key = `label-${l}`
    if (!seen.has(key)) { seen.add(key); tags.push({ text: l, type: "label", color: stringToColor(l) }) }
  }
  return {
    visible: tags.slice(0, MAX_TAGS),
    remaining: Math.max(0, tags.length - MAX_TAGS),
  }
}

export const RepoCard = memo(function RepoCard({ repo, onClick, style, className }: RepoCardProps) {
  const langColor = repo.language ? languageColors[repo.language] : null

  return (
    <Card
      size="sm"
      className={cn(
        "cursor-pointer transition-colors hover:bg-muted/50",
        repo.isArchived && "opacity-70",
        className
      )}
      onClick={onClick}
      style={style}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarImage
              src={repo.owner.avatarUrl}
              alt={repo.owner.login}
            />
            <AvatarFallback>
              {repo.owner.login.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">
              <span className="text-muted-foreground">{repo.owner.login}/</span>
              {repo.name}
            </CardTitle>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
            <StarIcon className="size-3" />
            <span className="font-mono text-xs">
              {formatCount(repo.stargazersCount)}
            </span>
          </div>
        </div>
        {(repo.description ?? repo.aiSummary) && (
          <CardDescription className="line-clamp-2">
            {repo.description ?? repo.aiSummary}
          </CardDescription>
        )}
      </CardHeader>

      {(repo.topics.length > 0 || repo.aiLabels.length > 0) && (
        <CardContent className="mt-auto flex flex-nowrap items-center gap-1.5 overflow-hidden">
          {allTags(repo).visible.map((tag) => (
            <Badge
              key={`${tag.type}-${tag.text}`}
              variant="secondary"
              className="max-w-32 shrink-0 truncate"
              style={
                tag.type === "label"
                  ? { color: tag.color }
                  : undefined
              }
            >
              {tag.text}
            </Badge>
          ))}
          {allTags(repo).remaining > 0 && (
            <span className="shrink-0 text-[10px] text-muted-foreground">
              +{allTags(repo).remaining}
            </span>
          )}
        </CardContent>
      )}

      <CardFooter className="mt-auto gap-3 text-xs text-muted-foreground">
        {repo.language && (
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: langColor ?? "currentColor" }}
            />
            {repo.language}
          </span>
        )}
        {repo.isFork && (
          <span className="flex items-center gap-1">
            <GitForkIcon className="size-3" />
            Fork
          </span>
        )}
        {repo.isArchived && (
          <span className="flex items-center gap-1">
            <ArchiveIcon className="size-3" />
            Archived
          </span>
        )}
        <span className="ml-auto font-mono text-[10px]">
          {formatDate(repo.starredAt)}
        </span>
      </CardFooter>
    </Card>
  )
})

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}
