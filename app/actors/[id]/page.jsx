import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const tierColors = {
  S: 'bg-yellow-400 text-black',
  A: 'bg-purple-500 text-white',
  B: 'bg-blue-500 text-white',
  C: 'bg-gray-500 text-white',
}

const tierLabels = {
  S: 'S - Godlike',
  A: 'A - Extremely Powerful',
  B: 'B - Powerful',
  C: 'C - Street Level',
}

export default async function ActorPage({ params }) {
  const { id } = await params

  const { data: actor } = await supabase
    .from('actors')
    .select('*, characters(*)')
    .eq('id', id)
    .single()

  if (!actor) {
    return <div className="text-white p-8">Actor not found.</div>
  }

  const characters = (actor.characters || []).sort((a, b) => {
    if (a.rank && b.rank) return a.rank - b.rank
    if (a.rank) return -1
    if (b.rank) return 1
    const order = { S: 0, A: 1, B: 2, C: 3 }
    return order[a.power_tier] - order[b.power_tier]
  })

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-yellow-400 hover:underline mb-6 inline-block">
          ← Back to all actors
        </Link>

        <div className="flex items-center gap-6 mb-8">
          {actor.photo_url ? (
            <img
              src={actor.photo_url}
              alt={actor.name}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-gray-500 text-3xl">?</span>
            </div>
          )}
          <div>
            <h1 className="text-4xl font-bold">{actor.name}</h1>
            {actor.bio && <p className="text-gray-400 mt-1">{actor.bio}</p>}
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-yellow-400">Characters</h2>

        {characters.length === 0 ? (
          <p className="text-gray-500">No characters added yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {characters.map((character) => (
              <div key={character.id} className="bg-gray-800 rounded-2xl overflow-hidden">
                {character.photo_url && (
                  <img
                    src={character.photo_url}
                    alt={character.name}
                    className="w-full h-56 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      {character.rank && (
                        <span className="text-3xl font-black text-gray-600">
                          #{character.rank}
                        </span>
                      )}
                      <h3 className="text-2xl font-bold">{character.name}</h3>
                    </div>
                    <span className={`px-4 py-1 rounded-full text-sm font-bold ${tierColors[character.power_tier]}`}>
                      {tierLabels[character.power_tier]}
                    </span>
                  </div>

                  {character.universe && (
                    <p className="text-gray-400 text-sm mb-4">Universe: {character.universe}</p>
                  )}

                  {character.powers && (
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-yellow-400 uppercase tracking-wide mb-1">Powers & Abilities</h4>
                      <p className="text-gray-300 text-sm">{character.powers}</p>
                    </div>
                  )}

                  {character.rationale && (
                    <div>
                      <h4 className="text-sm font-bold text-yellow-400 uppercase tracking-wide mb-1">Tier Rationale</h4>
                      <p className="text-gray-300 text-sm">{character.rationale}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
