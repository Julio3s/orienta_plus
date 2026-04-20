import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FiGlobe, FiLogOut, FiMenu, FiX } from 'react-icons/fi'
import { MdAccountBalance, MdDashboard, MdMenuBook, MdSchool, MdShowChart } from 'react-icons/md'
import { HiOutlineClipboardList } from 'react-icons/hi'
import AdminDashboard from './AdminDashboard'
import GestionSeries from './GestionSeries'
import GestionMatieres from './GestionMatieres'
import GestionUniversites from './GestionUniversites'
import GestionFilieres from './GestionFilieres'
import GestionSeuils from './GestionSeuils'
import ThemeToggle from '../../components/ThemeToggle'
import { useTheme } from '../../theme/ThemeProvider'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: MdDashboard, exact: true },
  { to: '/admin/series', label: 'Séries', icon: HiOutlineClipboardList },
  { to: '/admin/matieres', label: 'Matières', icon: MdMenuBook },
  { to: '/admin/universites', label: 'Universités', icon: MdAccountBalance },
  { to: '/admin/filieres', label: 'Filières', icon: MdSchool },
  { to: '/admin/seuils', label: 'Seuils', icon: MdShowChart },
]

export default function AdminLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { isLight } = useTheme()
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
      <div className="mesh-bg-admin" style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        {/* Barre d'en-tête mobile */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(10,10,15,0.95)',
          backdropFilter: isLight ? 'none' : 'blur(12px)',
          borderBottom: isLight ? '1px solid rgba(15,23,42,0.08)' : '1px solid rgba(255,255,255,0.06)',
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
              <FiMenu size={20} color="#94a3b8" />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-deep))',
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
              background: isLight ? 'rgba(255,255,255,0.98)' : 'rgba(10,10,15,0.98)',
              backdropFilter: isLight ? 'none' : 'blur(16px)',
              borderRight: isLight ? '1px solid rgba(15,23,42,0.10)' : '1px solid rgba(255,255,255,0.06)',
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
                    background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-deep))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Fraunces, serif', fontWeight: 800, color: '#fff', fontSize: 14,
                  }}>O+</div>
                  <div>
                    <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 14, color: '#F7EFE8' }}>
                      ORIENTA+
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--brand-tertiary-soft)', fontWeight: 600 }}>Admin</div>
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
                  <FiX size={18} />
                </button>
              </div>

              {/* Navigation mobile */}
              <nav style={{ flex: 1, padding: '16px 12px' }}>
                {NAV.map(item => {
                  const Icon = item.icon
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
                        background: active ? 'rgba(201,106,74,0.12)' : 'transparent',
                        border: `1px solid ${active ? 'rgba(201,106,74,0.22)' : 'transparent'}`,
                        color: active ? 'var(--brand-tertiary-soft)' : 'var(--text-faint)',
                        fontSize: 14, fontFamily: 'Manrope, sans-serif', fontWeight: 500,
                        transition: 'all 0.15s',
                      }}
                    >
                      <Icon size={18} />
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
                  <FiGlobe size={16} /> Voir le site public
                </a>
                <button onClick={logout} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                  color: '#f87171', fontSize: 13, cursor: 'pointer',
                  fontFamily: 'Manrope, sans-serif', textAlign: 'left',
                }}>
                  <FiLogOut size={16} /> Déconnexion
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
    <div className="mesh-bg-admin" style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-base)' }}>
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
                background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-deep))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Fraunces, serif', fontWeight: 800, color: '#fff', fontSize: 16,
              }}>O+</div>
              {!isCollapsed && (
                <div style={{ animation: 'fadeIn 0.2s ease', whiteSpace: 'nowrap' }}>
                  <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 16, color: '#F7EFE8' }}>
                    ORIENTA+
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--brand-tertiary-soft)', fontWeight: 600 }}>Administration</div>
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
            const Icon = item.icon
            const active = activeLink(item)
            return (
              <Link key={item.to} to={item.to} title={isCollapsed ? item.label : ''} style={{
                display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: 12,
                padding: '10px 14px', borderRadius: 10, marginBottom: 4,
                textDecoration: 'none',
                background: active ? 'rgba(201,106,74,0.12)' : 'transparent',
                border: `1px solid ${active ? 'rgba(201,106,74,0.22)' : 'transparent'}`,
                color: active ? 'var(--brand-tertiary-soft)' : '#94a3b8',
                fontSize: 14, fontFamily: 'Manrope, sans-serif', fontWeight: 500,
                transition: 'all 0.15s',
              }}>
                <Icon size={18} />
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
            <FiGlobe size={16} /> {!isCollapsed && "Voir le site public"}
          </a>
          <button onClick={logout} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: 12,
            padding: '9px 14px', borderRadius: 10,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
            color: '#f87171', fontSize: 13, cursor: 'pointer',
            fontFamily: 'Manrope, sans-serif', textAlign: 'left',
            transition: 'all 0.15s',
          }}>
            <FiLogOut size={16} /> {!isCollapsed && "Déconnexion"}
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