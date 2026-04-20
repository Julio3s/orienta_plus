import { useState, useEffect } from 'react'
import { statsAPI } from '../../api/client'
import { FiBarChart2, FiClipboard, FiMapPin } from 'react-icons/fi'
import { MdAccountBalance, MdChecklist, MdHomeWork, MdSchool } from 'react-icons/md'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    statsAPI.dashboard()
      .then(r => setStats(r.data))
      .finally(() => setLoading(false))
  }, [])

  const tiles = stats ? [
    { label: 'Séries de bac', val: stats.series, icon: FiClipboard, color: '#8C6FF7' },
    { label: 'Matières', val: stats.matieres, icon: FiClipboard, color: '#D6A45B' },
    { label: 'Universités', val: stats.universites, icon: MdAccountBalance, color: '#C96A4A' },
    { label: 'Filières', val: stats.filieres, icon: MdSchool, color: '#C6A0FF' },
    { label: 'Publiques', val: stats.universites_publiques, icon: MdAccountBalance, color: '#C96A4A' },
    { label: 'Privées', val: stats.universites_privees, icon: MdHomeWork, color: '#D6A45B' },
    { label: 'Seuils configurés', val: stats.seuils_configures, icon: MdChecklist, color: '#8C6FF7' },
    { label: 'Villes couvertes', val: stats.villes?.length || 0, icon: FiMapPin, color: '#f472b6' },
  ] : []

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: '0 0 6px', fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: 28, color: '#F7EFE8' }}>
          Dashboard Admin
        </h1>
        <p style={{ margin: 0, color: '#8B7669', fontSize: 14 }}>
          Vue d'ensemble de la plateforme ORIENTA+
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#B59F90' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid rgba(140,111,247,0.2)',
            borderTopColor: '#8C6FF7', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />Chargement...
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
            {tiles.map((t, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${t.color}25`,
                borderRadius: 16, padding: '20px',
                animation: `slideUp 0.4s ease ${i * 0.06}s both`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ color: '#8B7669', fontSize: 12, marginBottom: 6, fontFamily: 'Manrope' }}>
                      {t.label}
                    </div>
                    <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: 36, color: t.color }}>
                      {t.val}
                    </div>
                  </div>
                  <t.icon size={24} style={{ opacity: 0.7 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Villes */}
          {stats?.villes?.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 18, padding: '24px',
            }}>
              <h3 style={{ margin: '0 0 14px', fontFamily: 'Fraunces, serif', fontSize: 16, color: '#F7EFE8' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <FiMapPin size={18} />
                  Villes couvertes
                </span>
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {stats.villes.map(v => (
                  <span key={v} style={{
                    background: 'rgba(201,106,74,0.1)', border: '1px solid rgba(201,106,74,0.2)',
                    color: '#C96A4A', borderRadius: 20, padding: '5px 14px', fontSize: 13,
                  }}><FiMapPin size={14} style={{ marginRight: 8 }} />{v}</span>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {[
              { to: '/admin/series', label: 'Gérer les séries', icon: FiClipboard },
              { to: '/admin/universites', label: 'Gérer les universités', icon: MdAccountBalance },
              { to: '/admin/filieres', label: 'Gérer les filières', icon: MdSchool },
              { to: '/admin/seuils', label: 'Configurer les seuils', icon: FiBarChart2 },
            ].map(q => (
              <a key={q.to} href={q.to} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(140,111,247,0.08)', border: '1px solid rgba(140,111,247,0.15)',
                borderRadius: 12, padding: '12px 16px', textDecoration: 'none',
                color: '#B7A7FF', fontSize: 14, fontFamily: 'Manrope, sans-serif',
                transition: 'all 0.15s',
              }}>
                <q.icon size={16} />
                {q.label}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
