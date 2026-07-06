'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  function nextUrl() {
    if (typeof window === 'undefined') return '/'
    return new URLSearchParams(window.location.search).get('next') || '/'
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setMessage('')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        setMessage(
          'Account created. If email confirmation is on, check your inbox — otherwise you can sign in now.'
        )
        setMode('signin')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        window.location.href = nextUrl()
        return
      }
    }
    setBusy(false)
  }

  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold text-yellow-400 mb-6">
        {mode === 'signin' ? 'Sign in' : 'Create an account'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-gray-100 focus:border-yellow-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-gray-100 focus:border-yellow-400 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-yellow-400 text-gray-900 font-semibold py-2 hover:bg-yellow-300 transition disabled:opacity-50"
        >
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>
      </form>

      {message && <p className="mt-4 text-sm text-gray-300">{message}</p>}

      <button
        onClick={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin')
          setMessage('')
        }}
        className="mt-6 text-sm text-gray-400 hover:text-yellow-400 transition"
      >
        {mode === 'signin'
          ? "Don't have an account? Sign up"
          : 'Already have an account? Sign in'}
      </button>
    </main>
  )
}
