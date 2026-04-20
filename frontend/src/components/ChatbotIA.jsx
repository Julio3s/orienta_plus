import { useEffect, useRef, useState } from 'react'
import { chatbotAPI } from '../api/client'
import useMediaQuery from '../hooks/useMediaQuery'
import { useTheme } from '../theme/ThemeProvider'

export default function ChatbotIA({ context = {}, isOpen, onClose }) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const { isLight } = useTheme()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Bonjour ! Je suis **O+**, ton conseiller ORIENTA+. Je reponds uniquement aux questions d'orientation universitaire et post-bac au Benin : filieres, universites, bourses, parcours apres le bac et metiers lies aux etudes.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isAiOnline, setIsAiOnline] = useState(true)
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
        historique: messages.slice(-6),
        context,
      })

      if (data.source === 'groq' || data.source === 'policy') {
        setIsAiOnline(true)
      } else if (data.source === 'fallback') {
        setIsAiOnline(false)
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reponse }])
    } catch (error) {
      console.error('Erreur assistant IA:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "Desole, je rencontre une difficulte technique. Reessaie dans un instant ou reformule ta question d'orientation.",
        },
      ])
      setIsAiOnline(false)
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
    'Quelles sont les meilleures filieres en informatique au Benin ?',
    'Comment obtenir une bourse universitaire ?',
    'Quelle est la difference entre UAC et UNSTIM ?',
    'Quels metiers apres un BAC C ?',
    'Quelles etudes pour devenir medecin ?',
    'Formation en cybersecurite au Benin ?',
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
        background: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(10,10,15,0.98)',
        border: isLight ? '1px solid rgba(15,23,42,0.12)' : '1px solid rgba(201,106,74,0.22)',
        borderRadius: isMobile ? 24 : 20,
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: isLight ? 'none' : 'blur(20px)',
        boxShadow: isLight
          ? '0 18px 50px rgba(15,23,42,0.14), 0 0 0 1px rgba(15,23,42,0.06)'
          : '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,106,74,0.08)',
        overflow: 'hidden',
        animation: 'scaleIn 0.25s ease',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: isLight
            ? 'linear-gradient(135deg, rgba(47,92,127,0.10), rgba(184,91,61,0.06))'
            : 'linear-gradient(135deg, rgba(201,106,74,0.10), rgba(47,92,127,0.05))',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-deep))',
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
            <div
              style={{
                color: isLight ? 'var(--text-strong)' : '#F7EFE8',
                fontWeight: 600,
                fontSize: 15,
                fontFamily: 'Fraunces, serif',
              }}
            >
              O+ Assistant
            </div>
            <div
              style={{
                fontSize: 10,
                background: isAiOnline ? 'rgba(201,106,74,0.16)' : 'rgba(214,164,91,0.16)',
                padding: '2px 8px',
                borderRadius: 20,
                color: 'var(--brand-tertiary-soft)',
                fontWeight: 600,
              }}
            >
              {isAiOnline ? 'Groq' : 'Mode hors ligne'}
            </div>
          </div>
          <div style={{ color: '#64748b', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--brand-primary)',
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
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
        >
          x
        </button>
      </div>

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
                    ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-deep))'
                    : isLight
                      ? 'rgba(15,23,42,0.06)'
                      : 'rgba(255,255,255,0.05)',
                color: message.role === 'user' ? '#fff' : isLight ? 'var(--text-strong)' : '#F7EFE8',
                fontSize: 13.5,
                lineHeight: 1.55,
                fontFamily: 'Manrope, sans-serif',
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
                background: 'var(--brand-primary)',
                animation: 'bounce 1.4s ease-in-out 0s infinite',
              }}
            />
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--brand-primary)',
                animation: 'bounce 1.4s ease-in-out 0.2s infinite',
              }}
            />
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--brand-primary)',
                animation: 'bounce 1.4s ease-in-out 0.4s infinite',
              }}
            />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {messages.length <= 2 && (
        <div style={{ padding: '0 16px 12px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setInput(suggestion)}
              style={{
                background: 'rgba(201,106,74,0.08)',
                border: '1px solid rgba(201,106,74,0.2)',
                color: 'var(--brand-tertiary-soft)',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'Manrope, sans-serif',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(201,106,74,0.13)'
                e.currentTarget.style.borderColor = 'rgba(201,106,74,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(201,106,74,0.08)'
                e.currentTarget.style.borderColor = 'rgba(201,106,74,0.2)'
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          gap: 10,
          background: isLight ? 'rgba(15,23,42,0.03)' : 'rgba(0,0,0,0.2)',
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKey}
          placeholder="Question d'orientation universitaire (filiere, univ., bac...)..."
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.05)',
            border: isLight ? '1px solid rgba(15,23,42,0.14)' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14,
            padding: '10px 16px',
            color: isLight ? 'var(--text-strong)' : '#F7EFE8',
            fontSize: 13.5,
            fontFamily: 'Manrope, sans-serif',
            outline: 'none',
            lineHeight: 1.4,
            transition: 'all 0.2s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = isLight ? 'rgba(47,92,127,0.34)' : 'var(--brand-primary)'
            e.currentTarget.style.background = isLight ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.08)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = isLight ? 'rgba(15,23,42,0.14)' : 'rgba(255,255,255,0.1)'
            e.currentTarget.style.background = isLight ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.05)'
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
              ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-deep))'
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
          {loading ? '...' : '->'}
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
