import { auth } from "@/lib/auth"
import { fetchAllStarredRepos, fetchUserProfile } from "@/lib/github"

export async function GET() {
  const session = await auth()
  if (!session?.accessToken) {
    return new Response("Unauthorized", { status: 401 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await fetchAllStarredRepos(
          session.accessToken,
          (page, pageRepos, totalFetched) => {
            const chunk = JSON.stringify({
              page,
              fetched: totalFetched,
              repos: pageRepos,
            })
            controller.enqueue(encoder.encode(chunk + "\n"))
          },
        )
        // Fetch user profile for tagline generation
        try {
          const profile = await fetchUserProfile(session.accessToken)
          controller.enqueue(
            encoder.encode(JSON.stringify({ profile }) + "\n")
          )
        } catch {
          // Profile fetch is non-critical, continue
        }
        controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + "\n"))
        controller.close()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error"
        controller.enqueue(
          encoder.encode(JSON.stringify({ error: message }) + "\n")
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  })
}
