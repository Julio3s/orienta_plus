import { useState, useEffect } from 'react'
import CRUDTable from '../../components/admin/CRUDTable'
import { universitesAPI } from '../../api/client'
import formatApiError from '../../api/formatApiError'
import { FiMapPin, FiSave, FiSearch } from 'react-icons/fi'
import { MdAccountBalance } from 'react-icons/md'

const FIELD_DEF = [
  { key: 'nom',           label: 'Nom complet',        type: 'text',     placeholder: 'Université d\'Abomey-Calavi', full: true },
  { key: 'ville',         label: 'Ville',              type: 'text',     placeholder: 'Cotonou' },
  { key: 'adresse',       label: 'Adresse',            type: 'text',     placeholder: 'Rue, quartier...', full: true },
  { key: 'telephone',     label: 'Téléphone',          type: 'text',     placeholder: '+229 21 ...' },
  { key: 'email',         label: 'Email',              type: 'email',    placeholder: 'contact@univ.bj' },
  { key: 'site_web',      label: 'Site web',           type: 'url',      placeholder: 'https://...' },
  { key: 'annee_creation',label: 'Année création',     type: 'number',   placeholder: '2000' },
  { key: 'latitude',      label: 'Latitude',           type: 'number',   placeholder: '6.36' },
  { key: 'longitude',     label: 'Longitude',          type: 'number',   placeholder: '2.41' },
  { key: 'description',   label: 'Description',        type: 'textarea', placeholder: 'Présentation...', full: true },
]

function UniversiteForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState({
    nom: '', ville: '', description: '', est_publique: true, site_web: '',
    adresse: '', telephone: '', email: '', latitude: '', longitude: '', annee_creation: '',
    ...item,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    const nom = form.nom.trim()
    const ville = form.ville.trim()

    if (!nom || !ville) {
      setError('Le nom complet et la ville sont obligatoires.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const payload = {
        nom,
        ville,
        description: form.description.trim(),
        est_publique: Boolean(form.est_publique),
        site_web: form.site_web.trim(),
        adresse: form.adresse.trim(),
        telephone: form.telephone.trim(),
        email: form.email.trim(),
      }

      if (form.latitude !== '') payload.latitude = Number(form.latitude)
      if (form.longitude !== '') payload.longitude = Number(form.longitude)
      if (form.annee_creation !== '') payload.annee_creation = Number(form.annee_creation)

      if (item?.id) await universitesAPI.update(item.id, payload)
      else await universitesAPI.create(payload)
      onSave()
    } catch (submitError) {
      setError(formatApiError(submitError, 'Impossible de sauvegarder cette universite.'))
    } finally { setSaving(false) }
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '10px 12px', color: '#F7EFE8', fontSize: 13,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'Manrope, sans-serif',
  }

  return (
    <div>
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13, marginBottom: 12,
        }}>
          {error}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {FIELD_DEF.filter(f => f.type !== 'textarea').map(f => (
          <div key={f.key} style={{ gridColumn: f.full ? '1/-1' : 'auto' }}>
            <label style={{ display: 'block', color: '#B59F90', fontSize: 12, marginBottom: 4 }}>{f.label}</label>
            <input
              type={f.type || 'text'} value={form[f.key] || ''} placeholder={f.placeholder}
              onChange={e => set(f.key, e.target.value)}
              style={inputStyle}
            />
          </div>
        ))}
        <div style={{ gridColumn: '1/-1' }}>
          <label style={{ display: 'block', color: '#B59F90', fontSize: 12, marginBottom: 4 }}>Description</label>
          <textarea
            value={form.description || ''} placeholder="Présentation de l'université..."
            onChange={e => set('description', e.target.value)} rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox" checked={form.est_publique}
              onChange={e => set('est_publique', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#C96A4A' }}
            />
            <span style={{ color: '#E6D9CF', fontSize: 14 }}>Université publique</span>
          </label>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSubmit} disabled={saving} style={{
          background: 'linear-gradient(135deg, #8C6FF7, #5E49C8)', border: 'none',
          color: '#fff', borderRadius: 10, padding: '10px 22px', cursor: 'pointer',
          fontWeight: 700, fontSize: 13, fontFamily: 'Fraunces, serif',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <FiSave size={16} />
            {saving ? '...' : 'Sauvegarder'}
          </span>
        </button>
        <button onClick={onCancel} style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#B59F90', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontSize: 13,
        }}>Annuler</button>
      </div>
    </div>
  )
}

export default function GestionUniversites() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtreType, setFiltreType] = useState('tous')

  const load = () => {
    setLoading(true)
    universitesAPI.list().then(r => setItems(r.data.results || r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleDelete = async (id) => { await universitesAPI.delete(id); load() }

  const filtered = items.filter(u => {
    const matchSearch = !search || u.nom.toLowerCase().includes(search.toLowerCase()) || u.ville?.toLowerCase().includes(search.toLowerCase())
    const matchType = filtreType === 'tous' || (filtreType === 'public' ? u.est_publique : !u.est_publique)
    return matchSearch && matchType
  })

  const columns = [
    { key: 'nom', label: 'Université', width: '3fr', render: u => (
      <div>
        <div style={{ color: '#F7EFE8', fontSize: 13, fontWeight: 600, fontFamily: 'Manrope' }}>
          {u.nom.length > 50 ? u.nom.slice(0, 50) + '…' : u.nom}
        </div>
        <div style={{ color: '#8B7669', fontSize: 11, marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <FiMapPin size={13} />
          {u.ville}
        </div>
      </div>
    )},
    { key: 'est_publique', label: 'Type', width: '80px', render: u => (
      <span style={{
        fontSize: 11, padding: '3px 10px', borderRadius: 20,
        background: u.est_publique ? 'rgba(201,106,74,0.12)' : 'rgba(214,164,91,0.12)',
        color: u.est_publique ? '#C96A4A' : '#D6A45B',
      }}>{u.est_publique ? 'Public' : 'Privé'}</span>
    )},
    { key: 'annee_creation', label: 'Création', width: '90px', render: u => (
      <span style={{ color: '#8B7669', fontSize: 12 }}>{u.annee_creation || '—'}</span>
    )},
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: 26, color: '#F7EFE8' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <MdAccountBalance size={22} />
              Universités
            </span>
          </h1>
          <p style={{ margin: 0, color: '#8B7669', fontSize: 13 }}>{items.length} universités enregistrées</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={16} color="#8B7669" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text" placeholder="Rechercher..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '8px 14px', paddingLeft: 38, color: '#F7EFE8', fontSize: 13, outline: 'none', width: 200,
              }}
            />
          </div>
          {['tous', 'public', 'privé'].map(t => (
            <button key={t} onClick={() => setFiltreType(t)} style={{
              padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12,
              border: `1px solid ${filtreType === t ? '#8C6FF7' : 'rgba(255,255,255,0.1)'}`,
              background: filtreType === t ? 'rgba(140,111,247,0.15)' : 'transparent',
              color: filtreType === t ? '#B7A7FF' : '#8B7669',
            }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
      </div>

      <CRUDTable
        title="" icon="" items={filtered}
        columns={columns} loading={loading}
        onDelete={handleDelete}
        addLabel="une université"
        renderForm={(item, onSave, onCancel) => (
          <UniversiteForm item={item} onSave={() => { onSave(); load() }} onCancel={onCancel} />
        )}
      />
    </div>
  )
}
