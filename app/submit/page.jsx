'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Community submission form. Signed-in users suggest an actor+character entry,
// which lands in the `submissions` queue as 'pending'. Admins review it in the
// Admin panel (approve creates the real actor/character; reject sets a note).
// Users can see and withdraw their own pending submissions here.
const statusStyles = {
  pending: 'bg-yellow-400/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
}

const emptyForm = {
  actor_name: '',
  actor_photo_url: '',
  character_name: '',
  universe: '',
  power_tier: 'A',
  powers: '',
  rationale: '',
  character_photo_url: '',
  submitter_note: '',
}

export default function SubmitPage() {
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [mine, setMine] = useState([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function loadMine() {
    const { data } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })
    setMine(data || [])
  }

  useEffect(() => {
    let active = true
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!active) return
      setUserId(user?.id ?? null)
      if (user) await loadMine()
      if (active) setLoading(false)
    }
    load()
  }, [])

  async function submit(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setMessage('')
    setError('')

    const { error: insertError } = await supabase.from('submissions').insert({
      user_id: userId,
      actor_name: form.actor_name.trim(),
      actor_photo_url: form.actor_photo_url.trim() || null,
      character_name: form.character_name.trim(),
      universe: form.universe.trim() || null,
      power_tier: form.power_tier,
      powers: form.powers.trim() || null,
      rationale: form.rationale.trim() || null,
      character_photo_url: form.character_photo_url.trim() || null,
      submitter_note: form.submitter_note.trim() || null,
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      setMessage('Thanks! Your suggestion was submitted for review.')
      setForm(emptyForm)
      await loadMine()
    }
    setBusy(false)
  }

  async function withdraw(id) {
    if (!window.confirm('Withdraw this pending submission?')) return
    const { error: delError } = await supabase.from('submissions').delete().eq('id', id)
    if (!delError) await loadMine()
  }

  if (loading) {
    return <main className="max-w-2xl mx-auto px-6 py-16 text-gray-400">Loading…</main>
  }

  if (!userId) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold text-yellow-400 mb-4">Suggest an entry</h1>
        <p className="text-gray-400">
          <a href="/login?next=/submit" className="text-yellow-400 hover:underline">
            Sign in
          </a>{' '}
          to suggest an actor and character for the site.
        </p>
      </main>
    )
  }

  const field = 'w-full bg-gray-700 rounded-lg px-4 py-2 text-white'
  const label = 'block text-sm text-gray-400 mb-1'

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-400 mb-2">Suggest an entry</h1>
        <p className="text-gray-400 mb-8">
          Know an actor and superhero role we're missing? Suggest it below — an
          admin will review it before it goes live.
        </p>

        <form onSubmit={submit} className="bg-gray-800 rounded-2xl p-6 space-y-4 mb-10">
          <div>
            <label className={label}>Actor Name</label>
            <input
              type="text"
              required
              value={form.actor_name}
              onChange={(e) => set('actor_name', e.target.value)}
              className={field}
              placeholder="e.g. Tom Hardy"
            />
            <p className="mt-1 text-xs text-gray-500">
              If this actor already exists, your character is added to them.
            </p>
          </div>
          <div>
            <label className={label}>Actor Photo URL (optional)</label>
            <input
              type="text"
              value={form.actor_photo_url}
              onChange={(e) => set('actor_photo_url', e.target.value)}
              className={field}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className={label}>Character Name</label>
            <input
              type="text"
              required
              value={form.character_name}
              onChange={(e) => set('character_name', e.target.value)}
              className={field}
              placeholder="e.g. Venom"
            />
          </div>
          <div>
            <label className={label}>Universe (optional)</label>
            <input
              type="text"
              value={form.universe}
              onChange={(e) => set('universe', e.target.value)}
              className={field}
              placeholder="e.g. Marvel, DC"
            />
          </div>
          <div>
            <label className={label}>Power Tier</label>
            <select
              value={form.power_tier}
              onChange={(e) => set('power_tier', e.target.value)}
              className={field}
            >
              <option value="S">S - Godlike</option>
              <option value="A">A - Extremely Powerful</option>
              <option value="B">B - Powerful</option>
              <option value="C">C - Street Level</option>
            </select>
          </div>
          <div>
            <label className={label}>Character Photo URL (optional)</label>
            <input
              type="text"
              value={form.character_photo_url}
              onChange={(e) => set('character_photo_url', e.target.value)}
              className={field}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className={label}>Powers & Abilities (optional)</label>
            <textarea
              value={form.powers}
              onChange={(e) => set('powers', e.target.value)}
              className={field}
              rows={3}
            />
          </div>
          <div>
            <label className={label}>Tier Rationale (optional)</label>
            <textarea
              value={form.rationale}
              onChange={(e) => set('rationale', e.target.value)}
              className={field}
              rows={3}
            />
          </div>
          <div>
            <label className={label}>Note to admin (optional)</label>
            <textarea
              value={form.submitter_note}
              onChange={(e) => set('submitter_note', e.target.value)}
              className={field}
              rows={2}
              placeholder="Anything you'd like the reviewer to know"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !form.actor_name.trim() || !form.character_name.trim()}
            className="bg-yellow-400 text-black font-bold px-6 py-2 rounded-lg hover:bg-yellow-300 disabled:opacity-60"
          >
            {busy ? 'Submitting…' : 'Submit for review'}
          </button>
          {message && <p className="text-sm text-green-400">{message}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>

        <h2 className="text-xl font-bold text-yellow-400 mb-4">Your submissions</h2>
        {mine.length === 0 ? (
          <p className="text-gray-500">You haven't submitted anything yet.</p>
        ) : (
          <div className="space-y-3">
            {mine.map((s) => (
              <div key={s.id} className="bg-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold">{s.character_name}</span>
                    <span className="text-gray-400"> — {s.actor_name}</span>
                  </div>
                  <span className={'px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ' + statusStyles[s.status]}>
                    {s.status}
                  </span>
                </div>
                {s.admin_note && (
                  <p className="mt-2 text-sm text-gray-400">
                    <span className="text-gray-500">Admin note:</span> {s.admin_note}
                  </p>
                )}
                {s.status === 'pending' && (
                  <button
                    onClick={() => withdraw(s.id)}
                    className="mt-2 text-xs text-gray-500 hover:text-red-400"
                  >
                    Withdraw
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
