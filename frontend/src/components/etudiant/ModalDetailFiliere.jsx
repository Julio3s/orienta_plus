import { useEffect } from 'react'

const STATUT_CONFIG = {
  bourse: { label: 'Bourse complete', color: '#C96A4A' },
  demi_bourse: { label: 'Demi-bourse', color: '#8C6FF7' },
  payant: { label: 'Admission payante', color: '#D6A45B' },
  non_admissible: { label: 'Non admissible', color: '#EF4444' },
}

export default function ModalDetailFiliere({ resultat, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  if (!resultat) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        background: 'rgba(19,15,17,0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        style={{
          background: '#1D1618',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24,
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'scaleIn 0.25s ease',
        }}
      >
        <div
          style={{
            padding: '24px 28px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            position: 'sticky',
            top: 0,
            background: '#1D1618',
            zIndex: 1,
            borderRadius: '24px 24px 0 0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
              <h2 style={{ margin: '0 0 6px', fontFamily: 'Fraunces, serif', fontSize: 22, color: '#F7EFE8' }}>
                {resultat.filiere_nom}
              </h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    color: '#B59F90',
                    borderRadius: 8,
                    padding: '3px 10px',
                    fontSize: 12,
                  }}
                >
                  {resultat.filiere_duree} an{resultat.filiere_duree > 1 ? 's' : ''}
                </span>
                <span
                  style={{
                    background: `${STATUT_CONFIG[resultat.statut]?.color || '#EF4444'}20`,
                    color: STATUT_CONFIG[resultat.statut]?.color || '#EF4444',
                    borderRadius: 8,
                    padding: '3px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {STATUT_CONFIG[resultat.statut]?.label}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.07)',
                border: 'none',
                color: '#B59F90',
                cursor: 'pointer',
                fontSize: 18,
              }}
            >
              X
            </button>
          </div>
        </div>

        <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {resultat.filiere_description && (
            <section>
              <h4 style={{ margin: '0 0 8px', color: '#B59F90', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Description
              </h4>
              <p style={{ margin: 0, color: '#E6D9CF', fontSize: 14, lineHeight: 1.7 }}>
                {resultat.filiere_description}
              </p>
            </section>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {resultat.filiere_salaire && (
              <div style={{ background: 'rgba(201,106,74,0.08)', border: '1px solid rgba(201,106,74,0.15)', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: '#C96A4A', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Salaire moyen
                </div>
                <div style={{ fontSize: 14, color: '#F7EFE8', fontWeight: 600 }}>{resultat.filiere_salaire}</div>
              </div>
            )}

            {resultat.filiere_taux_emploi && (
              <div style={{ background: 'rgba(140,111,247,0.08)', border: '1px solid rgba(140,111,247,0.15)', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: '#8C6FF7', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Taux d emploi
                </div>
                <div style={{ fontSize: 14, color: '#F7EFE8', fontWeight: 600 }}>{resultat.filiere_taux_emploi}% a 1 an</div>
              </div>
            )}
          </div>

          {resultat.filiere_debouches?.length > 0 && (
            <section>
              <h4 style={{ margin: '0 0 10px', color: '#B59F90', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Debouches
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {resultat.filiere_debouches.map((debouche, index) => (
                  <span
                    key={index}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#E6D9CF',
                      borderRadius: 20,
                      padding: '5px 13px',
                      fontSize: 13,
                    }}
                  >
                    {debouche}
                  </span>
                ))}
              </div>
            </section>
          )}

          {resultat.filiere_metiers?.length > 0 && (
            <section>
              <h4 style={{ margin: '0 0 10px', color: '#B59F90', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Exemples de metiers concrets
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {resultat.filiere_metiers.map((metier, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <span style={{ color: '#C96A4A', marginTop: 1 }}>{'>'}</span>
                    <span style={{ color: '#E6D9CF', fontSize: 13.5, lineHeight: 1.5 }}>{metier}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h4 style={{ margin: '0 0 12px', color: '#B59F90', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Universites proposant cette filiere ({resultat.universites?.length})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {resultat.universites?.map((universite, index) => {
                const config = STATUT_CONFIG[universite.statut] || STATUT_CONFIG.non_admissible

                return (
                  <div
                    key={index}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${config.color}25`,
                      borderRadius: 12,
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                      <div>
                        <div style={{ color: '#F7EFE8', fontWeight: 600, fontSize: 14 }}>{universite.universite_nom}</div>
                        <div style={{ color: '#8B7669', fontSize: 12, marginTop: 2 }}>
                          {universite.universite_ville}
                          {universite.est_publique ? (
                            <span style={{ marginLeft: 8, color: '#C96A4A' }}>| Public</span>
                          ) : (
                            <span style={{ marginLeft: 8, color: '#D6A45B' }}>| Prive</span>
                          )}
                        </div>
                      </div>

                      <span
                        style={{
                          background: `${config.color}20`,
                          color: config.color,
                          borderRadius: 8,
                          padding: '4px 10px',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {universite.pourcentage}%
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {[
                        { label: 'Min', val: universite.seuil_minimum, color: '#EF4444' },
                        { label: 'Demi-bourse', val: universite.seuil_demi_bourse, color: '#8C6FF7' },
                        { label: 'Bourse', val: universite.seuil_bourse, color: '#C96A4A' },
                      ].map((item) => (
                        <div
                          key={item.label}
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            borderRadius: 8,
                            padding: '7px 10px',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: 10, color: '#8B7669', marginBottom: 2 }}>{item.label}</div>
                          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 14, color: item.color, fontWeight: 600 }}>
                            {item.val}/20
                          </div>
                        </div>
                      ))}
                    </div>

                    {universite.frais_inscription > 0 && (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#B59F90' }}>
                        Frais d inscription:
                        <span style={{ color: '#D6A45B', fontWeight: 600, marginLeft: 6 }}>
                          {universite.frais_inscription.toLocaleString('fr-FR')} FCFA/an
                        </span>
                      </div>
                    )}

                    {universite.places_disponibles && (
                      <div style={{ fontSize: 12, color: '#8B7669', marginTop: 4 }}>
                        Places disponibles:
                        <span style={{ color: '#B59F90', marginLeft: 6 }}>{universite.places_disponibles}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
