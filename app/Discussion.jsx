'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Discussion thread. Two scopes:
//   - Actor-level (default): pass only `actorId`. Shows comments where
//     character_id is NULL. Always expanded, big heading.
//   - Character-level: also pass `characterId` + `collapsible`. Shows comments
//     for that character. Renders as a collapsible toggle with a count so the
//     actor page can pre-tally counts server-side and we only fetch the full
//     thread when the user expands it (avoids N queries on page load).
//
// Anyone can read; signed-in users can post, reply (one level deep), and
// edit/delete their own comments. Admins can delete any comment (moderation) —
// enforced by RLS, mirrored in the UI. Author names come from the
// public_profiles view (id + display_name only), since the profiles table
// itself is read-restricted to the owner.
export default function Discussion({ actorId, characterId = null, collapsible = false, initialCount = 0 }) {
  const [comments, setComments] = useState([])
  const [names, setNames] = useState({})
  const [userId, setUserId] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [open, setOpen] = useState(!collapsible)
  const [loaded, setLoaded] = useState(false)

  const [body, setBody] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [replyBody, setReplyBody] = useState('')
  const [editId, setEditId] = useState(null)
  const [editBody, setEditBody] = useState('')
  const [busy, setBusy] = useState(false)

  async function loadComments() {
    let query = supabase.from('comments').select('*')
    if (characterId) query = query.eq('character_id', characterId)
    else query = query.eq('actor_id', actorId).is('character_id', null)
    const { data: rows } = await query.order('created_at', { ascending: true })
    const list = rows || []
    setComments(list)
    setLoaded(true)

    const ids = [...new Set(list.map((c) => c.user_id))]
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from('public_profiles')
        .select('id, display_name')
        .in('id', ids)
      setNames(
        Object.fromEntries((profs || []).map((p) => [p.id, p.display_name]))
      )
    }
  }

  useEffect(() => {
    let active = true

    async function loadAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!active) return
      setUserId(user?.id ?? null)
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (active) setIsAdmin(data?.role === 'admin')
      } else {
        setIsAdmin(false)
      }
    }

    // Only fetch the thread eagerly when it's open (actor-level always is;
    // collapsible character threads wait until first expanded).
    if (open) loadComments()
    loadAuth()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => loadAuth())

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [actorId, characterId])

  function toggleOpen() {
    const next = !open
    setOpen(next)
    if (next && !loaded) loadComments()
  }

  async function post(parentId, text, after) {
    const trimmed = text.trim()
    if (!trimmed || !userId || busy) return
    setBusy(true)
    const { error } = await supabase.from('comments').insert({
      actor_id: actorId,
      character_id: characterId,
      user_id: userId,
      parent_id: parentId,
      body: trimmed,
    })
    if (!error) {
      after()
      await loadComments()
    }
    setBusy(false)
  }

  async function saveEdit(id) {
    const trimmed = editBody.trim()
    if (!trimmed || busy) return
    setBusy(true)
    const { error } = await supabase
      .from('comments')
      .update({ body: trimmed, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (!error) {
      setEditId(null)
      setEditBody('')
      await loadComments()
    }
    setBusy(false)
  }

  async function remove(id) {
    if (busy) return
    if (!window.confirm('Delete this comment?')) return
    setBusy(true)
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (!error) await loadComments()
    setBusy(false)
  }

  const nameOf = (uid) => names[uid] || 'user'
  const when = (ts) => new Date(ts).toLocaleString()
  const topLevel = comments.filter((c) => !c.parent_id)
  const repliesOf = (id) => comments.filter((c) => c.parent_id === id)
  const count = loaded ? comments.length : initialCount

  function renderComment(c, isReply) {
    const canModify = c.user_id === userId
    const canDelete = canModify || isAdmin
    return (
      <div key={c.id} className={isReply ? 'border-l-2 border-gray-700 pl-4' : ''}>
        <div className="flex items-baseline gap-2 text-sm">
          <span className="font-bold text-yellow-400">{nameOf(c.user_id)}</span>
          <span className="text-xs text-gray-500">{when(c.created_at)}</span>
          {c.updated_at && <span className="text-xs text-gray-600 italic">(edited)</span>}
        </div>

        {editId === c.id ? (
          <div className="mt-1">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={2}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => saveEdit(c.id)}
                disabled={busy}
                className="text-xs font-semibold text-black bg-yellow-400 rounded px-3 py-1 hover:bg-yellow-300 disabled:opacity-60"
              >
                Save
              </button>
              <button
                onClick={() => { setEditId(null); setEditBody('') }}
                className="text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-200 text-sm mt-0.5 whitespace-pre-wrap">{c.body}</p>
        )}

        {editId !== c.id && (
          <div className="flex gap-3 mt-1 text-xs text-gray-500">
            {userId && !isReply && (
              <button
                onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyBody('') }}
                className="hover:text-yellow-400"
              >
                Reply
              </button>
            )}
            {canModify && (
              <button
                onClick={() => { setEditId(c.id); setEditBody(c.body) }}
                className="hover:text-yellow-400"
              >
                Edit
              </button>
            )}
            {canDelete && (
              <button onClick={() => remove(c.id)} className="hover:text-red-400">
                Delete
              </button>
            )}
          </div>
        )}

        {replyTo === c.id && (
          <div className="mt-2">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={2}
              placeholder={'Reply to ' + nameOf(c.user_id) + '…'}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => post(c.id, replyBody, () => { setReplyTo(null); setReplyBody('') })}
                disabled={busy || !replyBody.trim()}
                className="text-xs font-semibold text-black bg-yellow-400 rounded px-3 py-1 hover:bg-yellow-300 disabled:opacity-60"
              >
                Reply
              </button>
              <button
                onClick={() => { setReplyTo(null); setReplyBody('') }}
                className="text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderThread() {
    return (
      <>
        {userId ? (
          <div className="mb-6">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Share your take…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
            />
            <button
              onClick={() => post(null, body, () => setBody(''))}
              disabled={busy || !body.trim()}
              className="mt-2 bg-yellow-400 text-black font-bold px-5 py-2 rounded-lg hover:bg-yellow-300 disabled:opacity-60"
            >
              Post
            </button>
          </div>
        ) : (
          <p className="mb-6 text-gray-400">
            <a href="/login" className="text-yellow-400 hover:underline">Sign in</a> to join the discussion.
          </p>
        )}

        {topLevel.length === 0 ? (
          <p className="text-gray-500">No comments yet. Be the first to weigh in.</p>
        ) : (
          <div className="space-y-6">
            {topLevel.map((c) => (
              <div key={c.id} className="bg-gray-800 rounded-xl p-4">
                {renderComment(c, false)}
                {repliesOf(c.id).length > 0 && (
                  <div className="mt-4 space-y-4">
                    {repliesOf(c.id).map((r) => renderComment(r, true))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    )
  }

  // Collapsible character-level thread: compact toggle + expandable body.
  if (collapsible) {
    return (
      <div className="mt-4 border-t border-gray-700 pt-3">
        <button
          onClick={toggleOpen}
          className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-yellow-400"
        >
          <span>{open ? '▾' : '▸'}</span>
          <span>Discussion{count > 0 && <span className="text-gray-500 font-normal"> ({count})</span>}</span>
        </button>
        {open && <div className="mt-4">{renderThread()}</div>}
      </div>
    )
  }

  // Actor-level thread: always expanded with a full heading.
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-4 text-yellow-400">
        Discussion {count > 0 && <span className="text-gray-500 text-lg">({count})</span>}
      </h2>
      {renderThread()}
    </div>
  )
}
