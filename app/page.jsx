// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const tierColors = {
  S: 'bg-yellow-400 text-black',
  A: 'bg-purple-500 text-white',
  B: 'bg-blue-500 text-white',
  C: 'bg-gray-500 text-white',
}

export default function Home() {
  const [actors, setActors] = useState([])
  const [search, setSearch] = useState('')
  const [filterUniverse, setFilterUniverse] = useState('')
  const [filterTier, setFilterTier] = useState('')
  const [universes, setUniverses] = useState([])

  useEffect(() => {
    async function loadActors() {
      const { data } = await supabase
        .from('actors')
        .select(`*, characters(*)`)
        .order('name')
      setActors(data || [])

      const allUniverses = [
        ...new Set(
          (data || []).flatMap(a => (a.characters || []).map(c => c.universe).filter(Boolean))
        )
      ].sort()
      setUniverses(allUniverses)
    }
    loadActors()
  }, [])

  const filtered = actors.filter(actor => {
    const matchesSearch = actor.name.toLowerCase().includes(search.toLowerCase())
    const chars = actor.characters || []
    const matchesUniverse = !filterUniverse || chars.some(c => c.universe === filterUniverse)
    const matchesTier = !filterTier || chars.some(c => c.power_tier === filterTier)
    return matchesSearch && matchesUniverse && matchesTier
  })

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-yellow-400">
          Hero Rankings
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Every actor. Every hero. Ranked.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <input
            type="text"
            placeholder="Search actors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-500"
          />
          <select
            value={filterUniverse}
            onChange={(e) => setFilterUniverse(e.target.value)}
            className="bg-gray-800 rounded-lg px-4 py-2 text-white"
          >
            <option value="">All Universes</option>
            {universes.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="bg-gray-800 rounded-lg px-4 py-2 text-white"
          >
            <option value="">All Tiers</option>
            <option value="S">S - Godlike</option>
            <option value="A">A - Extremely Powerful</option>
            <option value="B">B - Powerful</option>
            <option value="C">C - Street Level</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-gray-500">No actors found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((actor) => {
              const topCharacter = (actor.characters || []).sort((a, b) => {
                if (a.rank && b.rank) return a.rank - b.rank
                if (a.rank) return -1
                if (b.rank) return 1
                const order = { S: 0, A: 1, B: 2, C: 3 }
                return order[a.power_tier] - order[b.power_tier]
              })[0]

              return (
                <Link href={`/actors/${actor.id}`} key={actor.id}>
                  <div className="bg-gray-800 rounded-2xl overflow-hidden hover:bg-gray-700 transition cursor-pointer">
                    {actor.photo_url ? (
                      <img
                        src={actor.photo_url}
                        alt={actor.name}
                        className="w-full h-32 object-contain bg-gray-900"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-500 text-4xl">?</span>
                      </div>
                    )}
                    <div className="p-6">
                      <h2 className="text-xl font-bold mb-2">{actor.name}</h2>
                      <p className="text-gray-400 text-sm mb-3">
                        {(actor.characters || []).length} character{(actor.characters || []).length !== 1 ? 's' : ''}
                      </p>
                      {topCharacter && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">{topCharacter.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tierColors[topCharacter.power_tier]}`}>
                            {topCharacter.power_tier}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}