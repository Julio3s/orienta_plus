import { BookOpen, Building2, Compass, Home } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import useMediaQuery from '../hooks/useMediaQuery'

const links = [
  { to: '/', label: 'Accueil', mobileLabel: 'Accueil', icon: Home },
  { to: '/orientation', label: 'Orientation', mobileLabel: 'Orient.', icon: Compass },
  { to: '/universites', label: 'Universites', mobileLabel: 'Univs', icon: Building2 },
  { to: '/filieres', label: 'Filieres et metiers', mobileLabel: 'Filieres', icon: BookOpen },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const activeLink = links.find((link) => link.to === pathname)

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(19,15,17,0.78)',
          backdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 10px 32px rgba(19,15,17,0.18)',
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            padding: isMobile ? '0 16px' : '0 24px',
            display: 'flex',
            alignItems: 'center',
            height: isMobile ? 64 : 70,
            gap: isMobile ? 12 : 16,
          }}
        >
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: isMobile ? 34 : 36,
                height: isMobile ? 34 : 36,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #C96A4A, #A94D31)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Fraunces, serif',
                fontWeight: 800,
                color: '#fff',
                fontSize: 14,
                boxShadow: '0 12px 30px rgba(201,106,74,0.24)',
              }}
            >
              O+
            </div>

            <span
              style={{
                fontFamily: 'Fraunces, serif',
                fontWeight: 700,
                fontSize: isMobile ? 16 : 18,
                color: '#F7EFE8',
                letterSpacing: '-0.02em',
              }}
            >
              ORIENTA<span style={{ color: '#C96A4A' }}>+</span>
            </span>
          </Link>

          {isMobile ? (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              <ThemeToggle compact />
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    color: '#F0B39A',
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: 'Manrope, sans-serif',
                  }}
                >
                  {activeLink?.label || 'Navigation'}
                </div>
                <div
                  style={{
                    color: '#8B7669',
                    fontSize: 11,
                    fontFamily: 'Manrope, sans-serif',
                  }}
                >
                  Benin post-bac
                </div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 4, marginLeft: 24, flex: 1 }}>
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 10,
                      textDecoration: 'none',
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: 14,
                      fontWeight: 600,
                      color: pathname === link.to ? '#F0B39A' : '#B59F90',
                      background: pathname === link.to ? 'rgba(201,106,74,0.12)' : 'transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ThemeToggle />
                <div
                  style={{
                    background: 'rgba(201,106,74,0.08)',
                    border: '1px solid rgba(201,106,74,0.16)',
                    borderRadius: 999,
                    padding: '6px 12px',
                    color: '#F0B39A',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'Manrope, sans-serif',
                  }}
                >
                  Benin post-bac
                </div>
              </div>
            </>
          )}
        </div>
      </nav>

      {isMobile && (
        <div
          style={{
            position: 'fixed',
            left: 12,
            right: 12,
            bottom: 'calc(12px + env(safe-area-inset-bottom))',
            zIndex: 1100,
            display: 'grid',
            gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))`,
            gap: 8,
            padding: 8,
            borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(19,15,17,0.92)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 18px 42px rgba(0,0,0,0.34)',
          }}
        >
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.to

            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  display: 'grid',
                  justifyItems: 'center',
                  gap: 6,
                  padding: '10px 6px',
                  textDecoration: 'none',
                  borderRadius: 18,
                  color: isActive ? '#F0B39A' : '#B59F90',
                  background: isActive ? 'rgba(201,106,74,0.14)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(201,106,74,0.22)' : 'transparent'}`,
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: 'Manrope, sans-serif',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {link.mobileLabel}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
