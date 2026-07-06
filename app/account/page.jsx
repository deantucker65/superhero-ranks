'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Lets a signed-in user set their public display name. The actual write goes
// through the set_display_name() RPC (security definer), which only ever
// touches display_name — so users can never change their own role this way.
export default function AccountPage() {
  const [userId, setUserId] = useState(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!active) return
      setUserId(user?.id ?? null)
      setEmail(user?.email ?? '')

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single()
        if (active) setName(data?.display_name ?? '')
      }
      if (active) setLoading(false)
    }

    load()
  }, [])

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    setError('')

    const { error: rpcError } = await supabase.rpc('set_display_name', {
      new_name: name,
    })

    if (rpcError) {
      setError(rpcError.message)
    } else {
      setMessage('Saved! Your display name is now ' + name.trim() + '.')
    }
    setBusy(false)
  }

  if (loading) {
    return <main className="max-w-md mx-auto px-6 py-16 text-gray-400">Loading…</main>
  }

  if (!userId) {
    return (
      <main className="max-w-md mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold text-yellow-400 mb-4">Account</h1>
        <p className="text-gray-400">
          <a href="/login?next=/account" className="text-yellow-400 hover:underline">
            Sign in
          </a>{' '}
          to manage your account.
        </p>
      </main>
    )
  }

  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold text-yellow-400 mb-6">Account</h1>

      <p className="text-sm text-gray-500 mb-6">
        Signed in as <span className="text-gray-300">{email}</span>
      </p>

      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Display name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-gray-100 focus:border-yellow-400 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            3–20 characters — letters, numbers, and underscores. This is the name
            shown on your comments and votes; your email is never public.
          </p>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-yellow-400 text-gray-900 font-semibold px-5 py-2 hover:bg-yellow-300 transition disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </form>

      {message && <p className="mt-4 text-sm text-green-400">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </main>
  )
}
