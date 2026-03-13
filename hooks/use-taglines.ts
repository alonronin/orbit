"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getTaglines, setTaglines, getCachedStars } from "@/lib/db"
import { generateTaglines } from "@/app/actions/taglines"
import type { GitHubProfile } from "@/lib/types"

export function useTaglines(userId: string | undefined) {
  const [tagline, setTagline] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const taglinesRef = useRef<string[]>([])
  const hasLoaded = useRef(false)

  // Load taglines from IndexedDB on mount
  useEffect(() => {
    if (!userId || hasLoaded.current) return
    hasLoaded.current = true

    async function load() {
      const stored = await getTaglines(userId!)
      if (stored && stored.length > 0) {
        taglinesRef.current = stored
        setTagline(stored[Math.floor(Math.random() * stored.length)])
      }
      setIsLoaded(true)
    }
    load()
  }, [userId])

  // Generate taglines from profile (called externally when profile is available)
  const generate = useCallback(
    async (profile: GitHubProfile) => {
      if (!userId || isGenerating) return
      setIsGenerating(true)
      try {
        const lines = await generateTaglines(profile)
        if (lines.length > 0) {
          taglinesRef.current = lines
          await setTaglines(userId, lines, profile)
          setTagline(lines[Math.floor(Math.random() * lines.length)])
        }
      } catch (err) {
        console.error("Failed to generate taglines:", err)
      } finally {
        setIsGenerating(false)
      }
    },
    [userId, isGenerating],
  )

  // Regenerate — fetch profile from cache or API if missing
  const regenerate = useCallback(async () => {
    if (!userId) return
    const cache = await getCachedStars(userId)
    let profile = cache?.githubProfile
    if (!profile) {
      const res = await fetch("/api/profile")
      if (res.ok) {
        profile = await res.json()
      }
    }
    if (profile) {
      await generate(profile)
    }
  }, [userId, generate])

  return {
    tagline,
    isGenerating,
    // Only report hasTaglines after IndexedDB check completes
    hasTaglines: !isLoaded || taglinesRef.current.length > 0,
    generate,
    regenerate,
  }
}
