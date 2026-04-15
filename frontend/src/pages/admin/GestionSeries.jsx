import { useEffect, useState } from 'react'
import CRUDTable from '../../components/admin/CRUDTable'
import { matieresAPI, seriesAPI } from '../../api/client'
import formatApiError from '../../api/formatApiError'

const createEmptyMatiereRow = () => ({ matiere_id: '', coefficient: 1 })

const buildInitialForm = (item) => ({
  code: item?.code || '',
  nom: item?.nom || '',
  description: item?.description || '',
})

const buildInitialMatieres = (item) => {
  if (!item?.matieres?.length) {
    return [createEmptyMatiereRow()]
  }

  return item.matieres.map((matiereItem) => ({
    matiere_id: String(matiereItem.matiere?.id || ''),
    coefficient: matiereItem.coefficient || 1,
  }))
}

function SerieForm({ item, allMatieres, onSave, onCancel }) {
  const [form, setForm] = useState(() => buildInitialForm(item))
  const [serieMatieres, setSerieMatieres] = useState(() => buildInitialMatieres(item))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(buildInitialForm(item))
    setSerieMatieres(buildInitialMatieres(item))
    setError('')
  }, [item])

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '10px 12px',
    color: '#F7EFE8',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Manrope, sans-serif',
  }

  const panelStyle = {
    background: 'rgba(140,111,247,0.05)',
    border: '1px solid rgba(140,111,247,0.16)',
    borderRadius: 16,
    padding: 16,
  }

  const updateMatiereRow = (index, key, value) => {
    setSerieMatieres((previous) => previous.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [key]: value } : row
    )))
  }

  const addMatiereRow = () => {
    setSerieMatieres((previous) => [...previous, createEmptyMatiereRow()])
  }

  const removeMatiereRow = (index) => {
    setSerieMatieres((previous) => {
      const nextRows = previous.filter((_, rowIndex) => rowIndex !== index)
      return nextRows.length > 0 ? nextRows : [createEmptyMatiereRow()]
    })
  }

  const handleSubmit = async () => {
    const code = form.code.trim()
    const nom = form.nom.trim()

    if (!code || !nom) {
      setError('Le code et le nom de la serie sont requis.')
      return
    }

    const preparedMatieres = serieMatieres
      .filter((row) => row.matiere_id)
      .map((row) => ({
        matiere_id: Number(row.matiere_id),
        coefficient: Number(row.coefficient),
      }))

    const seenMatiereIds = new Set()
    for (const matiereItem of preparedMatieres) {
      if (!Number.isInteger(matiereItem.coefficient) || matiereItem.coefficient < 1) {
        setError('Chaque coefficient doit etre un nombre entier superieur ou egal a 1.')
        return
      }

      if (seenMatiereIds.has(matiereItem.matiere_id)) {
        setError('Une matiere ne peut pas etre ajoutee deux fois dans la meme serie.')
        return
      }

      seenMatiereIds.add(matiereItem.matiere_id)
    }

    setSaving(true)
    setError('')

    try {
      const payload = {
        code,
        nom,
        description: form.description.trim(),
        matieres: preparedMatieres,
      }

      if (item?.id) {
        await seriesAPI.update(item.id, payload)
      } else {
        await seriesAPI.create(payload)
      }

      onSave()
    } catch (submitError) {
      setError(formatApiError(
        submitError,
        'Impossible de sauvegarder cette serie. Verifiez le code, les matieres et les coefficients.'
      ))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 10,
          padding: '10px 14px',
          color: '#f87171',
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 12, alignItems: 'end' }}>
        {[
          { label: 'Code', key: 'code', placeholder: 'Ex: C' },
          { label: 'Nom', key: 'nom', placeholder: 'Ex: Serie scientifique' },
          { label: 'Description', key: 'description', placeholder: 'Description courte...' },
        ].map((field) => (
          <div key={field.key}>
            <label style={{ display: 'block', color: '#B59F90', fontSize: 12, marginBottom: 5 }}>
              {field.label}
            </label>
            <input
              value={form[field.key]}
              onChange={(event) => setForm((previous) => ({ ...previous, [field.key]: event.target.value }))}
              placeholder={field.placeholder}
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      <div style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <div>
            <h4 style={{ margin: '0 0 4px', color: '#B7A7FF', fontSize: 15, fontFamily: 'Fraunces, serif', fontWeight: 700 }}>
              Matieres et coefficients
            </h4>
            <p style={{ margin: 0, color: '#8B7669', fontSize: 12 }}>
              Definis les matieres prises en compte pour cette serie et leur coefficient.
            </p>
          </div>
          <button
            type="button"
            onClick={addMatiereRow}
            style={{
              background: 'rgba(140,111,247,0.14)',
              border: '1px solid rgba(140,111,247,0.24)',
              color: '#D7CFFF',
              borderRadius: 10,
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            + Ajouter une matiere
          </button>
        </div>

        {allMatieres.length === 0 ? (
          <div style={{ color: '#B59F90', fontSize: 13 }}>
            Aucune matiere disponible. Cree d abord les matieres dans l espace admin.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {serieMatieres.map((matiereRow, index) => (
              <div
                key={`${item?.id || 'new'}-${index}`}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  alignItems: 'end',
                  paddingBottom: 16,
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', color: '#B59F90', fontSize: 11, marginBottom: 4 }}>
                    Matiere {index + 1}
                  </label>
                  <select
                    value={matiereRow.matiere_id}
                    onChange={(event) => updateMatiereRow(index, 'matiere_id', event.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="">Choisir une matiere</option>
                    {allMatieres.map((matiere) => (
                      <option key={matiere.id} value={matiere.id}>
                        {matiere.nom} ({matiere.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: '1 1 100px' }}>
                  <label style={{ display: 'block', color: '#B59F90', fontSize: 11, marginBottom: 4 }}>
                    Coefficient
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={matiereRow.coefficient}
                    onChange={(event) => updateMatiereRow(index, 'coefficient', event.target.value)}
                    style={inputStyle}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeMatiereRow(index)}
                  style={{
                    flex: '1 1 80px',
                    background: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.18)',
                    color: '#f87171',
                    borderRadius: 10,
                    padding: '10px 12px',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            background: 'linear-gradient(135deg, #8C6FF7, #5E49C8)',
            border: 'none',
            color: '#fff',
            borderRadius: 10,
            padding: '9px 20px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 13,
            fontFamily: 'Fraunces, serif',
          }}
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
        <button
          onClick={onCancel}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#B59F90',
            borderRadius: 10,
            padding: '9px 20px',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

export default function GestionSeries() {
  const [items, setItems] = useState([])
  const [matieres, setMatieres] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)

    Promise.all([seriesAPI.list(), matieresAPI.list()])
      .then(([seriesResponse, matieresResponse]) => {
        setItems(seriesResponse.data.results || seriesResponse.data)
        setMatieres(matieresResponse.data.results || matieresResponse.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (id) => {
    await seriesAPI.delete(id)
    load()
  }

  const columns = [
    {
      key: 'code',
      label: 'Code',
      width: '90px',
      render: (serie) => (
        <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: '#8C6FF7', fontSize: 15 }}>
          {serie.code}
        </span>
      ),
    },
    {
      key: 'nom',
      label: 'Nom',
      width: '1.3fr',
    },
    {
      key: 'matieres',
      label: 'Configuration',
      width: '2fr',
      render: (serie) => (
        serie.matieres?.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {serie.matieres.slice(0, 3).map((matiereItem) => (
              <span
                key={matiereItem.id}
                style={{
                  fontSize: 11,
                  background: 'rgba(140,111,247,0.12)',
                  color: '#D7CFFF',
                  borderRadius: 999,
                  padding: '4px 8px',
                }}
              >
                {matiereItem.matiere?.code || matiereItem.matiere?.nom} coef {matiereItem.coefficient}
              </span>
            ))}
            {serie.matieres.length > 3 && (
              <span style={{ fontSize: 11, color: '#8B7669' }}>
                +{serie.matieres.length - 3} autres
              </span>
            )}
          </div>
        ) : (
          <span style={{ color: '#8B7669', fontSize: 12 }}>
            Aucune matiere configuree
          </span>
        )
      ),
    },
    {
      key: 'description',
      label: 'Description',
      width: '1.7fr',
      render: (serie) => (
        <span style={{ color: '#8B7669', fontSize: 12 }}>
          {serie.description?.slice(0, 70) || '-'}
        </span>
      ),
    },
  ]

  return (
    <CRUDTable
      title="Series de bac"
      icon="📋"
      items={items}
      columns={columns}
      loading={loading}
      onDelete={handleDelete}
      addLabel="une serie"
      renderForm={(item, onSave, onCancel) => (
        <SerieForm
          item={item}
          allMatieres={matieres}
          onSave={() => {
            onSave()
            load()
          }}
          onCancel={onCancel}
        />
      )}
    />
  )
}
