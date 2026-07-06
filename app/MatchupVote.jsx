'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Community "who wins?" vote for a single bracket matchup. This is display-only:
// it never touches the admin's official winner_id on the matchup. Logged-in users
// pick a side (and can switch or clear their pick); RLS ensures each user only
// writes their own row. Counts are pre-fetched on the server for instant render.
export default function MatchupVote({ matchupId, c1, c2, initialCounts }) {
  const [counts, setCounts] = useState({
    [c1.id]: initialCounts?.[c1.id] || 0,
    [c2.id]: initialCounts?.[c2.id] || 0,
  })
  const [pick, setPick] = useState(null)
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
          .from('matchup_votes')
          .select('character_id')
          .eq('user_id', user.id)
          .eq('matchup_id', matchupId)
          .maybeSingle()
        if (active) setPick(data?.character_id ?? null)
      } else {
        setPick(null)
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
  }, [matchupId])

  async function vote(charId) {
    if (!userId || busy) return
    setBusy(true)

    const prevPick = pick
    const prevCounts = counts

    if (charId === prevPick) {
      // Clicking your current pick clears it.
      setPick(null)
      setCounts((c) => ({ ...c, [charId]: c[charId] - 1 }))
      const { error } = await supabase
        .from('matchup_votes')
        .delete()
        .eq('user_id', userId)
        .eq('matchup_id', matchupId)
      if (error) {
        setPick(prevPick)
        setCounts(prevCounts)
      }
    } else {
      // New pick, or switching sides.
      setPick(charId)
      setCounts((c) => {
        const next = { ...c, [charId]: c[charId] + 1 }
        if (prevPick) next[prevPick] = next[prevPick] - 1
        return next
      })
      const { error } = await supabase
        .from('matchup_votes')
        .upsert(
          { user_id: userId, matchup_id: matchupId, character_id: charId },
          { onConflict: 'matchup_id,user_id' }
        )
      if (error) {
        setPick(prevPick)
        setCounts(prevCounts)
      }
    }

    setBusy(false)
  }

  const total = (counts[c1.id] || 0) + (counts[c2.id] || 0)
  const pct = (id) => (total === 0 ? 0 : Math.round(((counts[id] || 0) / total) * 100))

  function Side({ side }) {
    const selected = pick === side.id
    const percent = pct(side.id)
    const n = counts[side.id] || 0
    return (
      <button
        onClick={() => vote(side.id)}
        disabled={!userId || busy}
        aria-pressed={selected}
        title={userId ? (selected ? 'Clear your pick' : 'Pick ' + side.name) : 'Sign in to vote'}
        className={
          'block w-full rounded bg-gray-700 px-2 py-1 text-left text-xs transition disabled:cursor-default ' +
          (selected ? 'ring-2 ring-yellow-400 ' : userId ? 'hover:bg-gray-600 ' : '')
        }
      >
        <span
          className={
            'flex items-center justify-between gap-1 font-semibold ' +
            (selected ? 'text-yellow-400' : 'text-white')
          }
        >
          <span className="truncate">{side.name}</span>
          <span className="tabular-nums shrink-0">{percent}% · {n}</span>
        </span>
        {/* Thin progress bar showing this side's share of the vote. */}
        <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-gray-900">
          <span
            className={'block h-full ' + (selected ? 'bg-yellow-400' : 'bg-sky-500')}
            style={{ width: percent + '%' }}
          />
        </span>
      </button>
    )
  }

  return (
    <div className="mt-1 w-40 space-y-1">
      <Side side={c1} />
      <Side side={c2} />
      {!userId ? (
        <a href="/login" className="block text-center text-[10px] text-gray-500 hover:text-yellow-400">
          Sign in to vote · {total} {total === 1 ? 'vote' : 'votes'}
        </a>
      ) : (
        <div className="text-center text-[10px] text-gray-500">
          {total} {total === 1 ? 'vote' : 'votes'}
        </div>
      )}
    </div>
  )
}
