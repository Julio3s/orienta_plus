// BarreCompatibilite.jsx
export function BarreCompatibilite({ pourcentage, statut }) {
  const colors = {
    bourse: { bar: '#C96A4A', bg: 'rgba(201,106,74,0.15)', text: '#EAA07D' },
    demi_bourse: { bar: '#8C6FF7', bg: 'rgba(140,111,247,0.15)', text: '#B7A7FF' },
    payant: { bar: '#D6A45B', bg: 'rgba(214,164,91,0.15)', text: '#EDC98A' },
    non_admissible: { bar: '#EF4444', bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
  }
  const c = colors[statut] || colors.non_admissible

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        height: 7, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pourcentage}%`, background: c.bar,
          borderRadius: 4, transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: `0 0 8px ${c.bar}80`,
        }} />
      </div>
    </div>
  )
}
