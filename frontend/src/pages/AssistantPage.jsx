import { useEffect, useRef, useState } from 'react'
import { BsPlus, BsStars, BsTrash, BsChevronUp, BsChevronDown } from 'react-icons/bs'
import { FaCheckDouble } from 'react-icons/fa6'
import { IoSend } from 'react-icons/io5'
import { RiRobot2Line, RiHistoryLine, RiCloseLine } from 'react-icons/ri'
import { useNavigate } from 'react-router-dom'
import { chatbotAPI } from '../api/client'
import useMediaQuery from '../hooks/useMediaQuery'
import Navbar from '../components/Navbar'

const STORAGE_KEY = 'orienta_assistant_history'
function createTimeLabel() {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
}

function createMessage(role, content) {
  return {
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    role,
    content,
    time: createTimeLabel(),
  }
}

// Composants flottants (livres, matières)
const FloatingItems = () => {
  const items = [
    { icon: '📚' }, { icon: '📖' }, { icon: '📘' }, { icon: '📙' }, { icon: '📕' }, { icon: '📗' },
    { icon: '✏️' }, { icon: '🔬' }, { icon: '⚗️' }, { icon: '🧪' }, { icon: '🧬' },
    { icon: '📐' }, { icon: '📏' }, { icon: '💻' }, { icon: '🎓' }, { icon: '🏛️' },
    { icon: '📝' }, { icon: '📋' },
  ]

  const itemConfigs = useRef(
    items.map((item) => ({
      ...item,
      left: Math.random() * 100,
      delay: Math.random() * 15,
      duration: 8 + Math.random() * 12,
      size: 28 + Math.random() * 24,
    }))
  ).current

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {itemConfigs.map((item, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              bottom: '-50px',
              left: `${item.left}%`,
              fontSize: `${item.size}px`,
              opacity: 0.4,
              animation: `floatUp ${item.duration}s linear infinite`,
              animationDelay: `${item.delay}s`,
            }}
          >
            {item.icon}
          </div>
      ))}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default function AssistantPage() {
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const [inputExpanded, setInputExpanded] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Charger l'historique
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed)
        } else {
          setMessages([createMessage('assistant', '👋 Salut ! Je suis O+, ton conseiller d\'orientation. Pose-moi tes questions sur les filières, universités ou débouchés.')])
        }
      } catch { }
    } else {
      setMessages([createMessage('assistant', '👋 Salut ! Je suis O+, ton conseiller d\'orientation. Pose-moi tes questions sur les filières, universités ou débouchés.')])
    }
  }, [])

  // Sauvegarder l'historique
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)))
    }
  }, [messages])

  // Scroll en bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Fermer sidebar sur mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      const handleClickOutside = (e) => {
        if (!e.target.closest('.sidebar') && !e.target.closest('.sidebar-toggle')) {
          setSidebarOpen(false)
        }
      }
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isMobile, sidebarOpen])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = createMessage('user', text)
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const { data } = await chatbotAPI.envoyer({
        message: text,
        historique: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        context: {}
      })
      setMessages(prev => [...prev, createMessage('assistant', data.reponse)])
    } catch (error) {
      setMessages(prev => [...prev, createMessage('assistant', '❌ Désolé, une erreur technique est survenue. Réessaie dans un instant.')])
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = () => {
    if (confirm('Effacer toute la conversation ?')) {
      setMessages([createMessage('assistant', '👋 Salut ! Je suis O+, ton conseiller d\'orientation. Pose-moi tes questions sur les filières, universités ou débouchés.')])
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const newConversation = () => {
    setMessages([createMessage('assistant', '👋 Nouvelle conversation ! Je suis O+, ton conseiller d\'orientation. Que veux-tu savoir ?')])
  }

  const deleteDiscussion = (userMessageId) => {
    setMessages((prev) => {
      const userIndex = prev.findIndex((m) => m.id === userMessageId && m.role === 'user')
      if (userIndex === -1) return prev

      const nextIndex = userIndex + 1
      const idsToRemove = new Set([userMessageId])

      // Remove the assistant answer directly tied to this user question.
      if (prev[nextIndex] && prev[nextIndex].role === 'assistant') {
        idsToRemove.add(prev[nextIndex].id)
      }

      const remaining = prev.filter((m) => !idsToRemove.has(m.id))
      return remaining.length > 0
        ? remaining
        : [createMessage('assistant', '👋 Salut ! Je suis O+, ton conseiller d\'orientation. Pose-moi tes questions sur les filières, universités ou débouchés.')]
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={{ 
      minHeight: isMobile ? '100dvh' : '100vh',
      background: '#0a0a0f', 
      position: 'relative', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Navbar />

      {/* Fond animé */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          width: isMobile ? '280px' : '450px',
          height: isMobile ? '280px' : '450px',
          borderRadius: '50%',
          border: '2px solid rgba(201,106,74,0.15)',
          animation: 'spin 25s linear infinite',
        }} />
        <div style={{
          position: 'absolute',
          width: isMobile ? '200px' : '320px',
          height: isMobile ? '200px' : '320px',
          borderRadius: '50%',
          border: '2px solid rgba(201,106,74,0.1)',
          animation: 'spinReverse 20s linear infinite',
        }} />
        <div style={{
          width: isMobile ? '120px' : '200px',
          height: isMobile ? '120px' : '200px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(201,106,74,0.15), rgba(169,77,49,0.08))',
          backdropFilter: 'blur(8px)',
          border: '2px solid rgba(201,106,74,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Fraunces, serif',
          fontSize: isMobile ? '48px' : '80px',
          fontWeight: 800,
          color: 'rgba(201,106,74,0.35)',
          animation: 'pulse 3s ease-in-out infinite',
        }}>
          O+
        </div>
      </div>

      <FloatingItems />

      {/* Bouton toggle sidebar */}
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'fixed',
          top: 'calc(74px + env(safe-area-inset-top))',
          right: 12,
          zIndex: 1205,
          minWidth: 48,
          height: 48,
          borderRadius: 24,
          background: 'linear-gradient(135deg, #C96A4A, #A94D31)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: '#fff',
          display: isMobile ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '0 12px',
          cursor: 'pointer',
          boxShadow: '0 8px 18px rgba(0,0,0,0.35)',
          transition: 'all 0.25s ease',
        }}
        aria-label={sidebarOpen ? 'Fermer historique' : 'Ouvrir historique'}
      >
        {sidebarOpen ? <RiCloseLine size={22} /> : <RiHistoryLine size={22} />}
        {!sidebarOpen && <span style={{ fontSize: 12, fontWeight: 600 }}>Historique</span>}
      </button>

      {/* Overlay mobile */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 85,
          }}
        />
      )}

      {/* Sidebar */}
      <div className="sidebar" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: isMobile ? (sidebarOpen ? '280px' : '0') : '260px',
        background: 'rgba(10,10,15,0.95)',
        backdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        zIndex: 90,
        transition: 'width 0.3s ease, transform 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: '70px',
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button
                onClick={() => setSidebarOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Fermer historique"
              >
                <RiCloseLine size={16} />
              </button>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #C96A4A, #A94D31)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>💬</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Historique</div>
              <div style={{ color: '#8B7669', fontSize: 11 }}>{messages.filter(m => m.role === 'user').length} messages</div>
            </div>
          </div>
          <button onClick={newConversation} style={{
            width: '100%',
            padding: '10px',
            borderRadius: 12,
            background: 'rgba(201,106,74,0.15)',
            border: '1px solid rgba(201,106,74,0.3)',
            color: '#F0B39A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
            fontSize: 13,
            marginBottom: 8,
          }}>
            <BsPlus size={16} /> Nouvelle discussion
          </button>
          <button onClick={clearHistory} style={{
            width: '100%',
            padding: '10px',
            borderRadius: 12,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
            fontSize: 13,
          }}>
            <BsTrash size={14} /> Effacer tout
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Discussions récentes
          </div>
          {messages.filter(m => m.role === 'user').slice(-10).reverse().map((msg) => (
            <div key={msg.id} style={{
              padding: '10px 12px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              marginBottom: 8,
              fontSize: 12,
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}>
              <span style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {msg.content.length > 40 ? msg.content.slice(0, 40) + '...' : msg.content}
              </span>
              <button
                onClick={() => deleteDiscussion(msg.id)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  border: '1px solid rgba(248,113,113,0.25)',
                  background: 'rgba(239,68,68,0.10)',
                  color: '#f87171',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                aria-label="Supprimer cette discussion"
                title="Supprimer cette discussion"
              >
                <BsTrash size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Contenu principal */}
      <main style={{
        marginLeft: isMobile ? 0 : (sidebarOpen ? '260px' : '0'),
        transition: 'margin-left 0.3s ease',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: isMobile
          ? (inputExpanded ? 'calc(250px + env(safe-area-inset-bottom))' : 'calc(180px + env(safe-area-inset-bottom))')
          : '80px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Header */}
        <div style={{
          position: 'sticky',
          top: 0,
          background: 'rgba(10,10,15,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '12px 20px',
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 900, margin: '0 auto' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #C96A4A, #A94D31)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <RiRobot2Line size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#fff' }}>O+ Assistant</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{loading ? 'En train d\'écrire...' : 'En ligne'}</div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          maxWidth: 900,
          margin: '0 auto',
          width: '100%',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: isMobile ? '85%' : '70%',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #C96A4A, #A94D31)'
                  : 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: 14,
                lineHeight: 1.5,
                backdropFilter: 'blur(10px)',
              }}>
                {msg.content}
                <div style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: 6,
                  textAlign: 'right',
                }}>
                  {msg.time}
                  {msg.role === 'user' && <FaCheckDouble size={10} style={{ marginLeft: 6 }} />}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 8 }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: 18,
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                gap: 4,
              }}>
                <span style={{ width: 7, height: 7, background: '#C96A4A', borderRadius: '50%', animation: 'bounce 1.4s infinite' }} />
                <span style={{ width: 7, height: 7, background: '#C96A4A', borderRadius: '50%', animation: 'bounce 1.4s 0.2s infinite' }} />
                <span style={{ width: 7, height: 7, background: '#C96A4A', borderRadius: '50%', animation: 'bounce 1.4s 0.4s infinite' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input pliable/dépliable - STYLE WHATSAPP */}
      <div style={{
        position: 'fixed',
        bottom: isMobile ? 'calc(98px + env(safe-area-inset-bottom))' : 0,
        left: 0,
        right: 0,
        background: 'rgba(10,10,15,0.98)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        zIndex: 1201,
        transition: 'all 0.3s ease',
      }}>
        {/* Bouton pour plier/déplier */}
        <button
          onClick={() => setInputExpanded(!inputExpanded)}
          style={{
            width: '100%',
            padding: '8px',
            background: 'transparent',
            border: 'none',
            color: '#8B7669',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 12,
          }}
        >
          {inputExpanded ? (
            <><BsChevronDown size={14} /> Réduire</>
          ) : (
            <><BsChevronUp size={14} /> Déplier pour écrire plus</>
          )}
        </button>

        {/* Zone d'écriture */}
        <div style={{
          padding: isMobile ? (inputExpanded ? '12px' : '10px 12px') : '12px 16px',
          transition: 'padding 0.3s ease',
        }}>
          <div style={{ 
            maxWidth: 900, 
            margin: '0 auto', 
            display: 'flex', 
            gap: 12,
            alignItems: 'flex-end',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pose ta question..."
              rows={inputExpanded ? (isMobile ? 4 : 3) : 1}
              style={{
                flex: 1,
                padding: isMobile ? '12px 14px' : '12px 16px',
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: isMobile ? 16 : 14,
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                maxHeight: isMobile ? '150px' : '200px',
                lineHeight: 1.4,
                transition: 'height 0.2s ease',
              }}
              autoFocus={!isMobile}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                width: isMobile ? 44 : 48,
                height: isMobile ? 44 : 48,
                borderRadius: 24,
                background: input.trim() ? 'linear-gradient(135deg, #C96A4A, #A94D31)' : 'rgba(255,255,255,0.1)',
                border: 'none',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
            >
              <IoSend size={isMobile ? 18 : 18} />
            </button>
          </div>
          
          {/* Petit indicateur de caractères (optionnel) */}
          {inputExpanded && input.length > 0 && (
            <div style={{
              textAlign: 'right',
              fontSize: 10,
              color: '#64748b',
              marginTop: 6,
              paddingRight: isMobile ? 56 : 60,
            }}>
              {input.length} caractères
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spinReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(${sidebarOpen ? '0' : '-100%'});
            transition: transform 0.3s ease;
          }
          .sidebar {
            width: 280px !important;
          }
          
          textarea {
            font-size: 16px !important;
          }
        }
        
        @supports (-webkit-touch-callout: none) {
          .assistant-input-container {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>
    </div>
  )
}
