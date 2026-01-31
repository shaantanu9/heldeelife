import { Loader2 } from 'lucide-react'

export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-24">
      <div className="container px-4">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      </div>
    </div>
  )
}
