"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function AuthButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <Button variant="outline" disabled>Loading...</Button>
  }

  if (session) {
    return (
      <Button variant="outline" onClick={() => signOut()}>
        Sign out
      </Button>
    )
  }

  return (
    <Button onClick={() => signIn("github")}>
      Sign in with GitHub
    </Button>
  )
}
