import { useState } from 'react'

/**
 * CRUDTable — composant générique pour la gestion admin
 * Props:
 *   title, icon, items, columns, loading
 *   onAdd, onEdit, onDelete
 *   renderForm (function(item, onSave, onCancel))
 */
export default function CRUDTable({ title, icon, items, columns, loading, onDelete, renderForm, addLabel = 'Ajouter' }) {
  const [mode, setMode] = useState(null) // 'add' | { edit: item }
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const handleDelete = async (id) => {
    await onDelete(id)
    setDeleteConfirm(null)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: 26, color: '#F7EFE8' }}>
            {icon} {title}
          </h1>
          <p style={{ margin: 0, color: '#8B7669', fontSize: 13 }}>
            {items.length} entrée{items.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setMode('add')}
          style={{
            background: 'linear-gradient(135deg, #8C6FF7, #5E49C8)',
            border: 'none', color: '#fff', borderRadius: 12,
            padding: '10px 20px', cursor: 'pointer',
            fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 14,
            boxShadow: '0 4px 16px rgba(140,111,247,0.3)',
          }}
        >
          + {addLabel}
        </button>
      </div>

      {/* Formulaire d'ajout/édition */}
      {mode && (
        <div style={{
          background: 'rgba(140,111,247,0.05)',
          border: '1px solid rgba(140,111,247,0.2)',
          borderRadius: 18, padding: '24px', marginBottom: 20,
          animation: 'slideUp 0.25s ease',
        }}>
          <h3 style={{ margin: '0 0 18px', fontFamily: 'Fraunces, serif', fontSize: 16, color: '#F7EFE8' }}>
            {mode === 'add' ? `Ajouter ${title.toLowerCase()}` : 'Modifier'}
          </h3>
          {renderForm(
            mode === 'add' ? null : mode.edit,
            () => setMode(null),
            () => setMode(null)
          )}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#B59F90' }}>
          <div style={{
            width: 36, height: 36, border: '3px solid rgba(140,111,247,0.2)',
            borderTopColor: '#8C6FF7', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />Chargement...
        </div>
      ) : items.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, color: '#8B7669',
        }}>
          Aucun élément. Cliquez sur "+ {addLabel}" pour commencer.
        </div>
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 18, overflow: 'hidden',
        }}>
          {/* Thead */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `${columns.map(c => c.width || '1fr').join(' ')} 100px`,
            padding: '12px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.03)',
          }}>
            {columns.map(c => (
              <div key={c.key} style={{ color: '#8B7669', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'Manrope' }}>
                {c.label}
              </div>
            ))}
            <div style={{ color: '#8B7669', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>Actions</div>
          </div>

          {/* Rows */}
          {items.map((item, i) => (
            <div
              key={item.id}
              style={{
                display: 'grid',
                gridTemplateColumns: `${columns.map(c => c.width || '1fr').join(' ')} 100px`,
                padding: '14px 20px',
                borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                alignItems: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {columns.map(c => (
                <div key={c.key} style={{ color: '#E6D9CF', fontSize: 14, fontFamily: 'Manrope' }}>
                  {c.render ? c.render(item) : item[c.key] ?? '—'}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setMode({ edit: item })}
                  style={{
                    padding: '5px 12px', borderRadius: 8,
                    background: 'rgba(140,111,247,0.1)', border: '1px solid rgba(140,111,247,0.2)',
                    color: '#B7A7FF', cursor: 'pointer', fontSize: 12,
                  }}
                >Éditer</button>
                {deleteConfirm === item.id ? (
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      padding: '5px 10px', borderRadius: 8,
                      background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                      color: '#f87171', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    }}
                  >Confirmer</button>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(item.id)}
                    style={{
                      padding: '5px 10px', borderRadius: 8,
                      background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                      color: '#ef4444', cursor: 'pointer', fontSize: 12,
                    }}
                  >×</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
