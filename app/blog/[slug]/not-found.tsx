import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Search } from 'lucide-react'

export default function BlogPostNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">
            Blog Post Not Found
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            The blog post you&apos;re looking for doesn&apos;t exist or may have
            been removed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            asChild
            className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Link href="/blog" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-lg border-gray-300 hover:bg-gray-50"
          >
            <Link href="/" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Go to Home
            </Link>
          </Button>
        </div>

        <div className="mt-12 p-6 bg-white/50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            Looking for something specific? Try browsing our{' '}
            <Link
              href="/blog"
              className="text-orange-600 hover:text-orange-700 font-medium underline"
            >
              blog categories
            </Link>{' '}
            or use the search feature.
          </p>
        </div>
      </div>
    </div>
  )
}
