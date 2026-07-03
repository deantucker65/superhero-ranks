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

function MatchupBox({ matchup, nameOf }) {
  const slots = [matchup.character1_id, matchup.character2_id]
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden w-40 text-sm shrink-0">
      {slots.map((cid, i) => (
        <div
          key={i}
          className={
            'px-3 py-2 ' +
            (i === 0 ? 'border-b border-gray-700 ' : '') +
            (matchup.winner_id && matchup.winner_id === cid
              ? 'bg-yellow-400 text-black font-bold'
              : cid ? 'text-gray-300' : 'text-gray-600 italic')
          }
        >
          {cid ? nameOf(cid) : (matchup.winner_id ? 'Bye' : 'TBD')}
        </div>
      ))}
    </div>
  )
}

export default async function ActorPage({ params }) {
  const { id } = await params

  const { data: actor } = await supabase
    .from('actors')
    .select('*, characters(*)')
    .eq('id', id)
    .single()

  const { data: matchups } = await supabase
    .from('matchups')
    .select('*')
    .eq('actor_id', id)
    .order('round')
    .order('position')

  if (!actor) {
    return <div className="text-white p-8">Actor not found.</div>
  }

  // Bracket layout: split earlier rounds half-left / half-right of the final
  const bracket = matchups || []
  const maxRound = bracket.length > 0 ? Math.max(...bracket.map(m => m.round)) : 0
  const finalMatch = bracket.find(m => m.round === maxRound)
  const leftCols = []
  const rightCols = []
  for (let r = 1; r < maxRound; r++) {
    const roundMatches = bracket.filter(m => m.round === r)
    const half = roundMatches.length / 2
    leftCols.push(roundMatches.slice(0, half))
    rightCols.push(roundMatches.slice(half))
  }
  const nameOf = (cid) => {
    const c = (actor.characters || []).find(ch => ch.id === cid)
    return c ? c.name : 'TBD'
  }
  const championChar = finalMatch && finalMatch.winner_id
    ? (actor.characters || []).find(ch => ch.id === finalMatch.winner_id)
    : null

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
                    className="w-full h-56 object-contain bg-gray-900"
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

        {bracket.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">Playoff Bracket</h2>
            <div className="flex items-center justify-center gap-6 overflow-x-auto pb-4">
              {leftCols.map((col, i) => (
                <div key={'L' + i} className="flex flex-col justify-around gap-4 self-stretch">
                  {col.map((m) => (
                    <MatchupBox key={m.id} matchup={m} nameOf={nameOf} />
                  ))}
                </div>
              ))}

              <div className="flex flex-col items-center gap-4">
                {championChar ? (
                  <div className="flex flex-col items-center">
                    {championChar.photo_url && (
                      <img
                        src={championChar.photo_url}
                        alt={championChar.name}
                        className="h-32 w-auto max-w-xs rounded-xl object-contain border-4 border-yellow-400"
                      />
                    )}
                    <span className="text-yellow-400 font-black text-lg mt-2">🏆 {championChar.name}</span>
                    <span className="text-gray-400 text-xs uppercase tracking-wide">Champion</span>
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">Champion TBD</span>
                )}
                {finalMatch && <MatchupBox matchup={finalMatch} nameOf={nameOf} />}
              </div>

              {rightCols.slice().reverse().map((col, i) => (
                <div key={'R' + i} className="flex flex-col justify-around gap-4 self-stretch">
                  {col.map((m) => (
                    <MatchupBox key={m.id} matchup={m} nameOf={nameOf} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
