import { useEffect, useState, useCallback } from 'react'
import CRUDTable from '../../components/admin/CRUDTable'
import { filieresAPI, matieresAPI, seriesAPI } from '../../api/client'
import api from '../../api/client'
import formatApiError from '../../api/formatApiError'
import { FiFolder, FiInbox, FiSave, FiSearch, FiStar, FiUpload } from 'react-icons/fi'
import { MdSchool } from 'react-icons/md'

const DOMAINES = [
  { value: 'informatique', label: 'Informatique & Numérique' },
  { value: 'sante', label: 'Santé & Médecine' },
  { value: 'droit', label: 'Droit & Sciences Politiques' },
  { value: 'economie', label: 'Économie & Gestion' },
  { value: 'lettres', label: 'Lettres & Sciences Humaines' },
  { value: 'agriculture', label: 'Agriculture & Environnement' },
  { value: 'sciences', label: 'Sciences & Technologie' },
  { value: 'education', label: "Sciences de l'Éducation" },
  { value: 'art', label: 'Arts & Communication' },
]

const DOMAINE_COLORS = {
  informatique: '#8C6FF7',
  sante: '#EF4444',
  droit: '#C6A0FF',
  economie: '#C96A4A',
  lettres: '#f472b6',
  agriculture: '#84cc16',
  sciences: '#D6A45B',
  education: '#06b6d4',
  art: '#fb923c',
}

