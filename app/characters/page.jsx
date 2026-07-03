import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const tierColors = {
  S: 'bg-yellow-400 text-black',
  A: 'bg-purple-500 text-white',
  B: 'bg-blue-500 text-white',
  C: 'bg-gray-500 text-white',
}

// "Green Goblin (Harry Osborn)" and "Green Goblin" should group together
function baseName(name) {
  return name.replace(/\s*\(.*\)\s*$/, '').trim()
}

export default async function SharedCharactersPage() {
  const { data: characters } = await supabase
    .from('characters')
    .select('*, actors(id, name)')
    .order('name')

  const groups = {}
  for (const c of characters || []) {
    const key = baseName(c.name)
    if (!groups[key]) groups[key] = []
    groups[key].push(c)
  }

  const shared = Object.entries(groups)
    .filter(([, list]) => list.length >= 2)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-400 mb-2">Shared Characters</h1>
        <p className="text-gray-400 mb-8">
          Characters played by more than one actor. Who wore it best?
        </p>

        {shared.length === 0 ? (
          <p className="text-gray-500">No shared characters yet.</p>
        ) : (
          <div className="space-y-8">
            {shared.map(([name, list]) => (
              <div key={name} className="bg-gray-800 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">
                  {name}
                  <span className="text-gray-500 text-base font-normal ml-3">
                    {list.length} actors
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {list.map((c) => (
                    <Link
                      key={c.id}
                      href={'/actors/' + c.actors.id}
                      className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-yellow-400 transition"
                    >
                      {c.photo_url ? (
                        <img
                          src={c.photo_url}
                          alt={c.name}
                          className="w-full h-40 object-contain bg-gray-950"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gray-950 flex items-center justify-center">
                          <span className="text-gray-700 text-4xl">?</span>
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold">{c.actors.name}</span>
                          <span className={'px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ' + tierColors[c.power_tier]}>
                            {c.power_tier}
                          </span>
                        </div>
                        {c.universe && (
                          <p className="text-gray-500 text-xs mt-1">{c.universe}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
