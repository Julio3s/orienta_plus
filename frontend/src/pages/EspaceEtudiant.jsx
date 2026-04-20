import { useState } from 'react'
import Navbar from '../components/Navbar'
import FormulaireNotes from '../components/etudiant/FormulaireNotes'
import ModalDetailFiliere from '../components/etudiant/ModalDetailFiliere'
import ResultatCarte from '../components/etudiant/ResultatCarte'
import studentsOutdoor from '../assets/home/students-outdoor.jpg'

const IMG_BG = studentsOutdoor

export default function EspaceEtudiant() {
  const [resultats, setResultats] = useState(null)
  const [selectedSerie, setSelectedSerie] = useState(null)
  const [modalFiliere, setModalFiliere] = useState(null)
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [showResults, setShowResults] = useState(false)

  const resultatsCount = resultats?.length || 0
  const filteredResultats = (resultats || []).filter(
    (resultat) => filtreStatut === 'tous' || resultat.statut === filtreStatut
  )

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleResultats = (data, serie) => {
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
    { key: 'tous', label: `Tous (${resultatsCount})`, color: '#C96A4A' },
    { key: 'bourse', label: 'Bourse complete', color: '#C96A4A' },
    { key: 'demi_bourse', label: 'Demi-bourse', color: '#2F5C7F' },
    { key: 'payant', label: 'Payant', color: '#D6A45B' },
  ]

  return (
    <div className="public-page-shell">
      <div className="public-page-photo-backdrop" style={{ backgroundImage: `url(${IMG_BG})` }} />
      <div className="public-page-overlay" />

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

        <main className="public-page-main public-page-main-narrow">
          <section
            id="simulateur-top"
            className="animate-up public-page-hero"
            style={{ textAlign: 'center' }}
          >
            <div
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, rgba(201,106,74,0.15), rgba(47,92,127,0.1))',
                border: '1px solid rgba(201,106,74,0.25)',
                borderRadius: 100,
                padding: '6px 18px',
                marginBottom: 20,
              }}
            >
              <span style={{ color: '#F0B39A', fontSize: 13, fontWeight: 600 }}>
                Simulation d orientation
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(32px, 5vw, 48px)',
                fontWeight: 800,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                lineHeight: 1.2,
                marginBottom: 16,
                color: '#fff',
                letterSpacing: '-0.02em',
              }}
            >
              Trouve ta voie en
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #C96A4A, #EAA07D, #2F5C7F)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                quelques clics
              </span>
            </h1>

            <p
              style={{
                maxWidth: 550,
                margin: '0 auto',
                color: '#94a3b8',
                fontSize: 15,
                lineHeight: 1.6,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Decouvre les filieres qui te correspondent vraiment a partir de tes notes, de ta
              serie et des seuils reels des universites du Benin.
            </p>
          </section>

          {!showResults && (
            <div
              id="formulaire-section"
              className="animate-fade public-page-section"
              style={{ maxWidth: 650, margin: '0 auto' }}
            >
              <FormulaireNotes onResultats={handleResultats} />
            </div>
          )}

          {showResults && resultats && (
            <section id="resultats-section" className="animate-up public-page-section public-page-panel">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                  marginBottom: 28,
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'inline-block',
                      background: 'rgba(201,106,74,0.1)',
                      border: '1px solid rgba(201,106,74,0.2)',
                      borderRadius: 20,
                      padding: '5px 14px',
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ color: '#F0B39A', fontSize: 12, fontWeight: 600 }}>
                      Resultats personnalises
                    </span>
                  </div>

                  <h2
                    style={{
                      fontSize: 'clamp(26px, 4vw, 34px)',
                      fontWeight: 700,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      color: '#fff',
                      marginBottom: 6,
                    }}
                  >
                    {resultatsCount} filiere{resultatsCount > 1 ? 's' : ''} compatible
                    {resultatsCount > 1 ? 's' : ''}
                  </h2>

                  <p style={{ color: '#64748b', fontSize: 14 }}>
                    Serie {selectedSerie?.code} - {selectedSerie?.nom}
                  </p>
                </div>

                <button
                  onClick={handleReset}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: '10px 20px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  Nouvelle simulation
                </button>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
                {filters.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setFiltreStatut(filter.key)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 40,
                      cursor: 'pointer',
                      border: `1px solid ${
                        filtreStatut === filter.key ? filter.color : 'rgba(255,255,255,0.1)'
                      }`,
                      background:
                        filtreStatut === filter.key ? `${filter.color}15` : 'transparent',
                      color: filtreStatut === filter.key ? filter.color : '#64748b',
                      fontSize: 13,
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      transition: 'all 0.2s',
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {filteredResultats.length === 0 ? (
                <div className="public-page-empty">Aucun resultat pour ce filtre.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredResultats.map((resultat, index) => (
                    <ResultatCarte
                      key={resultat.filiere_id}
                      resultat={resultat}
                      index={index}
                      onClick={setModalFiliere}
                    />
                  ))}
                </div>
              )}

              <div
                style={{
                  marginTop: 40,
                  background: 'linear-gradient(135deg, rgba(201,106,74,0.08), rgba(47,92,127,0.05))',
                  border: '1px solid rgba(201,106,74,0.2)',
                  borderRadius: 24,
                  padding: '20px 28px',
                }}
              >
                <div style={{ fontSize: 17, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
                  O+ a maintenant sa propre page
                </div>
                <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.7 }}>
                  Pour discuter avec l assistant sur tes resultats, une universite ou une filiere,
                  utilise desormais la page Assistant O+ disponible dans le menu principal.
                </div>
              </div>
            </section>
          )}

          <footer
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              padding: '35px 0 30px',
              textAlign: 'center',
            }}
          >
            <p style={{ color: '#475569', fontSize: 12 }}>
              © 2025 ORIENTA+ - Orientation universitaire Benin
            </p>
          </footer>
        </main>
      </div>

      {modalFiliere && (
        <ModalDetailFiliere resultat={modalFiliere} onClose={() => setModalFiliere(null)} />
      )}
    </div>
  )
}
