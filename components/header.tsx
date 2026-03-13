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
