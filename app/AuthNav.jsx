'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Client-side auth controls for the nav. The Admin link only renders for users
// whose profile role is 'admin'. (Real enforcement is the proxy + RLS; this is
// just so community users never even see the link.)
export default function AuthNav() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)

  useEffect(() => {
    let active = true

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!active) return
      setUser(user)

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (active) setRole(data?.role ?? 'user')
      } else {
        setRole(null)
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
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <>
      {role === 'admin' && (
        <a
          href="/admin"
          className="text-gray-300 hover:text-yellow-400 transition"
        >
          Admin
        </a>
      )}
      {user ? (
        <>
          <a
            href="/account"
            className="text-gray-300 hover:text-yellow-400 transition"
          >
            Account
          </a>
          <button
            onClick={signOut}
            className="text-gray-300 hover:text-yellow-400 transition"
          >
            Sign out
          </button>
        </>
      ) : (
        <a
          href="/login"
          className="text-gray-300 hover:text-yellow-400 transition"
        >
          Sign in
        </a>
      )}
    </>
  )
}
