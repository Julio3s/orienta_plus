import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import AdminDashboard from './AdminDashboard'
import GestionSeries from './GestionSeries'
import GestionMatieres from './GestionMatieres'
import GestionUniversites from './GestionUniversites'
import GestionFilieres from './GestionFilieres'
import GestionSeuils from './GestionSeuils'
import ThemeToggle from '../../components/ThemeToggle'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { to: '/admin/series', label: 'Séries', icon: '📋' },
  { to: '/admin/matieres', label: 'Matières', icon: '📚' },
  { to: '/admin/universites', label: 'Universités', icon: '🏛️' },
  { to: '/admin/filieres', label: 'Filières', icon: '🎓' },
  { to: '/admin/seuils', label: 'Seuils', icon: '📈' },
]

export default function AdminLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const logout = () => {
    localStorage.removeItem('orienta_access_token')
    localStorage.removeItem('orienta_refresh_token')
    navigate('/admin/login')
  }

  const activeLink = (item) => {
    if (item.exact) return pathname === item.to
    return pathname.startsWith(item.to) && item.to !== '/admin'
      || (item.to === '/admin' && pathname === '/admin')
  }

  // Version mobile : sidebar en overlay
  if (isMobile) {
    return (
      <div className="mesh-bg-admin" style={{ minHeight: '100vh', background: '#0a0a0f' }}>
        {/* Barre d'en-tête mobile */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(10,10,15,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                width: 40, height: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 20 }}>☰</span>
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'linear-gradient(135deg, #8C6FF7, #5E49C8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Fraunces, serif', fontWeight: 800, color: '#fff', fontSize: 12,
                }}>O+</div>
                <div>
                  <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 14, color: '#F7EFE8' }}>
                    ORIENTA+ Admin
                  </div>
                </div>
              </div>
            </div>
          </div>
          <ThemeToggle compact />
        </div>

        {/* Menu latéral mobile (overlay) */}
        {isMobileMenuOpen && (
          <>
            <div
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 200,
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(4px)',
              }}
            />
            <div style={{
              position: 'fixed', top: 0, left: 0, bottom: 0,
              width: '75%', maxWidth: 280,
              background: 'rgba(10,10,15,0.98)',
              backdropFilter: 'blur(16px)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              zIndex: 201,
              display: 'flex', flexDirection: 'column',
              animation: 'slideIn 0.3s ease',
            }}>
              {/* En-tête du menu mobile */}
              <div style={{
                padding: '20px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, #8C6FF7, #5E49C8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Fraunces, serif', fontWeight: 800, color: '#fff', fontSize: 14,
                  }}>O+</div>
                  <div>
                    <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 14, color: '#F7EFE8' }}>
                      ORIENTA+
                    </div>
                    <div style={{ fontSize: 10, color: '#8C6FF7', fontWeight: 500 }}>Admin</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: 'none',
                    borderRadius: 8,
                    width: 32, height: 32,
                    cursor: 'pointer',
                    fontSize: 18,
                    color: '#94a3b8',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Navigation mobile */}
              <nav style={{ flex: 1, padding: '16px 12px' }}>
                {NAV.map(item => {
                  const active = activeLink(item)
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', borderRadius: 12, marginBottom: 4,
                        textDecoration: 'none',
                        background: active ? 'rgba(140,111,247,0.15)' : 'transparent',
                        border: `1px solid ${active ? 'rgba(140,111,247,0.3)' : 'transparent'}`,
                        color: active ? '#B7A7FF' : '#8B7669',
                        fontSize: 14, fontFamily: 'Manrope, sans-serif', fontWeight: 500,
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{item.icon}</span>
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              {/* Footer mobile */}
              <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 10, marginBottom: 8,
                    textDecoration: 'none', color: '#8B7669', fontSize: 13,
                    fontFamily: 'Manrope, sans-serif',
                  }}
                >
                  <span>🌐</span> Voir le site public
                </a>
                <button onClick={logout} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                  color: '#f87171', fontSize: 13, cursor: 'pointer',
                  fontFamily: 'Manrope, sans-serif', textAlign: 'left',
                }}>
                  <span>🚪</span> Déconnexion
                </button>
              </div>
            </div>
          </>
        )}

        {/* Contenu principal mobile */}
        <div style={{ padding: '20px 16px', minHeight: 'calc(100vh - 64px)' }}>
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="series" element={<GestionSeries />} />
            <Route path="matieres" element={<GestionMatieres />} />
            <Route path="universites" element={<GestionUniversites />} />
            <Route path="filieres" element={<GestionFilieres />} />
            <Route path="seuils" element={<GestionSeuils />} />
          </Routes>
        </div>

        <style>{`
          @keyframes slideIn {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }
        `}</style>
      </div>
    )
  }

  // Version desktop : sidebar fixe
  return (
    <div className="mesh-bg-admin" style={{ minHeight: '100vh', display: 'flex', background: '#0a0a0f' }}>
      {/* Sidebar Desktop */}
      <div style={{
        width: isCollapsed ? 80 : 260, flexShrink: 0,
        background: 'rgba(15,23,42,0.8)',
        backdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        overflowY: 'auto',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden',
      }}>
        {/* Logo admin */}
        <div style={{
          padding: isCollapsed ? '24px 10px 20px' : '24px 20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                flexShrink: 0,
                background: 'linear-gradient(135deg, #8C6FF7, #5E49C8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Fraunces, serif', fontWeight: 800, color: '#fff', fontSize: 16,
              }}>O+</div>
              {!isCollapsed && (
                <div style={{ animation: 'fadeIn 0.2s ease', whiteSpace: 'nowrap' }}>
                  <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 16, color: '#F7EFE8' }}>
                    ORIENTA+
                  </div>
                  <div style={{ fontSize: 11, color: '#8C6FF7', fontWeight: 500 }}>Administration</div>
                </div>
              )}
            </div>
            {!isCollapsed && <ThemeToggle compact />}
          </div>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              width: '100%', marginTop: 16,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 8, color: '#8B7669', cursor: 'pointer', padding: '6px',
              fontSize: 12, transition: 'all 0.2s'
            }}
          >
            {isCollapsed ? '→' : '← Réduire'}
          </button>
        </div>

        {/* Nav links desktop */}
        <nav style={{ flex: 1, padding: '16px 10px' }}>
          {NAV.map(item => {
            const active = activeLink(item)
            return (
              <Link key={item.to} to={item.to} title={isCollapsed ? item.label : ''} style={{
                display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: 12,
                padding: '10px 14px', borderRadius: 10, marginBottom: 4,
                textDecoration: 'none',
                background: active ? 'rgba(140,111,247,0.12)' : 'transparent',
                border: `1px solid ${active ? 'rgba(140,111,247,0.25)' : 'transparent'}`,
                color: active ? '#B7A7FF' : '#94a3b8',
                fontSize: 14, fontFamily: 'Manrope, sans-serif', fontWeight: 500,
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                {!isCollapsed && <span style={{ animation: 'fadeIn 0.2s ease' }}>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer desktop */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: 12,
              padding: '9px 14px', borderRadius: 10, marginBottom: 8,
              textDecoration: 'none', color: '#94a3b8', fontSize: 13,
              fontFamily: 'Manrope, sans-serif', transition: 'all 0.15s',
            }}
          >
            <span>🌐</span> {!isCollapsed && "Voir le site public"}
          </a>
          <button onClick={logout} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: 12,
            padding: '9px 14px', borderRadius: 10,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
            color: '#f87171', fontSize: 13, cursor: 'pointer',
            fontFamily: 'Manrope, sans-serif', textAlign: 'left',
            transition: 'all 0.15s',
          }}>
            <span>🚪</span> {!isCollapsed && "Déconnexion"}
          </button>
        </div>
      </div>

      {/* Main content desktop */}
      <div style={{ flex: 1, minWidth: 0, padding: '28px 32px', overflowY: 'auto' }}>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="series" element={<GestionSeries />} />
          <Route path="matieres" element={<GestionMatieres />} />
          <Route path="universites" element={<GestionUniversites />} />
          <Route path="filieres" element={<GestionFilieres />} />
          <Route path="seuils" element={<GestionSeuils />} />
        </Routes>
      </div>
    </div>
  )
}