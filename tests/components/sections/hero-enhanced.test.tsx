import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeroEnhanced } from '@/components/sections/hero-enhanced'

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>,
}))

describe('HeroEnhanced', () => {
  it('displays the hero headline "Start your Health Journey with us"', () => {
    render(<HeroEnhanced />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('Start your Health Journey with us')
  })

  it('does not display the old headline text', () => {
    render(<HeroEnhanced />)
    expect(screen.queryByText(/Your Journey to Holistic Wellness Starts Here/i)).not.toBeInTheDocument()
  })
})