function FiliereForm({ item, allMatieres, allSeries, onSave, onCancel }) {
  const [form, setForm] = useState({
    nom: '',
    code: '',
    duree: 3,
    description: '',
    debouches: '',
    domaine: 'sciences',
    exemples_metiers: '',
    salaire_moyen: '',
    taux_emploi: '',
    ...item,
  })
  
  const [matieresPrio, setMatieresPrio] = useState(() => {
    if (item?.matieres_prioritaires?.length) {
      return item.matieres_prioritaires.map((matiere, index) => ({
        matiere_id: matiere.matiere?.id || matiere.matiere,
        ordre: matiere.ordre || index + 1,
      }))
    }
    return [
      { matiere_id: '', ordre: 1 },
      { matiere_id: '', ordre: 2 },
      { matiere_id: '', ordre: 3 },
    ]
  })
  
  const [seriesAcceptees, setSeriesAcceptees] = useState(() => {
    return item?.series_acceptees?.map((serie) => serie.id) || []
  })
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    const nom = form.nom.trim()
    const code = form.code.trim()

    if (!nom || !code) {
      setError('Le nom et le code sont requis.')
      return
    }

    const selectedMatieres = matieresPrio.filter((matiere) => matiere.matiere_id)
    const uniqueMatiereIds = new Set(selectedMatieres.map((matiere) => String(matiere.matiere_id)))
    if (selectedMatieres.length !== uniqueMatiereIds.size) {
      setError('Une matière prioritaire ne peut être sélectionnée qu\'une seule fois.')
      return
    }

    setSaving(true)
    setError('')

    try {
      let filiereId = item?.id
      const payload = {
        ...form,
        nom,
        code,
        duree: Number(form.duree),
        description: form.description.trim(),
        debouches: form.debouches.trim(),
        exemples_metiers: form.exemples_metiers.trim(),
        salaire_moyen: form.salaire_moyen.trim(),
        taux_emploi: form.taux_emploi === '' ? null : Number(form.taux_emploi),
      }

      if (item?.id) {
        await filieresAPI.update(item.id, payload)
      } else {
        const { data } = await filieresAPI.create(payload)
        filiereId = data.id
      }

      // Mise à jour des matières prioritaires (remplace l'ancien endpoint clear_matieres)
      // On envoie directement la liste complète des matières avec leurs ordres
      for (const matiere of selectedMatieres) {
        await api.post(`/filieres/${filiereId}/set_matieres/`, {
          matiere_id: Number(matiere.matiere_id),
          ordre: Number(matiere.ordre),
        })
      }

      // Mise à jour des séries acceptées
      await api.post(`/filieres/${filiereId}/set_series/`, {
        serie_ids: seriesAcceptees.map((serieId) => Number(serieId)),
      })

      onSave()
    } catch (submitError) {
      console.error('Erreur détaillée:', submitError)
      setError(formatApiError(submitError, 'Erreur lors de la sauvegarde. Vérifiez les données.'))
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

  const labelStyle = {
    display: 'block',
    color: '#B59F90',
    fontSize: 12,
    marginBottom: 4,
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
          fontSize: 13 
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Nom de la filière *</label>
          <input 
            value={form.nom} 
            onChange={(e) => set('nom', e.target.value)} 
            placeholder="Licence en Informatique" 
            style={inputStyle} 
          />
        </div>
        <div>
          <label style={labelStyle}>Code *</label>
          <input 
            value={form.code} 
            onChange={(e) => set('code', e.target.value)} 
            placeholder="INFO-L" 
            style={inputStyle} 
          />
        </div>
        <div>
          <label style={labelStyle}>Durée (années)</label>
          <input 
            type="number" 
            min={1} 
            max={10} 
            value={form.duree} 
            onChange={(e) => set('duree', e.target.value)} 
            style={inputStyle} 
          />
        </div>
        <div>
          <label style={labelStyle}>Domaine</label>
          <select 
            value={form.domaine} 
            onChange={(e) => set('domaine', e.target.value)} 
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {DOMAINES.map((domaine) => (
              <option key={domaine.value} value={domaine.value}>{domaine.label}</option>
            ))}
          </select>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Description</label>
          <textarea 
            value={form.description} 
            onChange={(e) => set('description', e.target.value)} 
            placeholder="Description de la filière..." 
            rows={2} 
            style={{ ...inputStyle, resize: 'vertical' }} 
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Débouchés (séparés par des virgules)</label>
          <input 
            value={form.debouches} 
            onChange={(e) => set('debouches', e.target.value)} 
            placeholder="Développeur web, Data analyst, Chef de projet IT" 
            style={inputStyle} 
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Exemples de métiers concrets (séparés par des virgules)</label>
          <textarea 
            value={form.exemples_metiers} 
            onChange={(e) => set('exemples_metiers', e.target.value)} 
            placeholder="Développeur full-stack chez MTN Bénin (400-800k FCFA/mois), ..." 
            rows={2} 
            style={{ ...inputStyle, resize: 'vertical' }} 
          />
        </div>
        <div>
          <label style={labelStyle}>Salaire moyen</label>
          <input 
            value={form.salaire_moyen} 
            onChange={(e) => set('salaire_moyen', e.target.value)} 
            placeholder="350 000 - 900 000 FCFA/mois" 
            style={inputStyle} 
          />
        </div>
        <div>
          <label style={labelStyle}>Taux emploi (%)</label>
          <input 
            type="number" 
            min={0} 
            max={100} 
            value={form.taux_emploi} 
            onChange={(e) => set('taux_emploi', e.target.value)} 
            placeholder="85" 
            style={inputStyle} 
          />
        </div>
      </div>

      {/* Matières prioritaires */}
      <div style={{ 
        background: 'rgba(140,111,247,0.05)', 
        border: '1px solid rgba(140,111,247,0.15)', 
        borderRadius: 14, 
        padding: '16px' 
      }}>
        <h4 style={{ margin: '0 0 12px', color: '#B7A7FF', fontSize: 13, fontWeight: 700 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <FiStar size={14} />
            Matières prioritaires (max 3)
          </span>
        </h4>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {matieresPrio.map((matierePrio, index) => (
            <div key={index} style={{ flex: '1 1 180px' }}>
              <label style={{ ...labelStyle, fontSize: 11 }}>
                Priorité {index + 1}
              </label>
              <select
                value={matierePrio.matiere_id || ''}
                onChange={(e) => {
                  const updated = [...matieresPrio]
                  updated[index] = { ...updated[index], matiere_id: e.target.value }
                  setMatieresPrio(updated)
                }}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">-- Choisir une matière --</option>
                {allMatieres.map((matiere) => (
                  <option key={matiere.id} value={matiere.id}>
                    {matiere.nom}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <p style={{ color: '#64748b', fontSize: 11, marginTop: 10, marginBottom: 0 }}>
          Sélectionnez les matières les plus importantes pour cette filière (ordre décroissant d'importance)
        </p>
      </div>

      {/* Séries acceptées */}
      <div style={{ 
        background: 'rgba(16,185,129,0.05)', 
        border: '1px solid rgba(16,185,129,0.15)', 
        borderRadius: 14, 
        padding: '16px' 
      }}>
        <h4 style={{ margin: '0 0 12px', color: '#34d399', fontSize: 13, fontWeight: 700 }}>
          Séries de bac acceptées
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {allSeries.map((serie) => {
            const selected = seriesAcceptees.includes(serie.id)
            return (
              <button
                key={serie.id}
                type="button"
                onClick={() => setSeriesAcceptees((prev) => 
                  selected ? prev.filter((id) => id !== serie.id) : [...prev, serie.id]
                )}
                style={{
                  padding: '7px 16px',
                  borderRadius: 20,
                  cursor: 'pointer',
                  fontSize: 13,
                  border: `1px solid ${selected ? '#10B981' : 'rgba(255,255,255,0.1)'}`,
                  background: selected ? 'rgba(16,185,129,0.15)' : 'transparent',
                  color: selected ? '#34d399' : '#8B7669',
                  fontWeight: selected ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {serie.code} - {serie.nom.substring(0, 20)}
              </button>
            )
          })}
        </div>
        <p style={{ color: '#64748b', fontSize: 11, marginTop: 10, marginBottom: 0 }}>
          Sélectionnez toutes les séries de bac qui peuvent accéder à cette filière
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button 
          onClick={handleSubmit} 
          disabled={saving} 
          style={{
            background: 'linear-gradient(135deg, #10B981, #059669)',
            border: 'none',
            color: '#fff',
            borderRadius: 10,
            padding: '10px 28px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: 14,
            opacity: saving ? 0.7 : 1,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <FiSave size={16} />
            {saving ? 'Sauvegarde...' : 'Sauvegarder la filière'}
          </span>
        </button>
        <button 
          onClick={onCancel} 
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#B59F90',
            borderRadius: 10,
            padding: '10px 20px',
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

export default function GestionFilieres() {
  const [items, setItems] = useState([])
  const [matieres, setMatieres] = useState([])
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtreDomaine, setFiltreDomaine] = useState('tous')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [filieresResponse, matieresResponse, seriesResponse] = await Promise.all([
        filieresAPI.list(),
        matieresAPI.list(),
        seriesAPI.list()
      ])
      setItems(filieresResponse.data.results || filieresResponse.data)
      setMatieres(matieresResponse.data.results || matieresResponse.data)
      setSeries(seriesResponse.data.results || seriesResponse.data)
    } catch (error) {
      console.error('Erreur de chargement:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette filière ?')) {
      await filieresAPI.delete(id)
      load()
    }
  }

  const handleImportCSV = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      setLoading(true)
      const { data } = await api.post('/filieres/import-csv/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      alert(data.message || 'Importation réussie !')
      load()
    } catch (err) {
      alert("Erreur lors de l'importation. Vérifiez le format du fichier.")
    } finally {
      setLoading(false)
      event.target.value = ''
    }
  }

  const filtered = items.filter((filiere) => {
    const matchSearch = !search || 
      filiere.nom.toLowerCase().includes(search.toLowerCase()) ||
      filiere.code?.toLowerCase().includes(search.toLowerCase())
    const matchDomaine = filtreDomaine === 'tous' || filiere.domaine === filtreDomaine
    return matchSearch && matchDomaine
  })

  const columns = [
    {
      key: 'nom',
      label: 'Filière',
      width: '3fr',
      render: (filiere) => (
        <div>
          <div style={{ color: '#F7EFE8', fontWeight: 600, fontSize: 14 }}>{filiere.nom}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>{filiere.code}</span>
            <span style={{ 
              fontSize: 11, 
              color: DOMAINE_COLORS[filiere.domaine] || '#B59F90',
              background: `${DOMAINE_COLORS[filiere.domaine] || '#B59F90'}20`,
              padding: '2px 8px',
              borderRadius: 12,
            }}>
              {DOMAINES.find(d => d.value === filiere.domaine)?.label || filiere.domaine}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'duree',
      label: 'Durée',
      width: '80px',
      render: (filiere) => (
        <span style={{ color: '#B59F90', fontSize: 12 }}>{filiere.duree} an{filiere.duree > 1 ? 's' : ''}</span>
      ),
    },
    {
      key: 'matieres',
      label: 'Matières prioritaires',
      width: '140px',
      render: (filiere) => {
        const matieresPrio = filiere.matieres_prioritaires || []
        return (
          <div>
            {matieresPrio.length > 0 ? (
              matieresPrio.map((m, idx) => (
                <div key={idx} style={{ fontSize: 11, color: '#B7A7FF' }}>
                  {idx + 1}. {m.matiere?.nom || 'N/A'}
                </div>
              ))
            ) : (
              <span style={{ color: '#64748b', fontSize: 11 }}>Aucune</span>
            )}
          </div>
        )
      },
    },
    {
      key: 'series',
      label: 'Séries acceptées',
      width: '120px',
      render: (filiere) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {(filiere.series_acceptees || []).slice(0, 5).map((serie) => (
            <span 
              key={serie.id} 
              style={{ 
                fontSize: 10, 
                background: 'rgba(16,185,129,0.12)', 
                color: '#34d399', 
                borderRadius: 4, 
                padding: '2px 6px' 
              }}
            >
              {serie.code}
            </span>
          ))}
          {(filiere.series_acceptees?.length || 0) > 5 && (
            <span style={{ fontSize: 10, color: '#64748b' }}>
              +{(filiere.series_acceptees.length - 5)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'salaire',
      label: 'Salaire',
      width: '120px',
      render: (filiere) => (
        <span style={{ color: '#fbbf24', fontSize: 11 }}>
          {filiere.salaire_moyen || 'N/A'}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: 26, color: '#F7EFE8' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <MdSchool size={22} />
              Filières
            </span>
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
            {items.length} filière{items.length > 1 ? 's' : ''} configurée{items.length > 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={16} color="#8B7669" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '8px 14px',
                paddingLeft: 38,
                color: '#F7EFE8',
                fontSize: 13,
                outline: 'none',
                width: 220,
              }}
            />
          </div>
          <select
            value={filtreDomaine}
            onChange={(e) => setFiltreDomaine(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: '8px 12px',
              color: '#F7EFE8',
              fontSize: 13,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="tous">Tous domaines</option>
            {DOMAINES.map((domaine) => (
              <option key={domaine.value} value={domaine.value}>{domaine.label}</option>
            ))}
          </select>

          <label style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 10,
            padding: '8px 16px',
            color: '#10B981',
            cursor: 'pointer',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <FiUpload size={16} />
            Import CSV
            <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      <CRUDTable
        title=""
        icon=""
        items={filtered}
        columns={columns}
        loading={loading}
        onDelete={handleDelete}
        addLabel="une filière"
        renderForm={(item, onSave, onCancel) => (
          <FiliereForm
            key={item?.id || 'new'}
            item={item}
            allMatieres={matieres}
            allSeries={series}
            onSave={() => { onSave(); load() }}
            onCancel={onCancel}
          />
        )}
      />
    </div>
  )
}