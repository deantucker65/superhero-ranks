'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Upvote button + live count for a single character. Count comes pre-fetched
// from the server; this component checks whether the logged-in user has voted
// and lets them toggle their own vote. RLS ensures a user can only add/remove
// their own vote.
export default function CharacterVotes({ characterId, initialCount }) {
  const [count, setCount] = useState(initialCount || 0)
  const [voted, setVoted] = useState(false)
  const [userId, setUserId] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!active) return
      setUserId(user?.id ?? null)

      if (user) {
        const { data } = await supabase
          .from('votes')
          .select('character_id')
          .eq('user_id', user.id)
          .eq('character_id', characterId)
          .maybeSingle()
        if (active) setVoted(!!data)
      } else {
        setVoted(false)
      }
    }

    load()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => load())

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [characterId])

  async function toggle() {
    if (!userId || busy) return
    setBusy(true)

    if (voted) {
      setVoted(false)
      setCount((c) => c - 1)
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('user_id', userId)
        .eq('character_id', characterId)
      if (error) {
        setVoted(true)
        setCount((c) => c + 1)
      }
    } else {
      setVoted(true)
      setCount((c) => c + 1)
      const { error } = await supabase
        .from('votes')
        .insert({ user_id: userId, character_id: characterId })
      if (error) {
        setVoted(false)
        setCount((c) => c - 1)
      }
    }

    setBusy(false)
  }

  // Logged out: show the count and invite them to sign in.
  if (!userId) {
    return (
      <a
        href="/login"
        title="Sign in to vote"
        className="inline-flex items-center gap-1.5 rounded-full border border-gray-700 px-3 py-1.5 text-sm text-gray-400 hover:border-yellow-400 hover:text-yellow-400 transition"
      >
        <span>▲</span>
        <span>{count}</span>
      </a>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={voted}
      title={voted ? 'Remove your vote' : 'Upvote'}
      className={
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition disabled:opacity-60 ' +
        (voted
          ? 'border-yellow-400 bg-yellow-400 text-black'
          : 'border-gray-700 text-gray-300 hover:border-yellow-400 hover:text-yellow-400')
      }
    >
      <span>▲</span>
      <span>{count}</span>
    </button>
  )
}
