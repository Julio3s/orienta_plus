import { useEffect, useState } from 'react'

function getMatches(query) {
  if (typeof window === 'undefined') return false
  return window.matchMedia(query).matches
}

export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => getMatches(query))

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const updateMatches = (event) => setMatches(event.matches)

    setMatches(mediaQuery.matches)

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatches)
      return () => mediaQuery.removeEventListener('change', updateMatches)
    }

    mediaQuery.addListener(updateMatches)
    return () => mediaQuery.removeListener(updateMatches)
  }, [query])

  return matches
}
