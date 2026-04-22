import { useState } from 'react'
import { FiAlertTriangle, FiDatabase, FiPlay, FiShield } from 'react-icons/fi'
import { adminAPI } from '../../api/client'

const DEFAULT_QUERY = `SELECT id, nom, code
FROM orienta_matiere
ORDER BY id DESC
LIMIT 20`

const QUICK_QUERIES = [
  {
    label: 'Dernieres matieres',
    query: `SELECT id, nom, code
FROM orienta_matiere
ORDER BY id DESC
LIMIT 20`,
  },
  {
    label: 'Compter les filieres',
    query: `SELECT COUNT(*) AS total_filieres
FROM orienta_filiere`,
  },
  {
    label: 'Universites publiques',
    query: `SELECT id, nom, ville
FROM orienta_universite
WHERE est_publique = TRUE
ORDER BY nom`,
  },
]

function formatCellValue(value) {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export default function AdminSqlConsole() {
  const [query, setQuery] = useState(DEFAULT_QUERY)
  const [allowWrite, setAllowWrite] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const runQuery = async () => {
    if (!query.trim() || loading) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const { data } = await adminAPI.executeSql({
        query,
        allow_write: allowWrite,
      })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.error || "Impossible d'executer la requete.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 6px', fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: 28, color: '#F7EFE8' }}>
          Console SQL
        </h1>
        <p style={{ margin: 0, color: '#8B7669', fontSize: 14 }}>
          Ecris et execute une requete SQL directement vers la base depuis l'espace admin.
        </p>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: '24px',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, color: '#F0B39A' }}>
          <FiDatabase size={18} />
          <div style={{ fontWeight: 700, fontSize: 15 }}>Editeur SQL</div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          {QUICK_QUERIES.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setQuery(item.query)}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: '1px solid rgba(201,106,74,0.18)',
                background: 'rgba(201,106,74,0.08)',
                color: '#F0B39A',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          spellCheck={false}
          placeholder="SELECT * FROM orienta_matiere LIMIT 20"
          style={{
            width: '100%',
            minHeight: 220,
            resize: 'vertical',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(8,11,18,0.82)',
            color: '#E5D9D1',
            padding: '16px 18px',
            fontSize: 14,
            lineHeight: 1.6,
            fontFamily: 'JetBrains Mono, monospace',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />

        <div style={{
          marginTop: 16,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
        }}>
          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            color: allowWrite ? '#f59e0b' : '#94a3b8',
            fontSize: 13,
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={allowWrite}
              onChange={(event) => setAllowWrite(event.target.checked)}
            />
            Autoriser les requetes de modification
          </label>

          <button
            type="button"
            onClick={runQuery}
            disabled={loading || !query.trim()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 18px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-deep))',
              color: '#fff',
              cursor: loading ? 'wait' : 'pointer',
              fontWeight: 700,
              fontSize: 14,
              boxShadow: '0 14px 34px rgba(201,106,74,0.22)',
            }}
          >
            <FiPlay size={15} />
            {loading ? 'Execution...' : 'Executer'}
          </button>
        </div>

        <div style={{
          marginTop: 16,
          display: 'grid',
          gap: 8,
          padding: '14px 16px',
          borderRadius: 14,
          border: '1px solid rgba(245,158,11,0.18)',
          background: 'rgba(245,158,11,0.08)',
          color: '#f3c98b',
          fontSize: 12.5,
          lineHeight: 1.55,
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
            <FiShield size={14} />
            Utilisation
          </div>
          <div>Une seule requete SQL est autorisee par execution.</div>
          <div>SELECT et EXPLAIN passent directement. INSERT, UPDATE et DELETE exigent une confirmation.</div>
          <div>Les resultats tabulaires sont limites a 200 lignes pour garder l'affichage lisible.</div>
        </div>
      </div>

      {error && (
        <div style={{
          marginBottom: 20,
          background: 'rgba(239,68,68,0.10)',
          border: '1px solid rgba(239,68,68,0.22)',
          borderRadius: 16,
          padding: '14px 16px',
          color: '#f87171',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <FiAlertTriangle size={16} />
          {error}
        </div>
      )}

      {result && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '24px',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
            <span style={{
              padding: '6px 10px',
              borderRadius: 999,
              background: 'rgba(201,106,74,0.10)',
              border: '1px solid rgba(201,106,74,0.18)',
              color: '#F0B39A',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {result.statement_type}
            </span>
            <span style={{
              padding: '6px 10px',
              borderRadius: 999,
              background: 'rgba(47,92,127,0.14)',
              border: '1px solid rgba(47,92,127,0.24)',
              color: '#B5CCDE',
              fontSize: 12,
            }}>
              {result.execution_ms} ms
            </span>
            {typeof result.row_count === 'number' && (
              <span style={{
                padding: '6px 10px',
                borderRadius: 999,
                background: 'rgba(214,164,91,0.14)',
                border: '1px solid rgba(214,164,91,0.24)',
                color: '#EDC98A',
                fontSize: 12,
              }}>
                {result.row_count} ligne(s)
              </span>
            )}
            {typeof result.affected_rows === 'number' && (
              <span style={{
                padding: '6px 10px',
                borderRadius: 999,
                background: 'rgba(110,155,115,0.14)',
                border: '1px solid rgba(110,155,115,0.24)',
                color: '#BED6C0',
                fontSize: 12,
              }}>
                {result.affected_rows} ligne(s) affectee(s)
              </span>
            )}
          </div>

          {result.message && (
            <div style={{ color: '#BED6C0', fontSize: 13, marginBottom: 16 }}>
              {result.message}
            </div>
          )}

          {result.columns?.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                <thead>
                  <tr>
                    {result.columns.map((column) => (
                      <th
                        key={column}
                        style={{
                          textAlign: 'left',
                          padding: '12px 14px',
                          borderBottom: '1px solid rgba(255,255,255,0.08)',
                          color: '#F7EFE8',
                          fontSize: 12,
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={index}>
                      {result.columns.map((column) => (
                        <td
                          key={`${index}-${column}`}
                          style={{
                            padding: '12px 14px',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            color: '#C8D2E0',
                            fontSize: 12.5,
                            verticalAlign: 'top',
                            fontFamily: 'JetBrains Mono, monospace',
                          }}
                        >
                          {formatCellValue(row[column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.truncated && (
            <div style={{ marginTop: 14, color: '#EDC98A', fontSize: 12 }}>
              Resultat tronque a 200 lignes pour garder un affichage lisible.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
