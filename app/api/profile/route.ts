import { auth } from "@/lib/auth"
import { fetchUserProfile } from "@/lib/github"

export async function GET() {
  const session = await auth()
  if (!session?.accessToken) {
    return new Response("Unauthorized", { status: 401 })
  }

  const profile = await fetchUserProfile(session.accessToken)
  return Response.json(profile)
}
