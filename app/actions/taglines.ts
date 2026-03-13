"use server"

import { generateText, Output } from "ai"
import { z } from "zod"
import type { GitHubProfile } from "@/lib/types"

export async function generateTaglines(
  profile: GitHubProfile,
): Promise<string[]> {
  const model = process.env.MODEL
  if (!model) {
    throw new Error("MODEL env var is not set")
  }

  const year = new Date(profile.createdAt).getFullYear()
  const userDesc = [
    profile.name && `Name: ${profile.name}`,
    profile.bio && `Bio: "${profile.bio}"`,
    `Username: ${profile.login}`,
    `${profile.publicRepos} public repos`,
    `${profile.followers} followers`,
    `On GitHub since ${year}`,
  ]
    .filter(Boolean)
    .join(", ")

  const { output } = await generateText({
    model,
    output: Output.object({
      schema: z.object({
        taglines: z
          .array(z.string())
          .describe("Exactly 100 short taglines, max 50 chars each"),
      }),
    }),
    prompt: `Generate exactly 100 short, funny, creative taglines for a developer app called "Orbit" that helps browse GitHub starred repos. Personalize to this user: ${userDesc}.

Mix styles: witty one-liners, nerdy references, self-deprecating dev humor, cosmic/orbit puns, motivational twists. Each tagline should be under 50 characters. No quotes around them. Be genuinely funny and creative — avoid generic corporate taglines.`,
  })

  return output?.taglines ?? []
}
