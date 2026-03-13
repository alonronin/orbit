import { cookies } from "next/headers"
import { auth } from "@/lib/auth"
import { StarsApp } from "@/components/stars-app"
import { SignInPage } from "@/components/sign-in-page"

export default async function Home() {
  const session = await auth()

  if (!session) {
    return <SignInPage />
  }

  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get("sidebar_state")?.value
  const defaultOpen = sidebarCookie !== "false"

  return <StarsApp defaultOpen={defaultOpen} />
}
