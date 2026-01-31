'use client'

import { Button } from '@/components/ui/button'
import { ShoppingBag, Search, Heart, Package, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  type: 'cart' | 'wishlist' | 'search' | 'orders' | 'products'
  title?: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const configs = {
    cart: {
      icon: <ShoppingBag className="h-16 w-16 text-gray-300" />,
      title: title || 'Your cart is empty',
      description:
        description ||
        "Looks like you haven't added anything to your cart yet. Start shopping to fill it up!",
      actionLabel: actionLabel || 'Browse Products',
      actionHref: actionHref || '/shop',
    },
    wishlist: {
      icon: <Heart className="h-16 w-16 text-gray-300" />,
      title: title || 'Your wishlist is empty',
      description:
        description ||
        "Save products you love by tapping the heart icon. They'll appear here for easy access!",
      actionLabel: actionLabel || 'Start Shopping',
      actionHref: actionHref || '/shop',
    },
    search: {
      icon: <Search className="h-16 w-16 text-gray-300" />,
      title: title || 'No results found',
      description:
        description ||
        "Try different keywords or browse our categories to find what you're looking for.",
      actionLabel: actionLabel || 'Browse All Products',
      actionHref: actionHref || '/shop',
    },
    orders: {
      icon: <Package className="h-16 w-16 text-gray-300" />,
      title: title || 'No orders yet',
      description:
        description ||
        'When you place an order, it will appear here. Start shopping to see your order history!',
      actionLabel: actionLabel || 'Start Shopping',
      actionHref: actionHref || '/shop',
    },
    products: {
      icon: <ShoppingBag className="h-16 w-16 text-gray-300" />,
      title: title || 'No products found',
      description:
        description ||
        'Try adjusting your filters or check back later for new products.',
      actionLabel: actionLabel || 'Clear Filters',
      actionHref: actionHref || '/shop',
    },
  }

  const config = configs[type]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-6">{config.icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{config.title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{config.description}</p>
      {actionHref ? (
        <Link href={actionHref}>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white">
            {config.actionLabel}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      ) : onAction ? (
        <Button
          onClick={onAction}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          {config.actionLabel}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      ) : null}
    </div>
  )
}









