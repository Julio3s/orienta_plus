import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import FormulaireNotes from '../components/etudiant/FormulaireNotes'
import ResultatCarte from '../components/etudiant/ResultatCarte'
import ModalDetailFiliere from '../components/etudiant/ModalDetailFiliere'
import ChatbotIA from '../components/ChatbotIA'

const IMG_BG = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1800&q=80'

export default function EspaceEtudiant() {
  const [resultats, setResultats] = useState(null)
  const [selectedSerie, setSelectedSerie] = useState(null)
  const [modalFiliere, setModalFiliere] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [showResults, setShowResults] = useState(false)

  const resultatsCount = resultats?.length || 0
  const filteredResultats = (resultats || []).filter(r =>
    filtreStatut === 'tous' || r.statut === filtreStatut
  )

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const handleResultats = (data, serie, contacts, notes) => {
    setResultats(data)
    setSelectedSerie(serie)
    setShowResults(true)
    setTimeout(() => scrollTo('resultats-section'), 150)
  }

  const handleReset = () => {
    setResultats(null)
    setSelectedSerie(null)
    setFiltreStatut('tous')
    setShowResults(false)
    setTimeout(() => scrollTo('simulateur-top'), 80)
  }

  const filters = [
    { key: 'tous', label: `Tous (${resultatsCount})`, color: '#10B981' },
    { key: 'bourse', label: '🏆 Bourse complète', color: '#10B981' },
    { key: 'demi_bourse', label: '🎓 Demi-bourse', color: '#3B82F6' },
    { key: 'payant', label: '📚 Payant', color: '#F59E0B' },
  ]

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#0a0a0f' }}>
      {/* Background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `url(${IMG_BG})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'brightness(0.15)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(circle at 30% 20%, rgba(2,6,23,0.85), rgba(0,0,0,0.95))',
        pointerEvents: 'none',
      }} />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-up { animation: fadeInUp 0.5s ease forwards; }
        .animate-fade { animation: fadeIn 0.4s ease forwards; }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />

        <main style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>

          {/* Hero Section */}
          <section id="simulateur-top" className="animate-up" style={{ textAlign: 'center', padding: '50px 0 30px' }}>
            <div style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.1))',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 100, padding: '6px 18px', marginBottom: 20,
            }}>
              <span style={{ color: '#10B981', fontSize: 13, fontWeight: 600 }}>🎓 Simulation d'orientation</span>
            </div>
            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: 800,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              lineHeight: 1.2,
              marginBottom: 16,
              color: '#fff',
              letterSpacing: '-0.02em',
            }}>
              Trouve ta voie en<br />
              <span style={{
                background: 'linear-gradient(135deg, #10B981, #3B82F6, #a78bfa)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              }}>quelques clics</span>
            </h1>
            <p style={{
              maxWidth: 550, margin: '0 auto',
              color: '#94a3b8', fontSize: 15, lineHeight: 1.6,
              fontFamily: "'Inter', sans-serif",
            }}>
              Découvre les filières qui te correspondent vraiment. Basé sur tes notes et les seuils réels des universités.
            </p>
          </section>

          {/* Formulaire complet (gère ses propres étapes internes) */}
          {!showResults && (
            <div id="formulaire-section" className="animate-fade" style={{ maxWidth: 650, margin: '0 auto', padding: '10px 0 50px' }}>
              <FormulaireNotes onResultats={handleResultats} />
            </div>
          )}

          {/* Résultats */}
          {showResults && resultats && (
            <section id="resultats-section" className="animate-up" style={{ padding: '20px 0 60px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: 16, marginBottom: 28,
              }}>
                <div>
                  <div style={{
                    display: 'inline-block',
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: 20, padding: '5px 14px', marginBottom: 12,
                  }}>
                    <span style={{ color: '#34d399', fontSize: 12, fontWeight: 600 }}>🎓 Résultats personnalisés</span>
                  </div>
                  <h2 style={{
                    fontSize: 'clamp(26px, 4vw, 34px)',
                    fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif",
                    color: '#fff', marginBottom: 6,
                  }}>
                    {resultatsCount} filière{resultatsCount > 1 ? 's' : ''} compatible{resultatsCount > 1 ? 's' : ''}
                  </h2>
                  <p style={{ color: '#64748b', fontSize: 14 }}>
                    Série {selectedSerie?.code} — {selectedSerie?.nom}
                  </p>
                </div>
                <button onClick={handleReset} style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, padding: '10px 20px', color: '#94a3b8',
                  cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
                }}>
                  🔄 Nouvelle simulation
                </button>
              </div>

              {/* Filtres */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
                {filters.map(f => (
                  <button key={f.key} onClick={() => setFiltreStatut(f.key)} style={{
                    padding: '8px 20px', borderRadius: 40, cursor: 'pointer',
                    border: `1px solid ${filtreStatut === f.key ? f.color : 'rgba(255,255,255,0.1)'}`,
                    background: filtreStatut === f.key ? `${f.color}15` : 'transparent',
                    color: filtreStatut === f.key ? f.color : '#64748b',
                    fontSize: 13, fontFamily: "'Inter', sans-serif", fontWeight: 500,
                    transition: 'all 0.2s',
                  }}>{f.label}</button>
                ))}
              </div>

              {/* Liste des résultats */}
              {filteredResultats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', background: 'rgba(255,255,255,0.02)', borderRadius: 24, color: '#64748b' }}>
                  Aucun résultat pour ce filtre.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredResultats.map((r, i) => (
                    <ResultatCarte key={r.filiere_id} resultat={r} index={i} onClick={setModalFiliere} />
                  ))}
                </div>
              )}

              {/* Callout IA */}
              <div style={{
                marginTop: 40,
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.04))',
                border: '1px solid rgba(16,185,129,0.2)', borderRadius: 24,
                padding: '20px 28px', display: 'flex', gap: 20,
                alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
                    🤖 Besoin d'aide pour choisir ?
                  </div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>
                    Notre conseiller IA peut t'expliquer chaque filière et répondre à tes questions.
                  </div>
                </div>
                <button onClick={() => setChatOpen(true)} style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  border: 'none', borderRadius: 14, padding: '11px 26px',
                  color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                }}>
                  💬 Parler au conseiller
                </button>
              </div>
            </section>
          )}

          {/* Footer */}
          <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '35px 0 30px', textAlign: 'center' }}>
            <p style={{ color: '#475569', fontSize: 12 }}>© 2025 ORIENTA+ — Orientation universitaire Bénin</p>
          </footer>
        </main>
      </div>

      {/* Chat FAB */}
      <button onClick={() => setChatOpen(p => !p)} style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 999,
        width: 54, height: 54, borderRadius: '50%',
        background: chatOpen ? '#374151' : 'linear-gradient(135deg, #10B981, #059669)',
        border: 'none', cursor: 'pointer', fontSize: 22,
        boxShadow: '0 8px 25px rgba(16,185,129,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
        transition: 'all 0.2s',
      }}>
        {chatOpen ? '✕' : '💬'}
      </button>

      <ChatbotIA
        context={{ serie: selectedSerie?.code, has_results: !!resultats }}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      {modalFiliere && (
        <ModalDetailFiliere resultat={modalFiliere} onClose={() => setModalFiliere(null)} />
      )}
    </div>
  )
}