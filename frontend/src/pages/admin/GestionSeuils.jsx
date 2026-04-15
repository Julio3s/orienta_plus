import { useEffect, useState } from 'react'
import { seuilsAPI, universitesAPI, filieresAPI } from '../../api/client'
import formatApiError from '../../api/formatApiError'

function SeuilForm({ item, universites, filieres, onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    const initialItem = item || {}

    return {
      annee: 2024,
      seuil_minimum: '',
      seuil_demi_bourse: '',
      seuil_bourse: '',
      places_disponibles: '',
      frais_inscription: '',
      ...initialItem,
      universite_id: item?.universite?.id || initialItem.universite_id || '',
      filiere_id: item?.filiere?.id || initialItem.filiere_id || '',
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key, value) => setForm((previous) => ({ ...previous, [key]: value }))

  const handleSubmit = async () => {
    if (!form.universite_id || !form.filiere_id) {
      setError('Universite et filiere obligatoires.')
      return
    }

    if (form.seuil_minimum === '' || form.seuil_demi_bourse === '' || form.seuil_bourse === '') {
      setError('Les trois seuils sont obligatoires.')
      return
    }

    if (
      Number(form.seuil_minimum) >= Number(form.seuil_demi_bourse)
      || Number(form.seuil_demi_bourse) >= Number(form.seuil_bourse)
    ) {
      setError('Les seuils doivent etre croissants : Min < Demi-bourse < Bourse.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const payload = {
        ...form,
        universite_id: Number(form.universite_id),
        filiere_id: Number(form.filiere_id),
        seuil_minimum: Number(form.seuil_minimum),
        seuil_demi_bourse: Number(form.seuil_demi_bourse),
        seuil_bourse: Number(form.seuil_bourse),
        places_disponibles: form.places_disponibles === '' ? null : Number(form.places_disponibles),
        frais_inscription: form.frais_inscription === '' ? null : Number(form.frais_inscription),
        annee: Number(form.annee),
      }

      if (item?.id) await seuilsAPI.update(item.id, payload)
      else await seuilsAPI.create(payload)

      onSave()
    } catch (submitError) {
      setError(formatApiError(submitError, 'Erreur de sauvegarde.'))
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '9px 12px',
    color: '#F7EFE8',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Manrope, sans-serif',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div style={{ gridColumn: '1/3' }}>
          <label style={{ display: 'block', color: '#B59F90', fontSize: 12, marginBottom: 4 }}>Universite *</label>
          <select value={form.universite_id} onChange={(event) => set('universite_id', event.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">Choisir une universite</option>
            {universites.map((universite) => <option key={universite.id} value={universite.id}>{universite.nom.slice(0, 60)}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', color: '#B59F90', fontSize: 12, marginBottom: 4 }}>Annee</label>
          <input type="number" min={2020} max={2030} value={form.annee} onChange={(event) => set('annee', event.target.value)} style={inputStyle} />
        </div>

        <div style={{ gridColumn: '1/-1' }}>
          <label style={{ display: 'block', color: '#B59F90', fontSize: 12, marginBottom: 4 }}>Filiere *</label>
          <select value={form.filiere_id} onChange={(event) => set('filiere_id', event.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">Choisir une filiere</option>
            {filieres.map((filiere) => <option key={filiere.id} value={filiere.id}>{filiere.nom} ({filiere.code})</option>)}
          </select>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px' }}>
        <h4 style={{ margin: '0 0 14px', color: '#B59F90', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Seuils d admission (notes sur 20)
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { key: 'seuil_minimum', label: 'Note minimum', color: '#EF4444', desc: 'Admission payante' },
            { key: 'seuil_demi_bourse', label: 'Demi-bourse', color: '#8C6FF7', desc: '50% bourse' },
            { key: 'seuil_bourse', label: 'Bourse complete', color: '#C96A4A', desc: '100% bourse' },
          ].map((seuil) => (
            <div key={seuil.key} style={{ background: `${seuil.color}10`, border: `1px solid ${seuil.color}25`, borderRadius: 12, padding: '12px' }}>
              <div style={{ fontSize: 11, color: seuil.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{seuil.label}</div>
              <div style={{ fontSize: 10, color: '#8B7669', marginBottom: 8 }}>{seuil.desc}</div>
              <input
                type="number"
                min={0}
                max={20}
                step={0.5}
                value={form[seuil.key]}
                onChange={(event) => set(seuil.key, event.target.value)}
                placeholder="Ex: 12"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${seuil.color}40`,
                  borderRadius: 8,
                  padding: '8px',
                  color: seuil.color,
                  fontSize: 18,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 700,
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          ))}
        </div>

        {form.seuil_minimum !== '' && form.seuil_demi_bourse !== '' && form.seuil_bourse !== '' && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, color: '#8B7669', marginBottom: 6 }}>Apercu de la barre de progression</div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', left: `${(Number(form.seuil_minimum) / 20) * 100}%`, top: 0, bottom: 0, background: '#EF4444', width: 2 }} />
              <div style={{ position: 'absolute', left: `${(Number(form.seuil_demi_bourse) / 20) * 100}%`, top: 0, bottom: 0, background: '#8C6FF7', width: 2 }} />
              <div style={{ position: 'absolute', left: `${(Number(form.seuil_bourse) / 20) * 100}%`, top: 0, bottom: 0, background: '#C96A4A', width: 2 }} />
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #EF444440, #8C6FF740, #C96A4A60)',
                width: `${(Number(form.seuil_bourse) / 20) * 100}%`,
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: '#8B7669' }}>
              <span>0</span>
              <span style={{ color: '#EF4444' }}>{form.seuil_minimum}</span>
              <span style={{ color: '#8C6FF7' }}>{form.seuil_demi_bourse}</span>
              <span style={{ color: '#C96A4A' }}>{form.seuil_bourse}</span>
              <span>20</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', color: '#B59F90', fontSize: 12, marginBottom: 4 }}>Places disponibles</label>
          <input type="number" value={form.places_disponibles} onChange={(event) => set('places_disponibles', event.target.value)} placeholder="Ex: 200" style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', color: '#B59F90', fontSize: 12, marginBottom: 4 }}>Frais d inscription (FCFA/an)</label>
          <input type="number" value={form.frais_inscription} onChange={(event) => set('frais_inscription', event.target.value)} placeholder="0 = gratuit" style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSubmit} disabled={saving} style={{
          background: 'linear-gradient(135deg, #8C6FF7, #5E49C8)', border: 'none',
          color: '#fff', borderRadius: 10, padding: '10px 24px', cursor: 'pointer',
          fontWeight: 700, fontSize: 14, fontFamily: 'Fraunces, serif',
        }}>
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
        <button onClick={onCancel} style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#B59F90', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontSize: 13,
        }}>
          Annuler
        </button>
      </div>
    </div>
  )
}

export default function GestionSeuils() {
  const [items, setItems] = useState([])
  const [universites, setUniversites] = useState([])
  const [filieres, setFilieres] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchUniv, setSearchUniv] = useState('')
  const [searchFil, setSearchFil] = useState('')
  const [mode, setMode] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([seuilsAPI.list(), universitesAPI.list(), filieresAPI.list()])
      .then(([seuilsResponse, universitesResponse, filieresResponse]) => {
        setItems(seuilsResponse.data.results || seuilsResponse.data)
        setUniversites(universitesResponse.data.results || universitesResponse.data)
        setFilieres(filieresResponse.data.results || filieresResponse.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (id) => {
    await seuilsAPI.delete(id)
    load()
  }

  const filtered = items.filter((item) => {
    const matchUniv = !searchUniv || item.universite?.nom?.toLowerCase().includes(searchUniv.toLowerCase())
    const matchFil = !searchFil || item.filiere?.nom?.toLowerCase().includes(searchFil.toLowerCase())
    return matchUniv && matchFil
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: 26, color: '#F7EFE8' }}>
            Seuils d admission
          </h1>
          <p style={{ margin: 0, color: '#8B7669', fontSize: 13 }}>{items.length} combinaisons universite x filiere configurees</p>
        </div>
        <button onClick={() => setMode('add')} style={{
          background: 'linear-gradient(135deg, #8C6FF7, #5E49C8)', border: 'none',
          color: '#fff', borderRadius: 12, padding: '10px 20px', cursor: 'pointer',
          fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 14,
          boxShadow: '0 4px 16px rgba(140,111,247,0.3)',
        }}>
          + Configurer un seuil
        </button>
      </div>

      {mode && (
        <div style={{
          background: 'rgba(140,111,247,0.05)', border: '1px solid rgba(140,111,247,0.2)',
          borderRadius: 18, padding: '24px', marginBottom: 20, animation: 'slideUp 0.25s ease',
        }}>
          <h3 style={{ margin: '0 0 18px', fontFamily: 'Fraunces, serif', fontSize: 16, color: '#F7EFE8' }}>
            {mode === 'add' ? 'Nouveau seuil' : 'Modifier le seuil'}
          </h3>
          <SeuilForm
            item={mode === 'add' ? null : mode.edit}
            universites={universites}
            filieres={filieres}
            onSave={() => { setMode(null); load() }}
            onCancel={() => setMode(null)}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          placeholder="Filtrer par universite..."
          value={searchUniv}
          onChange={(event) => setSearchUniv(event.target.value)}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px', color: '#F7EFE8', fontSize: 13, outline: 'none', width: 230 }}
        />
        <input
          placeholder="Filtrer par filiere..."
          value={searchFil}
          onChange={(event) => setSearchFil(event.target.value)}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px', color: '#F7EFE8', fontSize: 13, outline: 'none', width: 200 }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#B59F90' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(140,111,247,0.2)', borderTopColor: '#8C6FF7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((item, index) => (
            <div key={item.id} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '14px 18px',
              display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
              animation: `slideUp 0.3s ease ${index * 0.03}s both`,
            }}>
              <div style={{ flex: 3, minWidth: 200 }}>
                <div style={{ color: '#F7EFE8', fontWeight: 600, fontSize: 13 }}>
                  {item.universite?.nom?.slice(0, 45)}{item.universite?.nom?.length > 45 ? '...' : ''}
                </div>
                <div style={{ color: '#8B7669', fontSize: 11, marginTop: 2 }}>
                  {item.filiere?.nom} • {item.annee}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flex: 2 }}>
                {[
                  { label: 'Min', val: item.seuil_minimum, color: '#EF4444' },
                  { label: '1/2 Bourse', val: item.seuil_demi_bourse, color: '#8C6FF7' },
                  { label: 'Bourse', val: item.seuil_bourse, color: '#C96A4A' },
                ].map((seuil) => (
                  <div key={seuil.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: '#8B7669', textTransform: 'uppercase' }}>{seuil.label}</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 14, color: seuil.color }}>{seuil.val}</div>
                  </div>
                ))}
              </div>

              {item.frais_inscription > 0 && (
                <div style={{ fontSize: 11, color: '#D6A45B' }}>
                  {Number(item.frais_inscription).toLocaleString('fr-FR')} FCFA
                </div>
              )}

              {item.places_disponibles && (
                <div style={{ fontSize: 11, color: '#8B7669' }}>
                  {item.places_disponibles} places
                </div>
              )}

              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setMode({ edit: item })} style={{
                  padding: '5px 12px', borderRadius: 8,
                  background: 'rgba(140,111,247,0.1)', border: '1px solid rgba(140,111,247,0.2)',
                  color: '#B7A7FF', cursor: 'pointer', fontSize: 12,
                }}>
                  Editer
                </button>
                {deleteConfirm === item.id ? (
                  <button onClick={() => { handleDelete(item.id); setDeleteConfirm(null) }} style={{
                    padding: '5px 10px', borderRadius: 8,
                    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  }}>
                    Confirmer
                  </button>
                ) : (
                  <button onClick={() => setDeleteConfirm(item.id)} style={{
                    padding: '5px 10px', borderRadius: 8,
                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                    color: '#ef4444', cursor: 'pointer', fontSize: 12,
                  }}>
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
