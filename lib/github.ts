import type { GitHubProfile, StarredRepo } from "@/lib/types"

interface GitHubStarredResponse {
  starred_at: string
  repo: {
    id: number
    full_name: string
    name: string
    owner: {
      login: string
      avatar_url: string
    }
    description: string | null
    language: string | null
    topics: string[]
    stargazers_count: number
    html_url: string
    homepage: string | null
    updated_at: string
    archived: boolean
    fork: boolean
  }
}

function mapToStarredRepo(item: GitHubStarredResponse): StarredRepo {
  return {
    id: item.repo.id,
    fullName: item.repo.full_name,
    name: item.repo.name,
    owner: {
      login: item.repo.owner.login,
      avatarUrl: item.repo.owner.avatar_url,
    },
    description: item.repo.description,
    language: item.repo.language,
    topics: item.repo.topics ?? [],
    stargazersCount: item.repo.stargazers_count,
    htmlUrl: item.repo.html_url,
    homepage: item.repo.homepage,
    starredAt: item.starred_at,
    updatedAt: item.repo.updated_at,
    isArchived: item.repo.archived,
    isFork: item.repo.fork,
  }
}

export async function fetchAllStarredRepos(
  accessToken: string,
  onPage?: (page: number, repos: StarredRepo[], totalFetched: number) => void,
): Promise<StarredRepo[]> {
  const repos: StarredRepo[] = []
  let page = 1

  while (true) {
    const res = await fetch(
      `https://api.github.com/user/starred?per_page=100&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.star+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    )

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
    }

    const data: GitHubStarredResponse[] = await res.json()

    if (data.length === 0) {
      break
    }

    const pageRepos = data.map(mapToStarredRepo)
    repos.push(...pageRepos)
    onPage?.(page, pageRepos, repos.length)

    if (data.length < 100) {
      break
    }

    page++
  }

  return repos
}

export async function fetchUserProfile(
  accessToken: string,
): Promise<GitHubProfile> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  })

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return {
    login: data.login,
    name: data.name,
    bio: data.bio,
    publicRepos: data.public_repos,
    followers: data.followers,
    createdAt: data.created_at,
  }
}
