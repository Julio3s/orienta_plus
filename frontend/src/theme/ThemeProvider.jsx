import { createContext, useContext, useEffect, useMemo } from 'react'
const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const theme = 'dark'

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('orienta_theme')
    }
  }, [])

  const value = useMemo(
    () => ({
      theme,
      isLight: false,
      isDark: true,
      setTheme: () => {},
      toggleTheme: () => {},
    }),
    []
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
