import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-24">
      <div className="container px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Insight Not Found
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            The insight article you&apos;re looking for doesn&apos;t exist or
            has been removed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Link href="/insights">Back to Insights</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-lg border-2 border-gray-300"
            >
              <Link href="/blog">View All Blog Posts</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}









