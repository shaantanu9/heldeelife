export const metadata = {
  title: '403 Unauthorized',
}

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">403</h1>
      <p className="mt-4 text-lg text-gray-600">
        You do not have permission to access this page.
      </p>
      <a href="/" className="mt-6 text-blue-600 hover:underline">
        Return to Home
      </a>
    </div>
  )
}
