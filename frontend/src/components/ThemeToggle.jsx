import { Moon, SunMedium } from 'lucide-react'
import { useTheme } from '../theme/ThemeProvider'

export default function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useTheme()
  const isLight = theme === 'light'
  const Icon = isLight ? Moon : SunMedium
  const label = isLight ? 'Sombre' : 'Clair'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Passer en mode ${label.toLowerCase()}`}
      aria-label={`Passer en mode ${label.toLowerCase()}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: compact ? 0 : 8,
        minWidth: compact ? 42 : 'auto',
        height: compact ? 42 : 40,
        padding: compact ? '0' : '0 14px',
        borderRadius: compact ? 14 : 999,
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.06)',
        color: '#F7EFE8',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 700,
        fontFamily: 'Manrope, sans-serif',
        transition: 'transform 0.2s ease, border-color 0.2s ease, background 0.2s ease',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = 'translateY(-1px)'
        event.currentTarget.style.borderColor = 'rgba(201,106,74,0.24)'
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = 'translateY(0)'
        event.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
      }}
    >
      <Icon size={18} strokeWidth={2.2} />
      {!compact && <span>{label}</span>}
    </button>
  )
}
