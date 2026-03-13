"use client"

import { useEffect, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import {
  RefreshCwIcon,
  SparklesIcon,
  SunIcon,
  MoonIcon,
  LogOutIcon,
  Trash2Icon,
  WandSparklesIcon,
} from "lucide-react"
import { SearchBar } from "@/components/search-bar"
import type { SyncStatus } from "@/lib/types"

type ConfirmAction = "sync" | "categorize" | "signout" | "clear" | null

const CONFIRM_CONFIG: Record<
  Exclude<ConfirmAction, null>,
  { title: string; description: string; action: string; destructive?: boolean }
> = {
  sync: {
    title: "Re-sync stars?",
    description:
      "This will re-fetch all starred repos from GitHub and update your local cache.",
    action: "Sync",
  },
  categorize: {
    title: "Categorize all repos?",
    description:
      "This will use AI to label all repos. Existing labels will be overwritten.",
    action: "Categorize",
  },
  signout: {
    title: "Sign out?",
    description:
      "Keep your data for next login, or clear everything?",
    action: "Sign out",
  },
  clear: {
    title: "Clear all data?",
    description:
      "This will delete all cached stars and AI labels. You'll need to re-sync from GitHub.",
    action: "Clear",
    destructive: true,
  },
}

interface HeaderProps {
  query: string
  onQueryChange: (query: string) => void
  onSync: () => void
  onCategorize: () => void
  onClearAll: () => void
  onRegenerateTaglines: () => void
  syncStatus: SyncStatus
  isCategorizing: boolean
  categorizeProgress: number
  categorizeTotal: number
  hasData: boolean
  tagline: string | null
  isGeneratingTaglines: boolean
}

export function Header({
  query,
  onQueryChange,
  onSync,
  onCategorize,
  onClearAll,
  onRegenerateTaglines,
  syncStatus,
  isCategorizing,
  categorizeProgress,
  categorizeTotal,
  hasData,
  tagline,
  isGeneratingTaglines,
}: HeaderProps) {
  const isSyncing = syncStatus.state === "syncing"
  const { data: session } = useSession()
  const { resolvedTheme, setTheme } = useTheme()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  function handleSync() {
    if (!hasData) {
      onSync()
    } else {
      setConfirmAction("sync")
    }
  }

  function handleCategorize() {
    setConfirmAction("categorize")
  }

  function handleConfirm() {
    switch (confirmAction) {
      case "sync":
        onSync()
        break
      case "categorize":
        onCategorize()
        break
      case "signout":
        signOut()
        break
      case "clear":
        onClearAll()
        break
    }
    setConfirmAction(null)
  }

  const config = confirmAction ? CONFIRM_CONFIG[confirmAction] : null

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex h-12 items-center gap-3 px-4">
          <div className="flex shrink-0 flex-col">
            <h1 className="text-sm font-semibold leading-none tracking-tight">
              Orbit
            </h1>
            {isGeneratingTaglines ? (
              <span className="animate-pulse text-[10px] text-muted-foreground">
                Generating taglines...
              </span>
            ) : tagline ? (
              <span className="text-[10px] text-muted-foreground">
                {tagline}
              </span>
            ) : null}
          </div>

          <div className="flex flex-1 justify-center">
            <SearchBar query={query} onQueryChange={onQueryChange} />
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {isSyncing && syncStatus.state === "syncing" && syncStatus.fetched > 0 && (
              <Badge variant="secondary" className="gap-1.5 font-mono">
                <Spinner className="size-3" />
                {syncStatus.fetched} repos
              </Badge>
            )}
            {syncStatus.state === "background" && (
              <Spinner className="size-3 text-muted-foreground" />
            )}
            {isCategorizing && (
              <Badge variant="secondary" className="gap-1.5 font-mono">
                <Spinner className="size-3" />
                {categorizeProgress}/{categorizeTotal}
              </Badge>
            )}
            {isGeneratingTaglines && (
              <Badge variant="secondary" className="gap-1.5">
                <Spinner className="size-3" />
                Generating taglines
              </Badge>
            )}

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleSync}
                    disabled={isSyncing}
                  />
                }
              >
                {isSyncing ? <Spinner /> : <RefreshCwIcon />}
                <span className="sr-only">Sync stars</span>
              </TooltipTrigger>
              <TooltipContent>Sync stars</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleCategorize}
                    disabled={isCategorizing || !hasData}
                  />
                }
              >
                <SparklesIcon />
                <span className="sr-only">Categorize with AI</span>
              </TooltipTrigger>
              <TooltipContent>Categorize with AI</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      window.open(
                        "https://github.com/alonronin/orbit",
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                  />
                }
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                <span className="sr-only">View on GitHub</span>
              </TooltipTrigger>
              <TooltipContent>View on GitHub</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setTheme(resolvedTheme === "dark" ? "light" : "dark")
                    }
                  />
                }
              >
                {mounted && resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
                <span className="sr-only">Toggle theme</span>
              </TooltipTrigger>
              <TooltipContent>Toggle theme (d)</TooltipContent>
            </Tooltip>

            {session?.user && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                  }
                >
                  <Avatar size="sm">
                    <AvatarImage
                      src={session.user.image ?? undefined}
                      alt={session.user.name ?? "User"}
                    />
                    <AvatarFallback>
                      {(session.user.name ?? "U").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="min-w-48">
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className="text-xs text-muted-foreground"
                      disabled
                    >
                      {session.user.email}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={onRegenerateTaglines}
                      disabled={isGeneratingTaglines}
                    >
                      <WandSparklesIcon data-icon="inline-start" />
                      Regenerate taglines
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => setConfirmAction("clear")}
                    >
                      <Trash2Icon data-icon="inline-start" />
                      Clear all data
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setConfirmAction("signout")}
                    >
                      <LogOutIcon data-icon="inline-start" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{config?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {config?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {confirmAction === "signout" ? (
              <>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    onClearAll()
                    signOut()
                    setConfirmAction(null)
                  }}
                >
                  Clear data & sign out
                </AlertDialogAction>
                <AlertDialogAction
                  onClick={() => {
                    signOut()
                    setConfirmAction(null)
                  }}
                >
                  Keep data & sign out
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction
                onClick={handleConfirm}
                variant={config?.destructive ? "destructive" : "default"}
              >
                {config?.action}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
