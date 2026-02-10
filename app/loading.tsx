export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-orange-600 border-r-transparent" />
        <p className="mt-4 text-gray-600 text-sm">Loading...</p>
      </div>
    </div>
  )
}
