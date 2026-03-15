"use client"

import { useEffect, useRef } from "react"
import { SearchIcon, XIcon } from "lucide-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group"

interface SearchBarProps {
  query: string
  onQueryChange: (query: string) => void
}

export function SearchBar({ query, onQueryChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !isTypingTarget(e.target)) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        onQueryChange("")
        inputRef.current?.blur()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onQueryChange])

  return (
    <InputGroup className="w-full max-w-sm">
      <InputGroupAddon align="inline-start">
        <SearchIcon data-icon="inline-start" className="text-muted-foreground" />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        placeholder="Search stars..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      {query && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            onClick={() => onQueryChange("")}
          >
            <XIcon />
            <span className="sr-only">Clear search</span>
          </InputGroupButton>
        </InputGroupAddon>
      )}
      {!query && (
        <InputGroupAddon align="inline-end">
          <kbd className="pointer-events-none rounded-sm border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            /
          </kbd>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}
