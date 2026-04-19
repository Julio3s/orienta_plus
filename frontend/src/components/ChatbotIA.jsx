import { useEffect, useRef, useState } from 'react'
import { chatbotAPI } from '../api/client'
import useMediaQuery from '../hooks/useMediaQuery'

export default function ChatbotIA({ context = {}, isOpen, onClose }) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "👋 Bonjour ! Je suis **O+**, ton conseiller ORIENTA+ (Grok xAI). Je réponds **uniquement** aux questions d'**orientation scolaire et universitaire** au Bénin : filières, universités, bourses, parcours après le bac, métiers liés aux études…",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isGrokActive, setIsGrokActive] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    const userMsg = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const { data } = await chatbotAPI.envoyer({
        message: text,
        historique: messages.slice(-6), // Envoyer l'historique pour contexte
        context,
      })

      // Vérifier si la réponse vient de Grok
      if (data.source === 'grok' || data.source === 'policy') {
        setIsGrokActive(true)
      } else if (data.source === 'fallback') {
        setIsGrokActive(false)
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reponse }])
    } catch (error) {
      console.error('Erreur Grok:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "⚠️ Désolé, je rencontre une difficulté technique avec Grok. Réessaie dans un instant ou reformule ta question.",
        },
      ])
      setIsGrokActive(false)
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  const suggestions = [
    '🎓 Quelles sont les meilleures filières en informatique au Bénin ?',
    '💰 Comment obtenir une bourse universitaire ?',
    '🏛️ Quelle est la différence entre UAC et UNSTIM ?',
    '🔬 Quels métiers après un BAC C ?',
    '📚 Quelles études pour devenir médecin ?',
    '💻 Formation en cybersécurité au Bénin ?',
  ]

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: isMobile ? 'calc(94px + env(safe-area-inset-bottom))' : 98,
        right: isMobile ? 12 : 24,
        left: isMobile ? 12 : 'auto',
        zIndex: 1000,
        width: isMobile ? 'auto' : 'min(440px, calc(100vw - 48px))',
        height: isMobile ? 'min(68vh, 560px)' : 540,
        background: 'rgba(10,10,15,0.98)',
        border: '1px solid rgba(16,185,129,0.25)',
        borderRadius: isMobile ? 24 : 20,
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(16,185,129,0.1)',
        overflow: 'hidden',
        animation: 'scaleIn 0.25s ease',
      }}
    >
      {/* En-tête */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.04))',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 700,
            color: '#fff',
            fontFamily: 'Fraunces, serif',
          }}
        >
          O+
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ color: '#F7EFE8', fontWeight: 600, fontSize: 15, fontFamily: 'Fraunces, serif' }}>
              O+ Assistant
            </div>
            <div
              style={{
                fontSize: 10,
                background: isGrokActive ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                padding: '2px 8px',
                borderRadius: 20,
                color: isGrokActive ? '#10B981' : '#F59E0B',
                fontWeight: 500,
              }}
            >
              {isGrokActive ? '🚀 Grok xAI' : '⚠️ Mode hors ligne'}
            </div>
          </div>
          <div style={{ color: '#64748b', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10B981',
                display: 'inline-block',
                animation: 'pulse 1.5s infinite',
              }}
            />
            Conseiller IA - Intelligence artificielle
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 16px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius:
                  message.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background:
                  message.role === 'user'
                    ? 'linear-gradient(135deg, #10B981, #059669)'
                    : 'rgba(255,255,255,0.05)',
                color: '#F7EFE8',
                fontSize: 13.5,
                lineHeight: 1.55,
                fontFamily: 'Inter, sans-serif',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 5, padding: '10px 16px' }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10B981',
                animation: 'bounce 1.4s ease-in-out 0s infinite',
              }}
            />
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10B981',
                animation: 'bounce 1.4s ease-in-out 0.2s infinite',
              }}
            />
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10B981',
                animation: 'bounce 1.4s ease-in-out 0.4s infinite',
              }}
            />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions (seulement si peu de messages) */}
      {messages.length <= 2 && (
        <div style={{ padding: '0 16px 12px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setInput(suggestion.replace(/^[🎓💰🏛️🔬📚💻]\s*/, ''))}
              style={{
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
                color: '#34d399',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16,185,129,0.15)'
                e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(16,185,129,0.08)'
                e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)'
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          gap: 10,
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKey}
          placeholder="Question d'orientation (filière, univ., bac…)…"
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14,
            padding: '10px 16px',
            color: '#F7EFE8',
            fontSize: 13.5,
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
            lineHeight: 1.4,
            transition: 'all 0.2s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#10B981'
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: input.trim()
              ? 'linear-gradient(135deg, #10B981, #059669)'
              : 'rgba(255,255,255,0.05)',
            border: 'none',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (input.trim()) {
              e.currentTarget.style.transform = 'scale(1.02)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          {loading ? '...' : '→'}
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}