import { BarreCompatibilite } from './BarreCompatibilite'

const STATUT_CONFIG = {
  bourse: { label: 'Bourse complete', color: '#C96A4A', bg: 'rgba(201,106,74,0.12)' },
  demi_bourse: { label: 'Demi-bourse', color: '#2F5C7F', bg: 'rgba(47,92,127,0.12)' },
  payant: { label: 'Admission payante', color: '#D6A45B', bg: 'rgba(214,164,91,0.12)' },
  non_admissible: { label: 'Non admissible', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
}

const DOMAINE_TAGS = {
  informatique: 'INFO',
  sante: 'SANTE',
  droit: 'DROIT',
  economie: 'ECO',
  lettres: 'LETT',
  agriculture: 'AGRI',
  sciences: 'SCI',
  education: 'EDU',
  art: 'ART',
}

export default function ResultatCarte({ resultat, index, onClick }) {
  const config = STATUT_CONFIG[resultat.statut] || STATUT_CONFIG.non_admissible
  const domaine = DOMAINE_TAGS[resultat.filiere_domaine] || 'FILIERE'

  return (
    <div
      onClick={() => onClick(resultat)}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${config.color}25`,
        borderRadius: 18,
        padding: '18px 20px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        animation: `slideUp 0.4s ease ${index * 0.06}s both`,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = 'rgba(255,255,255,0.055)'
        event.currentTarget.style.borderColor = `${config.color}50`
        event.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = 'rgba(255,255,255,0.03)'
        event.currentTarget.style.borderColor = `${config.color}25`
        event.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: config.color,
          borderRadius: '0 2px 2px 0',
        }}
      />

      <div style={{ paddingLeft: 8 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            marginBottom: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.06)',
                  color: '#B59F90',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                }}
              >
                {domaine}
              </span>
              <h3
                style={{
                  margin: 0,
                  fontFamily: 'Fraunces, serif',
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#F7EFE8',
                }}
              >
                {resultat.filiere_nom}
              </h3>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span
                style={{
                  fontSize: 11.5,
                  color: '#B59F90',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 8,
                  padding: '4px 8px',
                }}
              >
                {resultat.filiere_duree} an{resultat.filiere_duree > 1 ? 's' : ''}
              </span>
              <span
                style={{
                  fontSize: 11.5,
                  background: config.bg,
                  color: config.color,
                  borderRadius: 8,
                  padding: '4px 8px',
                  fontWeight: 600,
                }}
              >
                {config.label}
              </span>
            </div>
          </div>

          <div
            style={{
              textAlign: 'center',
              minWidth: 64,
              background: config.bg,
              borderRadius: 12,
              padding: '8px 10px',
            }}
          >
            <div
              style={{
                fontFamily: 'Fraunces, serif',
                fontWeight: 800,
                fontSize: 24,
                color: config.color,
                lineHeight: 1,
              }}
            >
              {resultat.pourcentage}%
            </div>
            <div style={{ fontSize: 10, color: '#8B7669', marginTop: 3 }}>compat.</div>
          </div>
        </div>

        <BarreCompatibilite pourcentage={resultat.pourcentage} statut={resultat.statut} />

        <div
          style={{
            marginTop: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: 12, color: '#8B7669' }}>
            Moyenne calculee:
            <span style={{ color: '#B59F90', fontFamily: 'JetBrains Mono', fontWeight: 500, marginLeft: 6 }}>
              {resultat.moyenne_calculee}/20
            </span>
            <span style={{ margin: '0 8px', color: '#4D3E39' }}>|</span>
            <span>
              {resultat.universites?.length || 0} universite{(resultat.universites?.length || 0) > 1 ? 's' : ''}
            </span>
          </div>

          <span style={{ fontSize: 12, color: config.color, fontWeight: 600 }}>Voir les details</span>
        </div>
      </div>
    </div>
  )
}
