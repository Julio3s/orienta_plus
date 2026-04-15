import { useEffect, useState } from 'react'
import { seriesAPI, suggererAPI } from '../../api/client'

function normalizeWhatsapp(value) {
  let cleaned = String(value || '').replace(/\D/g, '')
  if (!cleaned) return ''
  if (cleaned.startsWith('00')) cleaned = cleaned.slice(2)
  if (cleaned.length === 8 || cleaned.length === 10) cleaned = `229${cleaned}`
  return cleaned
}

function formatWhatsappDisplay(value) {
  if (!value) return ''
  return value.startsWith('+') ? value : `+${value}`
}

export default function FormulaireNotes({ onResultats }) {
  const [series, setSeries] = useState([])
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [validatedContacts, setValidatedContacts] = useState(null)
  const [contactError, setContactError] = useState('')
  const [selectedSerie, setSelectedSerie] = useState(null)
  const [notes, setNotes] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadingSeries, setLoadingSeries] = useState(true)
  const [currentStep, setCurrentStep] = useState(1) // 1: contacts, 2: série, 3: notes

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value.trim())

  useEffect(() => {
    seriesAPI
      .list()
      .then((response) => {
        setSeries(response.data.results || response.data)
        setLoadingSeries(false)
      })
      .catch(() => setLoadingSeries(false))
  }, [])

  const handleSerieChange = (serie) => {
    setSelectedSerie(serie)
    const initialNotes = {}
    serie.matieres?.forEach((item) => {
      initialNotes[item.matiere.code] = ''
    })
    setNotes(initialNotes)
    setCurrentStep(3)
  }

  const handleNoteChange = (code, value) => {
    const note = parseFloat(value)
    if (value === '' || (note >= 0 && note <= 20)) {
      setNotes((prev) => ({ ...prev, [code]: value }))
    }
  }

  const handleValidateContacts = () => {
    const trimmedEmail = email.trim()
    const normalizedWhatsapp = normalizeWhatsapp(whatsapp)

    if (!trimmedEmail && !normalizedWhatsapp) {
      setContactError('Renseigne au moins un email ou un numéro WhatsApp pour continuer.')
      return
    }

    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      setContactError('Veuillez saisir une adresse email valide.')
      return
    }

    if (whatsapp.trim() && (normalizedWhatsapp.length < 11 || normalizedWhatsapp.length > 15)) {
      setContactError('Veuillez saisir un numéro WhatsApp valide avec indicatif.')
      return
    }

    const nextContacts = {
      email: trimmedEmail,
      whatsapp: normalizedWhatsapp,
    }

    setValidatedContacts(nextContacts)
    setEmail(trimmedEmail)
    setWhatsapp(formatWhatsappDisplay(normalizedWhatsapp))
    setContactError('')
    setCurrentStep(2)
  }

  const handleEditContacts = () => {
    setValidatedContacts(null)
    setContactError('')
    setCurrentStep(1)
  }

  const handleEditSerie = () => {
    setSelectedSerie(null)
    setNotes({})
    setCurrentStep(2)
  }

  const handleSubmit = async () => {
    if (!validatedContacts) {
      setContactError('Veuillez valider vos contacts avant de lancer la simulation.')
      return
    }

    const notesFloat = {}
    let valid = true

    Object.entries(notes).forEach(([code, value]) => {
      const note = parseFloat(value)
      if (isNaN(note)) {
        valid = false
        return
      }
      notesFloat[code] = note
    })

    if (!valid || Object.keys(notesFloat).length === 0) {
      alert('Veuillez saisir toutes vos notes entre 0 et 20.')
      return
    }

    setLoading(true)
    try {
      const { data } = await suggererAPI.suggerer({
        serie_id: selectedSerie.id,
        notes: notesFloat,
      })
      onResultats(data.resultats, selectedSerie, validatedContacts, notesFloat)
    } catch {
      alert('Erreur lors du calcul. Vérifiez que le serveur est lancé.')
    } finally {
      setLoading(false)
    }
  }

  const allNotesFilled = Object.values(notes).every((value) => value !== '' && !isNaN(parseFloat(value)))

  if (loadingSeries) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#B59F90' }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid rgba(16,185,129,0.2)',
            borderTopColor: '#10B981',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        Chargement des séries...
      </div>
    )
  }

  // Styles communs
  const stepIndicatorStyle = {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
  }

  return (
    <div>
      {/* Indicateur de progression interne */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              ...stepIndicatorStyle,
              background: currentStep >= 1 ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(255,255,255,0.1)',
              color: currentStep >= 1 ? '#fff' : '#475569',
              margin: '0 auto 6px',
            }}>1</div>
            <span style={{ fontSize: 10, color: currentStep >= 1 ? '#10B981' : '#475569' }}>Contacts</span>
          </div>
          <div style={{ width: 40, height: 2, background: currentStep >= 2 ? '#10B981' : 'rgba(255,255,255,0.1)', borderRadius: 2 }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{
              ...stepIndicatorStyle,
              background: currentStep >= 2 ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(255,255,255,0.1)',
              color: currentStep >= 2 ? '#fff' : '#475569',
              margin: '0 auto 6px',
            }}>2</div>
            <span style={{ fontSize: 10, color: currentStep >= 2 ? '#10B981' : '#475569' }}>Série</span>
          </div>
          <div style={{ width: 40, height: 2, background: currentStep >= 3 ? '#10B981' : 'rgba(255,255,255,0.1)', borderRadius: 2 }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{
              ...stepIndicatorStyle,
              background: currentStep >= 3 ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(255,255,255,0.1)',
              color: currentStep >= 3 ? '#fff' : '#475569',
              margin: '0 auto 6px',
            }}>3</div>
            <span style={{ fontSize: 10, color: currentStep >= 3 ? '#10B981' : '#475569' }}>Notes</span>
          </div>
        </div>
      </div>

      {/* ÉTAPE 1 : Contacts */}
      {currentStep === 1 && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#fff' }}>
              📧 Tes coordonnées
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
              Pour recevoir tes résultats et conseils personnalisés
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${contactError ? 'rgba(239,68,68,0.32)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 20,
            padding: 20,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (contactError) setContactError('') }}
                placeholder="exemple@gmail.com"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => { setWhatsapp(e.target.value); if (contactError) setContactError('') }}
                placeholder="+229 XX XX XX XX"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>

            {contactError && (
              <div style={{ marginTop: 12, color: '#f87171', fontSize: 12 }}>{contactError}</div>
            )}

            <button
              type="button"
              onClick={handleValidateContacts}
              style={{
                marginTop: 20,
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 15,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Continuer →
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 2 : Choix de la série */}
      {currentStep === 2 && validatedContacts && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#fff' }}>
                  📚 Choisis ta série
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
                  Sélectionne la série de ton baccalauréat
                </p>
              </div>
              <button
                onClick={handleEditContacts}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                ← Modifier contacts
              </button>
            </div>
          </div>

          {/* Affichage des contacts validés */}
          <div style={{
            display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20,
            padding: 12, background: 'rgba(16,185,129,0.05)', borderRadius: 12,
          }}>
            {validatedContacts.email && (
              <span style={{ fontSize: 12, color: '#10B981' }}>📧 {validatedContacts.email}</span>
            )}
            {validatedContacts.whatsapp && (
              <span style={{ fontSize: 12, color: '#10B981' }}>📱 {formatWhatsappDisplay(validatedContacts.whatsapp)}</span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {series.map((serie) => (
              <button
                key={serie.id}
                type="button"
                onClick={() => handleSerieChange(serie)}
                style={{
                  padding: '16px',
                  borderRadius: 16,
                  cursor: 'pointer',
                  border: selectedSerie?.id === serie.id
                    ? '1.5px solid #10B981'
                    : '1.5px solid rgba(255,255,255,0.08)',
                  background: selectedSerie?.id === serie.id
                    ? 'rgba(16,185,129,0.1)'
                    : 'rgba(255,255,255,0.03)',
                  color: selectedSerie?.id === serie.id ? '#10B981' : '#cbd5e1',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: 16,
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                {serie.code}
                <span style={{
                  fontSize: 11,
                  display: 'block',
                  color: selectedSerie?.id === serie.id ? '#86efac' : '#64748b',
                  marginTop: 6,
                }}>
                  {serie.nom.slice(0, 30)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ÉTAPE 3 : Saisie des notes */}
      {currentStep === 3 && selectedSerie && validatedContacts && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#fff' }}>
                  ✏️ Série {selectedSerie.code} — Entre tes notes
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
                  {selectedSerie.nom} — Notes sur 20
                </p>
              </div>
              <button
                onClick={handleEditSerie}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                ← Modifier série
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {selectedSerie.matieres?.map((item) => {
              const value = notes[item.matiere.code]
              const note = parseFloat(value)
              const color = isNaN(note) || value === ''
                ? '#64748b'
                : note >= 14 ? '#10B981' : note >= 10 ? '#3B82F6' : '#F59E0B'

              return (
                <div
                  key={item.matiere.id}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${value !== '' ? `${color}40` : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 16,
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500 }}>{item.matiere.nom}</span>
                    <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '3px 8px', color: '#94a3b8', fontSize: 11 }}>
                      coef {item.coefficient}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={value}
                    onChange={(e) => handleNoteChange(item.matiere.code, e.target.value)}
                    placeholder="0 - 20"
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${value !== '' ? `${color}60` : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 10,
                      padding: '12px',
                      color: color,
                      fontSize: 16,
                      fontWeight: 500,
                      outline: 'none',
                      textAlign: 'center',
                    }}
                  />
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allNotesFilled || loading}
            style={{
              marginTop: 28,
              width: '100%',
              padding: '16px',
              borderRadius: 14,
              background: allNotesFilled ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(255,255,255,0.05)',
              border: 'none',
              color: allNotesFilled ? '#fff' : '#64748b',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 16,
              cursor: allNotesFilled ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            {loading ? '🔄 Calcul en cours...' : '🎯 Voir mes filières compatibles'}
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}