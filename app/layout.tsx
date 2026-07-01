import './globals.css'

export const metadata = {
  title: 'Hero Rankings',
  description: 'Every actor. Every hero. Ranked.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 min-h-screen">
        <nav className="bg-gray-900 border-b border-gray-800 px-8 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/" className="text-yellow-400 font-bold text-xl tracking-wide">
              ⚡ Hero Rankings
            </a>
            <div className="flex gap-6 text-sm">
              <a href="/" className="text-gray-300 hover:text-yellow-400 transition">
                All Actors
              </a>
              <a href="/admin" className="text-gray-300 hover:text-yellow-400 transition">
                Admin
              </a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}