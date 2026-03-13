"use server"

import { generateText, Output } from "ai"
import { z } from "zod"
import type { RepoWithLabels } from "@/lib/types"

interface CategorizeResult {
  id: number
  aiLabels: string[]
  aiSummary: string | null
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

  const { output } = await generateText({
    model: model,
    output: Output.object({
      schema: z.object({
        repos: z.array(
          z.object({
            id: z.number(),
            labels: z
              .array(z.string())
              .describe("1-3 category labels from the predefined list"),
            summary: z
              .string()
              .describe(
                "One concise sentence describing what this repo does"
              ),
          })
        ),
      }),
    }),
    prompt: `Categorize these GitHub repositories. For each repo, assign 1-3 labels from the list below. Also write a one-sentence summary.

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
${JSON.stringify(repoDescriptions, null, 2)}`,
  })

  if (!output) {
    return repos.map((r) => ({
      id: r.id,
      aiLabels: [],
      aiSummary: null,
    }))
  }

  return output.repos.map((r) => ({
    id: r.id,
    aiLabels: r.labels,
    aiSummary: r.summary,
  }))
}
