'use client'

import Link from 'next/link'
import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-white to-orange-50/40">
      <div className="text-center max-w-md w-full">
        <WifiOff className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          You&apos;re Offline
        </h1>
        <p className="text-gray-600 mb-6">
          It looks like you&apos;re not connected to the internet. Please check
          your connection and try again.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          Try Again
        </Button>
        <Link
          href="/"
          className="block mt-4 text-orange-600 hover:text-orange-700"
        >
          Go to Home
        </Link>
      </div>
    </div>
  )
}









