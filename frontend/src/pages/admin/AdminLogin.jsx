import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../../api/client'
import ThemeToggle from '../../components/ThemeToggle'

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nav = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authAPI.login(form)
      localStorage.setItem('orienta_access_token', data.access)
      localStorage.setItem('orienta_refresh_token', data.refresh)
      nav('/admin')
    } catch {
      setError('Identifiants incorrects. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mesh-bg-admin" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        animation: 'scaleIn 0.35s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <ThemeToggle compact />
        </div>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-deep))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Fraunces, serif', fontWeight: 800, color: '#fff', fontSize: 22,
            boxShadow: '0 10px 34px rgba(201,106,74,0.28)',
          }}>O+</div>
          <h1 style={{
            margin: '0 0 6px', fontFamily: 'Fraunces, serif',
            fontWeight: 800, fontSize: 24, color: '#F7EFE8',
          }}>Espace Administrateur</h1>
          <p style={{ margin: 0, color: '#8B7669', fontSize: 14 }}>
            Accès restreint — ORIENTA+
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24, padding: '32px',
          backdropFilter: 'blur(12px)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: '#B59F90', fontSize: 13, marginBottom: 6, fontFamily: 'Manrope' }}>
                Nom d'utilisateur
              </label>
              <input
                type="text" value={form.username} required
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="admin"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                  padding: '12px 16px', color: '#F7EFE8', fontSize: 14,
                  outline: 'none', fontFamily: 'Manrope, sans-serif',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#B59F90', fontSize: 13, marginBottom: 6, fontFamily: 'Manrope' }}>
                Mot de passe
              </label>
              <input
                type="password" value={form.password} required
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                  padding: '12px 16px', color: '#F7EFE8', fontSize: 14,
                  outline: 'none', fontFamily: 'Manrope, sans-serif',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13,
              }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{
              marginTop: 8, padding: '13px 20px', borderRadius: 12,
              background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-deep))',
              border: 'none', color: '#fff', fontFamily: 'Fraunces, serif',
              fontWeight: 700, fontSize: 15, cursor: loading ? 'wait' : 'pointer',
              transition: 'opacity 0.15s',
              boxShadow: '0 14px 34px rgba(201,106,74,0.22)',
            }}>
              {loading ? '⏳ Connexion...' : '🔐 Se connecter'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, color: '#4D3E39', fontSize: 12 }}>
          <a href="/" style={{ color: '#6C5A51', textDecoration: 'none' }}>
            ← Retour à la plateforme publique
          </a>
        </p>
      </div>
    </div>
  )
}
