"use client"

import { useState, useCallback } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { categorizeRepos } from "@/app/actions/categorize"
import { getCachedStars, setCachedStars } from "@/lib/db"
import type { RepoWithLabels } from "@/lib/types"

const BATCH_SIZE = 10
const CONCURRENCY = 5

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

      // Split into batches
      const batches: RepoWithLabels[][] = []
      for (let i = 0; i < repos.length; i += BATCH_SIZE) {
        batches.push(repos.slice(i, i + BATCH_SIZE))
      }

      // Process with concurrency limit
      let completed = 0
      let running = 0
      let next = 0

      await new Promise<void>((resolve, reject) => {
        const runNext = () => {
          while (running < CONCURRENCY && next < batches.length) {
            const batch = batches[next++]
            running++
            categorizeRepos(batch)
              .then(async (results) => {
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

                completed++
                running--
                setProgress(Math.min(completed * BATCH_SIZE, repos.length))

                if (completed === batches.length) {
                  resolve()
                } else {
                  runNext()
                }
              })
              .catch(reject)
          }
        }
        if (batches.length === 0) resolve()
        else runNext()
      })
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
