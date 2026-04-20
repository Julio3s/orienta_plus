import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { universitesAPI, filieresAPI } from '../api/client'

const VILLES = ['Toutes', 'Cotonou', 'Abomey-Calavi', 'Parakou', 'Abomey', 'Porto-Novo']
const TYPE_LABELS = {
  tous: 'Tous types',
  public: 'Public',
  prive: 'Prive',
}

export default function UniversitesPage() {
  const [universites, setUniversites] = useState([])
  const [filieres, setFilieres] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtreVille, setFiltreVille] = useState('Toutes')
  const [filtreType, setFiltreType] = useState('tous')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    Promise.all([universitesAPI.list(), filieresAPI.list()])
      .then(([u, f]) => {
        setUniversites(u.data.results || u.data)
        setFilieres(f.data.results || f.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = universites.filter((u) => {
    const matchVille = filtreVille === 'Toutes' || u.ville === filtreVille
    const matchType = filtreType === 'tous' || (filtreType === 'public' ? u.est_publique : !u.est_publique)
    const matchSearch =
      !search ||
      u.nom.toLowerCase().includes(search.toLowerCase()) ||
      u.ville.toLowerCase().includes(search.toLowerCase())

    return matchVille && matchType && matchSearch
  })

  const getFilieresUniv = (univ) => {
    return filieres.filter((f) => f.universites?.some((uf) => uf.universite?.id === univ.id))
  }

  return (
    <div className="public-page-shell">
      <Navbar />

      <main className="public-page-main">
        <section className="public-page-hero" style={{ animation: 'slideUp 0.5s ease' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(47,92,127,0.1)',
              border: '1px solid rgba(47,92,127,0.2)',
              borderRadius: 20,
              padding: '6px 16px',
              marginBottom: 20,
            }}
          >
            <span style={{ color: '#9CC0D7', fontSize: 13, fontWeight: 500 }}>
              Repertoire universitaire du Benin
            </span>
          </div>

          <h1
            style={{
              margin: '0 0 12px',
              fontFamily: 'Fraunces, serif',
              fontWeight: 800,
              fontSize: 'clamp(24px, 5vw, 42px)',
              color: '#F7EFE8',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            Répertoire des universités du Bénin
          </h1>

          <p style={{ margin: '0 0 36px', color: '#B59F90', fontSize: 16, maxWidth: 640, lineHeight: 1.7 }}>
            Cette page rassemble les universites publiques et privees presentes dans la base, avec
            leurs villes, leurs informations pratiques et les filieres associees. L idee est de passer
            d une liste confuse a un repertoire lisible.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
            <input
              type="text"
              placeholder="Rechercher une universite ou une ville..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="public-page-input"
              style={{
                flex: '1 1 220px',
                fontSize: 14,
                fontFamily: 'Manrope, sans-serif',
              }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              {['tous', 'public', 'prive'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFiltreType(type)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 12,
                    border: `1px solid ${filtreType === type ? '#2F5C7F' : 'rgba(255,255,255,0.1)'}`,
                    background: filtreType === type ? 'rgba(47,92,127,0.15)' : 'transparent',
                    color: filtreType === type ? '#9CC0D7' : '#8B7669',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontFamily: 'Manrope, sans-serif',
                    transition: 'all 0.15s',
                  }}
                >
                  {TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
            {VILLES.map((ville) => (
              <button
                key={ville}
                onClick={() => setFiltreVille(ville)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: `1px solid ${filtreVille === ville ? '#C96A4A' : 'rgba(255,255,255,0.08)'}`,
                  background: filtreVille === ville ? 'rgba(201,106,74,0.12)' : 'transparent',
                  color: filtreVille === ville ? '#C96A4A' : '#8B7669',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontFamily: 'Manrope, sans-serif',
                  transition: 'all 0.15s',
                }}
              >
                {ville}
              </button>
            ))}
          </div>

          <p style={{ color: '#8B7669', fontSize: 13, margin: '0 0 20px' }}>
            {filtered.length} universite{filtered.length > 1 ? 's' : ''} trouvee{filtered.length > 1 ? 's' : ''}
          </p>
        </section>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#B59F90' }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: '3px solid rgba(47,92,127,0.2)',
                borderTopColor: '#2F5C7F',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            Chargement...
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: 16,
            }}
          >
            {filtered.map((u, i) => {
              const filieresUniv = getFilieresUniv(u)
              const isSelected = selected?.id === u.id

              return (
                <div
                  key={u.id}
                  onClick={() => setSelected(isSelected ? null : u)}
                  className="public-page-card"
                  style={{
                    background: isSelected
                      ? 'linear-gradient(180deg, rgba(18,16,28,0.86), rgba(18,16,28,0.92))'
                      : undefined,
                    border: `1px solid ${isSelected ? 'rgba(47,92,127,0.35)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 18,
                    padding: '20px 22px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    animation: `slideUp 0.4s ease ${i * 0.04}s both`,
                  }}
                  onMouseEnter={(event) => {
                    if (!isSelected) event.currentTarget.style.borderColor = 'rgba(47,92,127,0.25)'
                  }}
                  onMouseLeave={(event) => {
                    if (!isSelected) event.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                  }}
                >
                  <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        flexShrink: 0,
                        background: u.est_publique ? 'rgba(201,106,74,0.15)' : 'rgba(214,164,91,0.15)',
                        border: `1px solid ${u.est_publique ? 'rgba(201,106,74,0.3)' : 'rgba(214,164,91,0.3)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                        color: u.est_publique ? '#C96A4A' : '#D6A45B',
                        fontFamily: 'Manrope, sans-serif',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {u.est_publique ? 'PUB' : 'PRV'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          margin: '0 0 4px',
                          fontFamily: 'Fraunces, serif',
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#F7EFE8',
                          lineHeight: 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {u.nom}
                      </h3>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: '#8B7669' }}>{u.ville}</span>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '1px 8px',
                            borderRadius: 20,
                            background: u.est_publique ? 'rgba(201,106,74,0.1)' : 'rgba(214,164,91,0.1)',
                            color: u.est_publique ? '#C96A4A' : '#D6A45B',
                          }}
                        >
                          {u.est_publique ? 'Public' : 'Prive'}
                        </span>
                        {u.annee_creation && (
                          <span style={{ fontSize: 11, color: '#6C5A51' }}>Depuis {u.annee_creation}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {u.description && (
                    <p
                      style={{
                        margin: '0 0 12px',
                        color: '#B59F90',
                        fontSize: 13,
                        lineHeight: 1.6,
                        display: '-webkit-box',
                        WebkitLineClamp: isSelected ? 99 : 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {u.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {filieresUniv.slice(0, isSelected ? 20 : 4).map((f) => (
                      <span
                        key={f.id}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#B59F90',
                          borderRadius: 20,
                          padding: '3px 10px',
                          fontSize: 11.5,
                        }}
                      >
                        {f.nom}
                      </span>
                    ))}
                    {!isSelected && filieresUniv.length > 4 && (
                      <span
                        style={{
                          background: 'rgba(47,92,127,0.1)',
                          color: '#9CC0D7',
                          borderRadius: 20,
                          padding: '3px 10px',
                          fontSize: 11.5,
                        }}
                      >
                        +{filieresUniv.length - 4} filieres
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        animation: 'slideUp 0.2s ease',
                      }}
                    >
                      {u.telephone && (
                        <div style={{ fontSize: 13, color: '#B59F90', marginBottom: 6 }}>
                          Tel. {u.telephone}
                        </div>
                      )}
                      {u.email && (
                        <div style={{ fontSize: 13, color: '#B59F90', marginBottom: 6 }}>
                          Email: {u.email}
                        </div>
                      )}
                      {u.adresse && (
                        <div style={{ fontSize: 13, color: '#B59F90', marginBottom: 6 }}>
                          Adresse: {u.adresse}
                        </div>
                      )}
                      {u.site_web && (
                        <a
                          href={u.site_web}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          style={{
                            display: 'inline-block',
                            marginTop: 8,
                            color: '#2F5C7F',
                            fontSize: 13,
                            textDecoration: 'none',
                            background: 'rgba(47,92,127,0.1)',
                            padding: '5px 12px',
                            borderRadius: 8,
                          }}
                        >
                          Voir le site officiel
                        </a>
                      )}
                      {u.latitude && u.longitude && (
                        <a
                          href={`https://maps.google.com/?q=${u.latitude},${u.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          style={{
                            display: 'inline-block',
                            marginTop: 8,
                            marginLeft: 8,
                            color: '#C96A4A',
                            fontSize: 13,
                            textDecoration: 'none',
                            background: 'rgba(201,106,74,0.1)',
                            padding: '5px 12px',
                            borderRadius: 8,
                          }}
                        >
                          Ouvrir sur Google Maps
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <section
          className="public-page-panel public-page-section"
          style={{
            marginTop: 60,
          }}
        >
          <h2 style={{ margin: '0 0 8px', fontFamily: 'Fraunces, serif', fontSize: 20, color: '#F7EFE8' }}>
            Repartition geographique
          </h2>
          <p style={{ margin: '0 0 24px', color: '#8B7669', fontSize: 14 }}>
            Les universites presentes dans la base se concentrent principalement dans les grands poles
            universitaires du Sud, avec quelques relais dans le centre et le nord.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))', gap: 12 }}>
            {[
              { ville: 'Cotonou', count: universites.filter((u) => u.ville === 'Cotonou').length, color: '#C96A4A' },
              { ville: 'Abomey-Calavi', count: universites.filter((u) => u.ville === 'Abomey-Calavi').length, color: '#2F5C7F' },
              { ville: 'Parakou', count: universites.filter((u) => u.ville === 'Parakou').length, color: '#D6A45B' },
              { ville: 'Abomey', count: universites.filter((u) => u.ville === 'Abomey').length, color: '#9CC0D7' },
              { ville: 'Porto-Novo', count: universites.filter((u) => u.ville === 'Porto-Novo').length, color: '#6E9B73' },
            ].map((ville) => (
              <div
                key={ville.ville}
                style={{
                  background: `${ville.color}10`,
                  border: `1px solid ${ville.color}25`,
                  borderRadius: 12,
                  padding: '14px 16px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: 'Fraunces, serif',
                    fontWeight: 800,
                    fontSize: 28,
                    color: ville.color,
                  }}
                >
                  {ville.count}
                </div>
                <div style={{ color: '#B59F90', fontSize: 13, marginTop: 4 }}>{ville.ville}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
