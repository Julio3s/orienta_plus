import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { filieresAPI } from '../api/client'
import ChatbotIA from '../components/ChatbotIA'
import useMediaQuery from '../hooks/useMediaQuery'

const DOMAINE_CONFIG = {
  informatique: { icon: '💻', label: 'Informatique & Numérique', color: '#2F5C7F' },
  sante:        { icon: '🏥', label: 'Santé & Médecine',         color: '#EF4444' },
  droit:        { icon: '⚖️', label: 'Droit & Sciences Politiques', color: '#C6A0FF' },
  economie:     { icon: '📊', label: 'Économie & Gestion',       color: '#C96A4A' },
  lettres:      { icon: '📖', label: 'Lettres & Sciences Humaines', color: '#f472b6' },
  agriculture:  { icon: '🌱', label: 'Agriculture & Environnement', color: '#84cc16' },
  sciences:     { icon: '⚗️', label: 'Sciences & Technologie',   color: '#D6A45B' },
  education:    { icon: '🎓', label: 'Sciences de l\'Éducation', color: '#6E9B73' },
  art:          { icon: '🎨', label: 'Arts & Communication',     color: '#fb923c' },
}

export default function FilieresPage() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [filieres, setFilieres] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtreDomaine, setFiltreDomaine] = useState('tous')
  const [filtreduree, setFiltreduree] = useState('tous')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    filieresAPI.list()
      .then(r => setFilieres(r.data.results || r.data))
      .finally(() => setLoading(false))
  }, [])

  const domaines = ['tous', ...new Set(filieres.map(f => f.domaine))]

  const filtered = filieres.filter(f => {
    const matchDomaine = filtreDomaine === 'tous' || f.domaine === filtreDomaine
    const matchDuree = filtreduree === 'tous' ||
      (filtreduree === '2' && f.duree <= 2) ||
      (filtreduree === '3' && f.duree === 3) ||
      (filtreduree === '5+' && f.duree >= 5)
    const matchSearch = !search ||
      f.nom.toLowerCase().includes(search.toLowerCase()) ||
      f.debouches?.toLowerCase().includes(search.toLowerCase())
    return matchDomaine && matchDuree && matchSearch
  })

  return (
    <div className="public-page-shell">
      <Navbar />

      {/* Hero */}
      <main className="public-page-main" style={{ animation: 'slideUp 0.5s ease' }}>
        <section className="public-page-hero">
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(214,164,91,0.1)', border: '1px solid rgba(214,164,91,0.2)',
          borderRadius: 20, padding: '6px 16px', marginBottom: 20,
        }}>
          <span style={{ fontSize: 12 }}>🎯</span>
          <span style={{ color: '#EDC98A', fontSize: 13, fontWeight: 500 }}>Débouchés & Métiers concrets</span>
        </div>
        <h1 style={{
          margin: '0 0 12px', fontFamily: 'Fraunces, serif',
          fontWeight: 800, fontSize: 'clamp(28px, 5vw, 52px)',
          color: '#F7EFE8', letterSpacing: '-0.03em', lineHeight: 1.1,
        }}>
          Toutes les filières<br />
          <span style={{
            background: 'linear-gradient(90deg, #D6A45B, #EDC98A)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>avec les vrais métiers</span>
        </h1>
        <p style={{ margin: '0 0 36px', color: '#B59F90', fontSize: 16, maxWidth: 580, lineHeight: 1.7 }}>
          Chaque filière avec ses débouchés réels, exemples de postes et fourchettes de salaire au Bénin.
        </p>

        {/* Search */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text" placeholder="🔍 Rechercher une filière, un métier..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="public-page-input"
            style={{
              width: '100%', maxWidth: 460,
              fontSize: 14,
              fontFamily: 'Manrope, sans-serif',
            }}
          />
        </div>

        {/* Filtres domaine */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {domaines.map(d => {
            const cfg = DOMAINE_CONFIG[d]
            return (
              <button key={d} onClick={() => setFiltreDomaine(d)} style={{
                padding: '7px 14px', borderRadius: 20,
                border: `1px solid ${filtreDomaine === d ? (cfg?.color || '#C96A4A') : 'rgba(255,255,255,0.08)'}`,
                background: filtreDomaine === d ? (cfg?.color || '#C96A4A') + '18' : 'transparent',
                color: filtreDomaine === d ? (cfg?.color || '#C96A4A') : '#8B7669',
                cursor: 'pointer', fontSize: 12.5, fontFamily: 'Manrope, sans-serif',
                transition: 'all 0.15s',
              }}>
                {cfg ? `${cfg.icon} ${cfg.label}` : 'Tous les domaines'}
              </button>
            )
          })}
        </div>

        {/* Filtres durée */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          {[
            { key: 'tous', label: 'Toutes durées' },
            { key: '2', label: '≤ 2 ans (BTS)' },
            { key: '3', label: '3 ans (Licence)' },
            { key: '5+', label: '5+ ans (Médecine…)' },
          ].map(d => (
            <button key={d.key} onClick={() => setFiltreduree(d.key)} style={{
              padding: '6px 14px', borderRadius: 20,
              border: `1px solid ${filtreduree === d.key ? '#D6A45B' : 'rgba(255,255,255,0.08)'}`,
              background: filtreduree === d.key ? 'rgba(214,164,91,0.12)' : 'transparent',
              color: filtreduree === d.key ? '#EDC98A' : '#8B7669',
              cursor: 'pointer', fontSize: 12.5, fontFamily: 'Manrope, sans-serif',
              transition: 'all 0.15s',
            }}>{d.label}</button>
          ))}
        </div>

        <p style={{ color: '#8B7669', fontSize: 13, margin: '0 0 20px' }}>
          {filtered.length} filière{filtered.length > 1 ? 's' : ''} trouvée{filtered.length > 1 ? 's' : ''}
        </p>

        {/* Grille */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#B59F90' }}>
            <div style={{
              width: 40, height: 40, border: '3px solid rgba(214,164,91,0.2)',
              borderTopColor: '#D6A45B', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
            }} />Chargement...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((f, i) => {
              const cfg = DOMAINE_CONFIG[f.domaine] || { icon: '🎓', color: '#C96A4A', label: f.domaine }
              const isExpanded = expanded === f.id
              const metiers = f.metiers_list || []
              const debouches = f.debouches_list || []

              return (
                <div
                  key={f.id}
                  className="public-page-card"
                  style={{
                    border: `1px solid ${isExpanded ? cfg.color + '40' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 18,
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    animation: `slideUp 0.4s ease ${i * 0.04}s both`,
                  }}
                >
                  {/* Ligne principale cliquable */}
                  <div
                    onClick={() => setExpanded(isExpanded ? null : f.id)}
                    style={{
                      padding: isMobile ? '16px' : '18px 22px', cursor: 'pointer',
                      display: 'flex', gap: 16, alignItems: 'flex-start',
                    }}
                  >
                    {/* Icône domaine */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                      background: cfg.color + '15', border: `1px solid ${cfg.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22,
                    }}>{cfg.icon}</div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <h3 style={{
                            margin: '0 0 5px', fontFamily: 'Fraunces, serif',
                            fontSize: 16, fontWeight: 700, color: '#F7EFE8',
                          }}>{f.nom}</h3>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: 12, background: cfg.color + '15', color: cfg.color,
                              borderRadius: 6, padding: '2px 9px',
                            }}>{cfg.label}</span>
                            <span style={{
                              fontSize: 12, background: 'rgba(255,255,255,0.06)', color: '#B59F90',
                              borderRadius: 6, padding: '2px 9px',
                            }}>{f.duree} an{f.duree > 1 ? 's' : ''}</span>
                            {f.taux_emploi && (
                              <span style={{
                                fontSize: 12, background: 'rgba(201,106,74,0.1)', color: '#C96A4A',
                                borderRadius: 6, padding: '2px 9px',
                              }}>{f.taux_emploi}% emploi</span>
                            )}
                          </div>
                        </div>
                        {f.salaire_moyen && (
                          <div style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 10, padding: '8px 14px', textAlign: 'right', flexShrink: 0,
                          }}>
                            <div style={{ fontSize: 10, color: '#8B7669', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Salaire</div>
                            <div style={{ fontSize: 13, color: '#EDC98A', fontWeight: 600, fontFamily: 'JetBrains Mono' }}>
                              {f.salaire_moyen.split(' - ')[0]}
                            </div>
                            <div style={{ fontSize: 10, color: '#8B7669' }}>FCFA+</div>
                          </div>
                        )}
                      </div>

                      {/* Débouchés preview */}
                      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {debouches.slice(0, 4).map((d, j) => (
                          <span key={j} style={{
                            fontSize: 12, background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            color: '#B59F90', borderRadius: 20, padding: '3px 10px',
                          }}>{d}</span>
                        ))}
                        {debouches.length > 4 && (
                          <span style={{ fontSize: 12, color: '#6C5A51' }}>+{debouches.length - 4}</span>
                        )}
                      </div>
                    </div>

                    <div style={{
                      color: '#6C5A51', fontSize: 18, transition: 'transform 0.2s',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      flexShrink: 0,
                    }}>▾</div>
                  </div>

                  {/* Contenu étendu */}
                  {isExpanded && (
                    <div style={{
                      padding: isMobile ? '0 16px 16px' : '0 22px 22px',
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                      animation: 'slideUp 0.2s ease',
                    }}>
                      <div style={{ paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>

                        {/* Description */}
                        {f.description && (
                          <p style={{ margin: 0, color: '#B59F90', fontSize: 14, lineHeight: 1.7 }}>{f.description}</p>
                        )}

                        {/* Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))', gap: 10 }}>
                          {f.salaire_moyen && (
                            <div style={{ background: 'rgba(201,106,74,0.08)', border: '1px solid rgba(201,106,74,0.15)', borderRadius: 10, padding: '12px' }}>
                              <div style={{ fontSize: 10, color: '#C96A4A', textTransform: 'uppercase', marginBottom: 3 }}>Salaire moyen</div>
                              <div style={{ fontSize: 13, color: '#F7EFE8', fontWeight: 600 }}>{f.salaire_moyen}</div>
                            </div>
                          )}
                          {f.taux_emploi && (
                            <div style={{ background: 'rgba(47,92,127,0.08)', border: '1px solid rgba(47,92,127,0.15)', borderRadius: 10, padding: '12px' }}>
                              <div style={{ fontSize: 10, color: '#2F5C7F', textTransform: 'uppercase', marginBottom: 3 }}>Taux d'emploi</div>
                              <div style={{ fontSize: 13, color: '#F7EFE8', fontWeight: 600 }}>{f.taux_emploi}% à 1 an</div>
                            </div>
                          )}
                        </div>

                        {/* Exemples de métiers */}
                        {metiers.length > 0 && (
                          <div>
                            <h4 style={{ margin: '0 0 10px', color: '#B59F90', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              💼 Exemples de postes concrets
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 8 }}>
                              {metiers.map((m, j) => (
                                <div key={j} style={{
                                  display: 'flex', gap: 10, alignItems: 'flex-start',
                                  background: 'rgba(255,255,255,0.03)',
                                  border: '1px solid rgba(255,255,255,0.06)',
                                  borderRadius: 10, padding: '10px 14px',
                                }}>
                                  <span style={{ color: cfg.color, flexShrink: 0, marginTop: 2 }}>▸</span>
                                  <span style={{ color: '#E6D9CF', fontSize: 13, lineHeight: 1.5 }}>{m}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Séries acceptées */}
                        {f.series_acceptees?.length > 0 && (
                          <div>
                            <h4 style={{ margin: '0 0 8px', color: '#B59F90', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              Séries de bac acceptées
                            </h4>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {f.series_acceptees.map(s => (
                                <span key={s.id} style={{
                                  background: cfg.color + '15', color: cfg.color,
                                  border: `1px solid ${cfg.color}30`,
                                  borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 600,
                                  fontFamily: 'Fraunces, serif',
                                }}>{s.code}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Universités */}
                        {f.universites?.length > 0 && (
                          <div>
                            <h4 style={{ margin: '0 0 8px', color: '#B59F90', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              Proposée par {f.universites.length} université{f.universites.length > 1 ? 's' : ''}
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {f.universites.map(uf => (
                                <span key={uf.id} style={{
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.09)',
                                  color: '#B59F90', borderRadius: 8, padding: '5px 12px', fontSize: 12.5,
                                }}>{uf.universite?.nom?.split(' (')[0]}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => setChatOpen(true)}
                          style={{
                            alignSelf: 'flex-start',
                            background: 'rgba(201,106,74,0.1)', border: '1px solid rgba(201,106,74,0.2)',
                            color: '#C96A4A', borderRadius: 10, padding: '9px 18px',
                            cursor: 'pointer', fontSize: 13, fontFamily: 'Manrope, sans-serif',
                          }}
                        >
                          O+ Poser une question sur cette filiere
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        </section>
      </main>

      {/* FAB */}
      <button
        onClick={() => setChatOpen(prev => !prev)}
        style={{
          position: 'fixed', bottom: isMobile ? 96 : 24, right: isMobile ? 16 : 24, zIndex: 999,
          width: isMobile ? 52 : 56, height: isMobile ? 52 : 56, borderRadius: 18,
          background: 'linear-gradient(135deg, #C96A4A, #A94D31)',
          border: 'none', cursor: 'pointer', fontSize: 24,
          boxShadow: '0 14px 32px rgba(201,106,74,0.36)',
        }}
      >O+</button>
      <ChatbotIA isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}
