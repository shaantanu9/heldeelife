'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, User, ShoppingCart, Heart } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { useWishlist } from '@/contexts/wishlist-context'
import { Badge } from '@/components/ui/badge'

export function MobileNav() {
  const pathname = usePathname()
  const { totalItems } = useCart()

  const { totalItems: wishlistItems } = useWishlist()

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/shop', icon: ShoppingBag, label: 'Shop' },
    { href: '/cart', icon: ShoppingCart, label: 'Cart', badge: totalItems },
    { href: '/wishlist', icon: Heart, label: 'Wishlist', badge: wishlistItems },
    { href: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 md:hidden shadow-lg safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href === '/cart' && pathname.startsWith('/cart')) ||
            (item.href === '/shop' && pathname.startsWith('/shop')) ||
            (item.href === '/wishlist' && pathname.startsWith('/wishlist')) ||
            (item.href === '/' && pathname === '/')
          const showBadge = item.badge !== undefined && item.badge > 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full relative min-h-[44px] min-w-[44px] touch-manipulation ${
                isActive
                  ? 'text-orange-600'
                  : 'text-gray-600 active:text-orange-600'
              } transition-colors active:scale-95`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {showBadge && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-orange-600 text-white text-xs font-medium">
                    {(item.badge || 0) > 9 ? '9+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
