"use server"

import { generateText, Output } from "ai"
import { z } from "zod"
import type { RepoWithLabels } from "@/lib/types"

interface CategorizeResult {
  id: number
  aiLabels: string[]
  aiSummary: string | null
}

const repoItemSchema = z.object({
  id: z.number(),
  labels: z.array(z.string()),
  summary: z.string(),
})

const repoSchema = z.object({
  repos: z.array(repoItemSchema),
})

type RepoItem = z.infer<typeof repoItemSchema>

function salvageRepos(text: string): RepoItem[] {
  // Try to extract valid repo items from potentially malformed JSON.
  // Handles: duplicated JSON, wrong key names, truncated output.
  const items: RepoItem[] = []
  const seen = new Set<number>()

  // Match all JSON array patterns in the text
  const arrayRegex = /\[[\s\S]*?\]/g
  let match
  while ((match = arrayRegex.exec(text)) !== null) {
    try {
      const arr = JSON.parse(match[0])
      if (!Array.isArray(arr)) continue
      for (const item of arr) {
        const result = repoItemSchema.safeParse(item)
        if (result.success && !seen.has(result.data.id)) {
          seen.add(result.data.id)
          items.push(result.data)
        }
      }
    } catch {
      // Array might be truncated — try parsing individual objects within it
      const objRegex = /\{[^{}]*\}/g
      let objMatch
      while ((objMatch = objRegex.exec(match[0])) !== null) {
        try {
          const obj = JSON.parse(objMatch[0])
          const result = repoItemSchema.safeParse(obj)
          if (result.success && !seen.has(result.data.id)) {
            seen.add(result.data.id)
            items.push(result.data)
          }
        } catch {
          // skip malformed object
        }
      }
    }
  }
  return items
}

export async function categorizeRepos(
  repos: RepoWithLabels[],
): Promise<CategorizeResult[]> {
  const model = process.env.MODEL
  if (!model) {
    throw new Error("MODEL env var is not set")
  }

  const repoDescriptions = repos.map((r) => ({
    id: r.id,
    name: r.fullName,
    description: r.description ?? "",
    language: r.language ?? "",
    topics: r.topics.join(", "),
  }))

  const emptyResults = repos.map((r) => ({
    id: r.id,
    aiLabels: [] as string[],
    aiSummary: null,
  }))

  let output: z.infer<typeof repoSchema> | null = null

  const prompt = `Categorize these GitHub repositories. For each repo, assign 1-3 labels from the list below. For repos with no description, write a one-sentence description in the "summary" field. For repos that already have a description, set "summary" to an empty string.

Categories:
- Framework: Web/app frameworks (Next.js, Rails, Django)
- Library: Reusable code packages and SDKs
- Tool: Developer productivity and workflow tools
- DevOps: CI/CD, containers, infrastructure, deployment
- AI/ML: AI-powered tools, LLMs, machine learning, generative AI, anything using or built on AI
- Database: Databases, ORMs, data stores, caching
- UI: UI components, design systems, CSS, styling
- Testing: Test frameworks, mocking, quality assurance
- Security: Auth, encryption, vulnerability scanning
- Documentation: Docs generators, knowledge bases, wikis
- Learning: Tutorials, awesome-lists, educational resources
- API: API clients, REST/GraphQL tools, HTTP utilities
- CLI: Command-line tools and terminal utilities
- Config: Linters, formatters, build config, dotfiles
- Other: Doesn't fit above categories

A repo can match multiple categories (e.g. an AI-powered CLI tool = AI/ML + CLI + Tool).

Repos:
${JSON.stringify(repoDescriptions, null, 2)}`

  try {
    const result = await generateText({
      model: model,
      output: Output.object({ schema: repoSchema }),
      prompt,
    })

    // Try structured output first, fall back to salvaging from raw text
    try {
      output = result.output
    } catch {
      if (result.text) {
        const items = salvageRepos(result.text)
        if (items.length > 0) output = { repos: items }
      }
    }
  } catch (e: unknown) {
    // Model sometimes outputs malformed JSON (duplicated, wrong keys, truncated).
    // Salvage whatever valid repo items we can from the raw text.
    const text = e && typeof e === "object" && "text" in e
      ? (e as { text: string }).text
      : undefined
    if (text) {
      const items = salvageRepos(text)
      if (items.length > 0) output = { repos: items }
    }
    if (!output) {
      console.error("Categorization failed, skipping batch:", e)
      return emptyResults
    }
  }

  if (!output) return emptyResults

  return output.repos.map((r) => ({
    id: r.id,
    aiLabels: r.labels,
    aiSummary: r.summary,
  }))
}
