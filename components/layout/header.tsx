'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { User, ShoppingBag, Menu, X, Search } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { ComparisonModal } from '@/components/conversion/product-comparison'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export function Header() {
  const { data: session } = useSession()
  const { totalItems } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: '/about', label: 'About' },
    { href: '/blog', label: 'Blog' },
    { href: '/service', label: 'Service' },
    { href: '/shop', label: 'Shop' },
    { href: '/resource', label: 'Resource' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm safe-area-inset-top">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <span className="text-xl md:text-2xl font-light tracking-wider text-gray-900 group-hover:text-orange-600 transition-colors">
            heldeelife
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-light tracking-wide text-gray-700 hover:text-orange-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Link
            href="/search"
            className="p-2 hover:bg-orange-50 rounded-full transition-colors text-gray-600 hover:text-orange-600"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Link>
          <Link
            href="/cart"
            className="relative p-2 hover:bg-orange-50 rounded-full transition-colors text-gray-600 hover:text-orange-600"
            aria-label="Shopping cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-orange-600 text-white text-xs">
                {totalItems > 9 ? '9+' : totalItems}
              </Badge>
            )}
          </Link>
          {session ? (
            <Button
              onClick={() => signOut()}
              className="flex items-center gap-2 rounded-lg px-4 md:px-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              <User className="h-4 w-4" />
              <span className="hidden lg:inline">Profile</span>
            </Button>
          ) : (
            <Button
              onClick={() => signIn()}
              className="flex items-center gap-2 rounded-lg px-4 md:px-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              <User className="h-4 w-4" />
              <span className="hidden lg:inline">Profile</span>
            </Button>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="flex md:hidden items-center space-x-2">
          <Link
            href="/search"
            className="p-2 hover:bg-orange-50 rounded-full transition-colors text-gray-600 hover:text-orange-600"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Link>
          <Link
            href="/cart"
            className="relative p-2 hover:bg-orange-50 rounded-full transition-colors text-gray-600 hover:text-orange-600"
            aria-label="Shopping cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-orange-600 text-white text-xs">
                {totalItems > 9 ? '9+' : totalItems}
              </Badge>
            )}
          </Link>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="p-2 hover:bg-orange-50 rounded-full transition-colors text-gray-600 hover:text-orange-600"
                aria-label="Menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium text-gray-700 hover:text-orange-600 transition-colors py-2 border-b border-gray-100"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-4 border-t border-gray-200">
                  {session ? (
                    <Button
                      onClick={() => {
                        signOut()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        signIn()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md"
                    >
                      <User className="h-4 w-4" />
                      Sign In
                    </Button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
