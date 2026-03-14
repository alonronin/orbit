"use client"

import { memo } from "react"
import type { RepoWithLabels } from "@/lib/types"
import { languageColors } from "@/lib/languages"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  StarIcon,
  GitForkIcon,
  ArchiveIcon,
  ExternalLinkIcon,
  GlobeIcon,
} from "lucide-react"
import { stringToColor } from "@/lib/utils"

interface RepoDetailProps {
  repo: RepoWithLabels | null
  onClose: () => void
}

export const RepoDetail = memo(function RepoDetail({ repo, onClose }: RepoDetailProps) {
  if (!repo) return null

  const langColor = repo.language ? languageColors[repo.language] : null

  return (
    <Dialog open={!!repo} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage
                src={repo.owner.avatarUrl}
                alt={repo.owner.login}
              />
              <AvatarFallback>
                {repo.owner.login.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate">{repo.fullName}</DialogTitle>
              <DialogDescription className="sr-only">
                Details for {repo.fullName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="flex flex-col gap-4">
            {(repo.description ?? repo.aiSummary) && (
              <p className="text-xs leading-relaxed text-foreground">
                {repo.description ?? repo.aiSummary}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {repo.language && (
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2.5 rounded-full"
                    style={{ backgroundColor: langColor ?? "currentColor" }}
                  />
                  {repo.language}
                </span>
              )}
              <span className="flex items-center gap-1">
                <StarIcon className="size-3" />
                {repo.stargazersCount.toLocaleString()}
              </span>
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
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] text-muted-foreground">
              <span>
                Starred {new Date(repo.starredAt).toLocaleDateString()}
              </span>
              <span>
                Updated {new Date(repo.updatedAt).toLocaleDateString()}
              </span>
            </div>

            {(repo.topics.length > 0 || repo.aiLabels.length > 0) && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-1.5">
                  {repo.topics.map((topic) => (
                    <Badge key={topic} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                  {repo.aiLabels.map((label) => {
                    const color = stringToColor(label)
                    return (
                      <Badge
                        key={label}
                        variant="secondary"
                        style={{ color }}
                      >
                        {label}
                      </Badge>
                    )
                  })}
                </div>
              </>
            )}

            <Separator />

            <div className="flex flex-wrap gap-2">
              <a
                href={repo.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <ExternalLinkIcon data-icon="inline-start" />
                View on GitHub
              </a>
              {repo.homepage && (
                <a
                  href={repo.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <GlobeIcon data-icon="inline-start" />
                  Homepage
                </a>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
})
