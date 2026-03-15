"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogInIcon } from "lucide-react"

export function SignInPage() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Orbit
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse, search, and organize your starred repos
          </p>
        </div>
        <Button size="lg" onClick={() => signIn("github")}>
          <LogInIcon data-icon="inline-start" />
          Sign in with GitHub
        </Button>
        <p className="max-w-xs text-xs text-muted-foreground">
          We only request read access to your public profile and starred repositories.
        </p>
      </div>
    </div>
  )
}
