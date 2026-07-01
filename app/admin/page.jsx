'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const [actors, setActors] = useState([])
  const [actorName, setActorName] = useState('')
  const [actorBio, setActorBio] = useState('')
  const [actorPhotoUrl, setActorPhotoUrl] = useState('')
  const [actorMessage, setActorMessage] = useState('')

  const [selectedActor, setSelectedActor] = useState('')
  const [characterName, setCharacterName] = useState('')
  const [universe, setUniverse] = useState('')
  const [powerTier, setPowerTier] = useState('A')
  const [powers, setPowers] = useState('')
  const [rationale, setRationale] = useState('')
  const [rank, setRank] = useState('')
  const [characterPhotoUrl, setCharacterPhotoUrl] = useState('')
  const [characterMessage, setCharacterMessage] = useState('')

  const [editMode, setEditMode] = useState(false)
  const [editActorId, setEditActorId] = useState('')
  const [editCharacters, setEditCharacters] = useState([])
  const [editCharacterId, setEditCharacterId] = useState('')
  const [editMessage, setEditMessage] = useState('')
  const [deleteActorId, setDeleteActorId] = useState('')
  const [deleteCharacters, setDeleteCharacters] = useState([])
  const [deleteCharacterId, setDeleteCharacterId] = useState('')
  const [deleteMessage, setDeleteMessage] = useState('')
  useEffect(() => {
    loadActors()
  }, [])

  async function loadActors() {
    const { data } = await supabase.from('actors').select('*').order('name')
    setActors(data || [])
  }

  async function loadCharactersForActor(actorId) {
    const { data } = await supabase
      .from('characters')
      .select('*')
      .eq('actor_id', actorId)
      .order('rank')
    setEditCharacters(data || [])
    setEditCharacterId('')
  }

  function loadCharacterIntoForm(characterId) {
    const character = editCharacters.find(c => c.id === characterId)
    if (!character) return
    setCharacterName(character.name)
    setUniverse(character.universe || '')
    setPowerTier(character.power_tier || 'A')
    setPowers(character.powers || '')
    setRationale(character.rationale || '')
    setRank(character.rank?.toString() || '')
    setCharacterPhotoUrl(character.photo_url || '')
  }

  async function addActor(e) {
    e.preventDefault()
    const { error } = await supabase
      .from('actors')
      .insert([{ name: actorName, bio: actorBio, photo_url: actorPhotoUrl }])

    if (error) {
      setActorMessage('Error: ' + error.message)
    } else {
      setActorMessage('Actor added successfully!')
      setActorName('')
      setActorBio('')
      setActorPhotoUrl('')
      loadActors()
    }
  }

  async function addCharacter(e) {
    e.preventDefault()
    const { error } = await supabase
      .from('characters')
      .insert([{
        actor_id: selectedActor,
        name: characterName,
        universe,
        power_tier: powerTier,
        powers,
        rationale,
        rank: rank ? parseInt(rank) : null,
        photo_url: characterPhotoUrl
      }])

    if (error) {
      setCharacterMessage('Error: ' + error.message)
    } else {
      setCharacterMessage('Character added successfully!')
      setCharacterName('')
      setUniverse('')
      setPowerTier('A')
      setPowers('')
      setRationale('')
      setRank('')
      setCharacterPhotoUrl('')
    }
  }
  async function deleteCharacter() {
    if (!deleteCharacterId) return
    const confirm = window.confirm('Are you sure you want to delete this character?')
    if (!confirm) return
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', deleteCharacterId)
    if (error) {
      setDeleteMessage('Error: ' + error.message)
    } else {
      setDeleteMessage('Character deleted successfully!')
      setDeleteCharacterId('')
      const { data } = await supabase.from('characters').select('*').eq('actor_id', deleteActorId).order('rank')
      setDeleteCharacters(data || [])
    }
  }

  async function deleteActor() {
    if (!deleteActorId) return
    const confirm = window.confirm('Are you sure? This will delete the actor AND all their characters.')
    if (!confirm) return
    const { error } = await supabase
      .from('actors')
      .delete()
      .eq('id', deleteActorId)
    if (error) {
      setDeleteMessage('Error: ' + error.message)
    } else {
      setDeleteMessage('Actor deleted successfully!')
      setDeleteActorId('')
      setDeleteCharacters([])
      setDeleteCharacterId('')
      loadActors()
    }
  }

  async function updateCharacter(e) {
    e.preventDefault()
    const { error } = await supabase
      .from('characters')
      .update({
        name: characterName,
        universe,
        power_tier: powerTier,
        powers,
        rationale,
        rank: rank ? parseInt(rank) : null,
        photo_url: characterPhotoUrl
      })
      .eq('id', editCharacterId)

    if (error) {
      setEditMessage('Error: ' + error.message)
    } else {
      setEditMessage('Character updated successfully!')
      loadCharactersForActor(editActorId)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-400 mb-8">Admin Panel</h1>

        {/* Add Actor */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Add Actor</h2>
          <form onSubmit={addActor} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Actor Name</label>
              <input
                type="text"
                value={actorName}
                onChange={(e) => setActorName(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bio (optional)</label>
              <textarea
                value={actorBio}
                onChange={(e) => setActorBio(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Actor Photo URL (optional)</label>
              <input
                type="text"
                value={actorPhotoUrl}
                onChange={(e) => setActorPhotoUrl(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                placeholder="https://..."
              />
            </div>
            <button
              type="submit"
              className="bg-yellow-400 text-black font-bold px-6 py-2 rounded-lg hover:bg-yellow-300"
            >
              Add Actor
            </button>
          </form>
          {actorMessage && <p className="mt-4 text-green-400">{actorMessage}</p>}
        </div>

        {/* Add Character */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Add Character</h2>
          <form onSubmit={addCharacter} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Actor</label>
              <select
                value={selectedActor}
                onChange={(e) => setSelectedActor(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                required
              >
                <option value="">Select an actor...</option>
                {actors.map((actor) => (
                  <option key={actor.id} value={actor.id}>{actor.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Character Name</label>
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Universe</label>
              <input
                type="text"
                value={universe}
                onChange={(e) => setUniverse(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                placeholder="e.g. Marvel, DC, Dark Horse"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Power Tier</label>
              <select
                value={powerTier}
                onChange={(e) => setPowerTier(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="S">S - Godlike</option>
                <option value="A">A - Extremely Powerful</option>
                <option value="B">B - Powerful</option>
                <option value="C">C - Street Level</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Stack Rank</label>
              <input
                type="number"
                min="1"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                placeholder="1 = strongest, 2 = second strongest..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Character Photo URL (optional)</label>
              <input
                type="text"
                value={characterPhotoUrl}
                onChange={(e) => setCharacterPhotoUrl(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Powers & Abilities</label>
              <textarea
                value={powers}
                onChange={(e) => setPowers(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                rows={3}
                placeholder="e.g. Hellfire manipulation, superhuman strength, penance stare..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tier Rationale</label>
              <textarea
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                rows={3}
                placeholder="e.g. Ranked S because Ghost Rider can defeat cosmic-level threats..."
              />
            </div>
            <button
              type="submit"
              className="bg-yellow-400 text-black font-bold px-6 py-2 rounded-lg hover:bg-yellow-300"
            >
              Add Character
            </button>
          </form>
          {characterMessage && <p className="mt-4 text-green-400">{characterMessage}</p>}
        </div>

        {/* Edit Character */}
        <div className="bg-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Edit Character</h2>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Select Actor</label>
              <select
                value={editActorId}
                onChange={(e) => {
                  setEditActorId(e.target.value)
                  loadCharactersForActor(e.target.value)
                  setEditMode(false)
                }}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="">Select an actor...</option>
                {actors.map((actor) => (
                  <option key={actor.id} value={actor.id}>{actor.name}</option>
                ))}
              </select>
            </div>
            {editCharacters.length > 0 && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Select Character</label>
                <select
                  value={editCharacterId}
                  onChange={(e) => {
                    setEditCharacterId(e.target.value)
                    loadCharacterIntoForm(e.target.value)
                    setEditMode(true)
                  }}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Select a character...</option>
                  {editCharacters.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {editMode && (
            <form onSubmit={updateCharacter} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Character Name</label>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Universe</label>
                <input
                  type="text"
                  value={universe}
                  onChange={(e) => setUniverse(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Power Tier</label>
                <select
                  value={powerTier}
                  onChange={(e) => setPowerTier(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="S">S - Godlike</option>
                  <option value="A">A - Extremely Powerful</option>
                  <option value="B">B - Powerful</option>
                  <option value="C">C - Street Level</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Stack Rank</label>
                <input
                  type="number"
                  min="1"
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Character Photo URL</label>
                <input
                  type="text"
                  value={characterPhotoUrl}
                  onChange={(e) => setCharacterPhotoUrl(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Powers & Abilities</label>
                <textarea
                  value={powers}
                  onChange={(e) => setPowers(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tier Rationale</label>
                <textarea
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                className="bg-blue-500 text-white font-bold px-6 py-2 rounded-lg hover:bg-blue-400"
              >
                Save Changes
              </button>
            </form>
          )}
          {editMessage && <p className="mt-4 text-green-400">{editMessage}</p>}
        </div>

       </div>

        {/* Delete */}
        <div className="bg-gray-800 rounded-2xl p-6 mt-8">
          <h2 className="text-xl font-bold mb-4 text-red-400">Delete</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Select Actor</label>
              <select value={deleteActorId} onChange={(e) => {
                setDeleteActorId(e.target.value)
                setDeleteCharacterId('')
                if (e.target.value) {
                  supabase.from('characters').select('*').eq('actor_id', e.target.value).order('rank')
                    .then(({ data }) => setDeleteCharacters(data || []))
                } else {
                  setDeleteCharacters([])
                }
              }} className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white">
                <option value="">Select an actor...</option>
                {actors.map((actor) => (
                  <option key={actor.id} value={actor.id}>{actor.name}</option>
                ))}
              </select>
            </div>
            {deleteCharacters.length > 0 && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Select Character (optional)</label>
                <select value={deleteCharacterId} onChange={(e) => setDeleteCharacterId(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white">
                  <option value="">Delete actor only...</option>
                  {deleteCharacters.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-4">
              {deleteCharacterId && (
                <button onClick={deleteCharacter}
                  className="bg-red-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-red-500">
                  Delete Character
                </button>
              )}
              {deleteActorId && !deleteCharacterId && (
                <button onClick={deleteActor}
                  className="bg-red-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-red-500">
                  Delete Actor & All Characters
                </button>
              )}
            </div>
          </div>
          {deleteMessage && <p className="mt-4 text-green-400">{deleteMessage}</p>}
        </div>

    </main>
  )
}