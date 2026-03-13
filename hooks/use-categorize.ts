"use client"

import { useState, useCallback } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { categorizeRepos } from "@/app/actions/categorize"
import { getCachedStars, setCachedStars } from "@/lib/db"
import type { RepoWithLabels } from "@/lib/types"

const BATCH_SIZE = 20

export function useCategorize() {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)

  const mutation = useMutation({
    mutationFn: async ({
      repos,
      userId,
    }: {
      repos: RepoWithLabels[]
      userId: string
    }) => {
      setTotal(repos.length)
      setProgress(0)

      for (let i = 0; i < repos.length; i += BATCH_SIZE) {
        const batch = repos.slice(i, i + BATCH_SIZE)
        const results = await categorizeRepos(batch)

        // Update IndexedDB with new labels
        const cached = await getCachedStars(userId)
        if (cached) {
          for (const result of results) {
            const repo = cached.repos.find((r) => r.id === result.id)
            if (repo) {
              repo.aiLabels = result.aiLabels
              repo.aiSummary = result.aiSummary
            }
          }
          cached.lastCategorized = new Date().toISOString()
          await setCachedStars(cached)
        }

        setProgress(Math.min(i + BATCH_SIZE, repos.length))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stars"] })
    },
  })

  const categorize = useCallback(
    (repos: RepoWithLabels[], userId: string) => {
      mutation.mutate({ repos, userId })
    },
    [mutation],
  )

  return {
    progress,
    total,
    isCategorizing: mutation.isPending,
    categorize,
  }
}
