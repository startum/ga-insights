import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <h1 className="text-4xl font-bold">AI Analytics Assistant</h1>
        <p className="text-xl">Your AI-powered analytics insights</p>
        <div className="mt-8">
          <Link 
            href="/login"
            className="inline-block px-6 py-3 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}