"use server"

import { auth } from "@/lib/auth"
import { fetchAllStarredRepos } from "@/lib/github"
import type { StarredRepo } from "@/lib/types"

export async function syncStars(): Promise<StarredRepo[]> {
  const session = await auth()

  if (!session?.accessToken) {
    throw new Error("Not authenticated")
  }

  return fetchAllStarredRepos(session.accessToken)
}
