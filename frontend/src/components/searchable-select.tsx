"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, X } from "lucide-react"
import { Input } from "@/components/ui/input"

type SearchableSelectProps = {
  options: Array<{ id: string; name: string }>
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onFocus?: () => void
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  onFocus,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.id === value)
  const filteredOptions = options.filter((opt) => opt.name.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault()
          setIsOpen(true)
        }
        return
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length)
          break
        case "ArrowUp":
          e.preventDefault()
          setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length)
          break
        case "Enter":
          e.preventDefault()
          if (filteredOptions[highlightedIndex]) {
            onChange(filteredOptions[highlightedIndex].id)
            setIsOpen(false)
            setSearch("")
          }
          break
        case "Escape":
          e.preventDefault()
          setIsOpen(false)
          setSearch("")
          break
      }
    }

    if (isOpen) {
      inputRef.current?.focus()
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, highlightedIndex, filteredOptions, onChange])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch("")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement
      highlightedElement?.scrollIntoView({ block: "nearest" })
    }
  }, [highlightedIndex, isOpen])

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex items-center gap-2 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 bg-white border-gray-300 cursor-pointer"
        onClick={() => {
          setIsOpen(!isOpen)
          onFocus?.()
        }}
      >
        <Input
          ref={inputRef}
          type="text"
          placeholder={selectedOption ? "" : placeholder}
          value={isOpen ? search : selectedOption?.name || ""}
          onChange={(e) => {
            setSearch(e.target.value)
            setHighlightedIndex(0)
          }}
          onFocus={() => {
            setIsOpen(true)
            onFocus?.()
          }}
          className="border-0 p-0 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-0 placeholder-gray-500"
          disabled={!isOpen}
        />
        <div className="ml-auto flex items-center gap-1">
          {isOpen && selectedOption && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onChange("")
                setSearch("")
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {isOpen && (
        <div
          ref={listRef}
          className="absolute top-full left-0 right-0 mt-2 border dark:border-gray-600 dark:bg-gray-700 bg-white rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-2 text-gray-500 dark:text-gray-400">No options found</div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={option.id}
                onClick={() => {
                  onChange(option.id)
                  setIsOpen(false)
                  setSearch("")
                }}
                className={`px-4 py-2 cursor-pointer ${
                  index === highlightedIndex
                    ? "dark:bg-gray-600 bg-blue-100"
                    : "dark:hover:bg-gray-600 hover:bg-gray-100"
                } dark:text-gray-200`}
              >
                {option.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
