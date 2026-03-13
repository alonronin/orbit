"use client"

import { useMemo } from "react"
import type { RepoWithLabels } from "@/lib/types"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { languageColors } from "@/lib/languages"
import { cn, stringToColor } from "@/lib/utils"

interface FilterBarProps {
  repos: RepoWithLabels[]
  activeLanguages: Set<string>
  activeLabels: Set<string>
  onToggleLanguage: (lang: string) => void
  onToggleLabel: (label: string) => void
}

export function FilterBar({
  repos,
  activeLanguages,
  activeLabels,
  onToggleLanguage,
  onToggleLabel,
}: FilterBarProps) {
  const { languages, labels } = useMemo(() => {
    const langCounts = new Map<string, number>()
    const labelCounts = new Map<string, number>()

    for (const repo of repos) {
      if (repo.language) {
        langCounts.set(repo.language, (langCounts.get(repo.language) ?? 0) + 1)
      }
      for (const label of repo.aiLabels) {
        labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1)
      }
    }

    return {
      languages: [...langCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20),
      labels: [...labelCounts.entries()].sort((a, b) => b[1] - a[1]),
    }
  }, [repos])

  return (
    <Sidebar collapsible="offcanvas" className="border-e-0">
      <SidebarContent>
        {languages.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Languages</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {languages.map(([lang, count]) => {
                  const active = activeLanguages.has(lang)
                  const color = languageColors[lang]
                  return (
                    <SidebarMenuItem key={lang}>
                      <SidebarMenuButton
                        onClick={() => onToggleLanguage(lang)}
                        isActive={active}
                        tooltip={lang}
                      >
                        {color && (
                          <span
                            className={cn(
                              "inline-block size-2 shrink-0 rounded-full",
                              active && "opacity-80"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        )}
                        <span className="truncate">{lang}</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge>{count}</SidebarMenuBadge>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {labels.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Categories</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {labels.map(([label, count]) => {
                  const active = activeLabels.has(label)
                  const color = stringToColor(label)
                  return (
                    <SidebarMenuItem key={label}>
                      <SidebarMenuButton
                        onClick={() => onToggleLabel(label)}
                        isActive={active}
                        tooltip={label}
                      >
                        <span
                          className="inline-block size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="truncate">{label}</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge>{count}</SidebarMenuBadge>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
