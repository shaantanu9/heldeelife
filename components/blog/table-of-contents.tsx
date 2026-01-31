'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { List } from 'lucide-react'

interface Heading {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: string
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    // Extract headings from content - try to get IDs first, then generate if needed
    const headingWithIdRegex =
      /<h([1-6])[^>]*id\s*=\s*["']([^"']+)["'][^>]*>(.*?)<\/h[1-6]>/gi
    const headingWithoutIdRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi
    const matches: Heading[] = []
    let match

    // First, try to extract headings with IDs
    while ((match = headingWithIdRegex.exec(content)) !== null) {
      const level = parseInt(match[1])
      const id = match[2]
      const text = match[3].replace(/<[^>]*>/g, '').trim()

      if (id && text) {
        matches.push({ id, text, level })
      }
    }

    // If no headings with IDs found, extract all headings and generate IDs
    if (matches.length === 0) {
      while ((match = headingWithoutIdRegex.exec(content)) !== null) {
        const level = parseInt(match[1])
        const text = match[2].replace(/<[^>]*>/g, '').trim()
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')

        if (id && text) {
          matches.push({ id, text, level })
        }
      }
    }

    setHeadings(matches)

    // Set up intersection observer for active heading
    const observerOptions = {
      rootMargin: '-20% 0% -35% 0%',
      threshold: 0,
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id)
        }
      })
    }, observerOptions)

    // Observe all headings
    matches.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      matches.forEach((heading) => {
        const element = document.getElementById(heading.id)
        if (element) {
          observer.unobserve(element)
        }
      })
    }
  }, [content])

  if (headings.length === 0) return null

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100 // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  return (
    <Card className="border-gray-200 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <List className="h-5 w-5 text-orange-600" />
          Table of Contents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <nav className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {headings.map((heading, index) => (
            <button
              key={index}
              onClick={() => scrollToHeading(heading.id)}
              className={`block w-full text-left text-sm transition-colors py-1.5 px-2 rounded-md ${
                activeId === heading.id
                  ? 'text-orange-600 font-semibold bg-orange-50'
                  : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'
              }`}
              style={{
                paddingLeft: `${(heading.level - 1) * 0.75 + 0.5}rem`,
              }}
            >
              {heading.text}
            </button>
          ))}
        </nav>
      </CardContent>
    </Card>
  )
}
