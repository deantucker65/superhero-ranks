import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import CharacterVotes from '../../CharacterVotes'
import MatchupVote from '../../MatchupVote'
import Discussion from '../../Discussion'
import Image from 'next/image'

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

function MatchupBox({ matchup, nameOf, voteCounts }) {
  const slots = [matchup.character1_id, matchup.character2_id]
  const bothFilled = matchup.character1_id && matchup.character2_id
  return (
    <div className="shrink-0">
      <div className="bg-gray-800 rounded-lg overflow-hidden w-40 text-sm">
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
      {bothFilled && (
        <MatchupVote
          matchupId={matchup.id}
          c1={{ id: matchup.character1_id, name: nameOf(matchup.character1_id) }}
          c2={{ id: matchup.character2_id, name: nameOf(matchup.character2_id) }}
          initialCounts={voteCounts || {}}
        />
      )}
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

  // Tally community bracket votes per matchup (public read). Shape:
  // { [matchupId]: { [characterId]: count } }. Display-only; never affects winner_id.
  const matchupIds = bracket.map((m) => m.id)
  let matchupVoteCounts = {}
  if (matchupIds.length > 0) {
    const { data: mVotes } = await supabase
      .from('matchup_votes')
      .select('matchup_id, character_id')
      .in('matchup_id', matchupIds)
    matchupVoteCounts = (mVotes || []).reduce((acc, v) => {
      const m = (acc[v.matchup_id] = acc[v.matchup_id] || {})
      m[v.character_id] = (m[v.character_id] || 0) + 1
      return acc
    }, {})
  }

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

  // Tally upvotes per character (public read).
  const characterIds = characters.map((c) => c.id)
  let voteCounts = {}
  if (characterIds.length > 0) {
    const { data: votes } = await supabase
      .from('votes')
      .select('character_id')
      .in('character_id', characterIds)
    voteCounts = (votes || []).reduce((acc, v) => {
      acc[v.character_id] = (acc[v.character_id] || 0) + 1
      return acc
    }, {})
  }

  // Pre-tally per-character discussion comment counts (public read) so each
  // collapsible character thread can show its count without a client fetch.
  let commentCounts = {}
  if (characterIds.length > 0) {
    const { data: cRows } = await supabase
      .from('comments')
      .select('character_id')
      .in('character_id', characterIds)
    commentCounts = (cRows || []).reduce((acc, r) => {
      acc[r.character_id] = (acc[r.character_id] || 0) + 1
      return acc
    }, {})
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-yellow-400 hover:underline mb-6 inline-block">
          ← Back to all actors
        </Link>

        <div className="flex items-center gap-6 mb-8">
          {actor.photo_url ? (
            <Image
              src={actor.photo_url}
              alt={actor.name}
              width={96}
              height={96}
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
                  <div className="relative w-full h-56 bg-gray-900">
                    <Image
                      src={character.photo_url}
                      alt={character.name}
                      fill
                      sizes="(max-width: 896px) 100vw, 800px"
                      className="object-contain"
                    />
                  </div>
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
                    <div className="flex items-center gap-3">
                      <CharacterVotes
                        characterId={character.id}
                        initialCount={voteCounts[character.id] || 0}
                      />
                      <span className={`px-4 py-1 rounded-full text-sm font-bold ${tierColors[character.power_tier]}`}>
                        {tierLabels[character.power_tier]}
                      </span>
                    </div>
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

                  <Discussion
                    actorId={actor.id}
                    characterId={character.id}
                    collapsible
                    initialCount={commentCounts[character.id] || 0}
                  />
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
                    <MatchupBox key={m.id} matchup={m} nameOf={nameOf} voteCounts={matchupVoteCounts[m.id]} />
                  ))}
                </div>
              ))}

              <div className="flex flex-col items-center gap-4">
                {championChar ? (
                  <div className="flex flex-col items-center">
                    {championChar.photo_url && (
                      <div className="relative h-32 w-full max-w-xs rounded-xl overflow-hidden border-4 border-yellow-400">
                        <Image
                          src={championChar.photo_url}
                          alt={championChar.name}
                          fill
                          sizes="320px"
                          className="object-contain"
                        />
                      </div>
                    )}
                    <span className="text-yellow-400 font-black text-lg mt-2">🏆 {championChar.name}</span>
                    <span className="text-gray-400 text-xs uppercase tracking-wide">Champion</span>
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">Champion TBD</span>
                )}
                {finalMatch && <MatchupBox matchup={finalMatch} nameOf={nameOf} voteCounts={matchupVoteCounts[finalMatch.id]} />}
              </div>

              {rightCols.slice().reverse().map((col, i) => (
                <div key={'R' + i} className="flex flex-col justify-around gap-4 self-stretch">
                  {col.map((m) => (
                    <MatchupBox key={m.id} matchup={m} nameOf={nameOf} voteCounts={matchupVoteCounts[m.id]} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <Discussion actorId={actor.id} />
      </div>
    </main>
  )
}
