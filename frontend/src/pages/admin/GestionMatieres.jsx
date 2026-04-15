import { useEffect, useState } from 'react'
import CRUDTable from '../../components/admin/CRUDTable'
import { matieresAPI } from '../../api/client'
import formatApiError from '../../api/formatApiError'

function MatiereForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState({ code: item?.code || '', nom: item?.nom || '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    const payload = {
      code: form.code.trim(),
      nom: form.nom.trim(),
    }

    if (!payload.code || !payload.nom) {
      setError('Le code et le nom de la matiere sont obligatoires.')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (item?.id) await matieresAPI.update(item.id, payload)
      else await matieresAPI.create(payload)
      onSave()
    } catch (submitError) {
      setError(formatApiError(submitError, 'Impossible de sauvegarder cette matiere.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 10,
          padding: '10px 14px',
          color: '#f87171',
          fontSize: 13,
          marginBottom: 12,
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {[
          { label: 'Code', key: 'code', placeholder: 'Ex: MATH', width: 160 },
          { label: 'Nom de la matiere', key: 'nom', placeholder: 'Ex: Mathematiques', width: 280 },
        ].map((field) => (
          <div key={field.key} style={{ width: field.width }}>
            <label style={{ display: 'block', color: '#B59F90', fontSize: 12, marginBottom: 5 }}>
              {field.label}
            </label>
            <input
              value={form[field.key]}
              onChange={(event) => setForm((previous) => ({ ...previous, [field.key]: event.target.value }))}
              placeholder={field.placeholder}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '10px 12px',
                color: '#F7EFE8',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              background: 'linear-gradient(135deg, #8C6FF7, #5E49C8)',
              border: 'none',
              color: '#fff',
              borderRadius: 10,
              padding: '10px 20px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
              fontFamily: 'Fraunces, serif',
            }}
          >
            {saving ? '...' : 'Sauvegarder'}
          </button>

          <button
            onClick={onCancel}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#B59F90',
              borderRadius: 10,
              padding: '10px 18px',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

export default function GestionMatieres() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    matieresAPI.list()
      .then((response) => setItems(response.data.results || response.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (id) => {
    await matieresAPI.delete(id)
    load()
  }

  const filtered = items.filter((matiere) => (
    !search
    || matiere.nom.toLowerCase().includes(search.toLowerCase())
    || matiere.code.toLowerCase().includes(search.toLowerCase())
  ))

  const columns = [
    {
      key: 'code',
      label: 'Code',
      width: '100px',
      render: (matiere) => (
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 600,
          fontSize: 13,
          background: 'rgba(214,164,91,0.12)',
          color: '#EDC98A',
          padding: '3px 10px',
          borderRadius: 6,
        }}>
          {matiere.code}
        </span>
      ),
    },
    { key: 'nom', label: 'Matiere', width: '2fr' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: 26, color: '#F7EFE8' }}>
            Matieres
          </h1>
          <p style={{ margin: 0, color: '#8B7669', fontSize: 13 }}>{items.length} matieres enregistrees</p>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '10px 14px',
            color: '#F7EFE8',
            fontSize: 13,
            outline: 'none',
            width: 260,
          }}
        />
      </div>

      <CRUDTable
        title="Matieres"
        icon="📚"
        items={filtered}
        columns={columns}
        loading={loading}
        onDelete={handleDelete}
        addLabel="une matiere"
        renderForm={(item, onSave, onCancel) => (
          <MatiereForm item={item} onSave={() => { onSave(); load() }} onCancel={onCancel} />
        )}
      />
    </div>
  )
}
