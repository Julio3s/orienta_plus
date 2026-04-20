import { useEffect, useMemo, useRef, useState } from 'react'
import { BsStars } from 'react-icons/bs'
import { FaCheckDouble } from 'react-icons/fa6'
import { HiOutlineSparkles } from 'react-icons/hi2'
import { IoSend } from 'react-icons/io5'
import { MdOutlineAutoGraph, MdOutlineSchool, MdOutlineTravelExplore } from 'react-icons/md'
import { RiRobot2Line } from 'react-icons/ri'
import { useNavigate } from 'react-router-dom'
import { chatbotAPI, seriesAPI, suggererAPI } from '../api/client'
import useMediaQuery from '../hooks/useMediaQuery'
import Navbar from '../components/Navbar'

const ASSISTANT_HISTORY_STORAGE_KEY = 'orienta_assistant_history_v2'
const ASSISTANT_SIMULATION_DRAFT_STORAGE_KEY = 'orienta_assistant_simulation_draft'
const MAX_HISTORY_MESSAGES = 40

const RESULT_CONFIG = {
  bourse: { label: 'Bourse complete', color: '#C96A4A', bg: 'rgba(201,106,74,0.14)' },
  demi_bourse: { label: 'Demi-bourse', color: '#2F5C7F', bg: 'rgba(47,92,127,0.14)' },
  payant: { label: 'Admission payante', color: '#D6A45B', bg: 'rgba(214,164,91,0.14)' },
  non_admissible: { label: 'Non admissible', color: '#EF4444', bg: 'rgba(239,68,68,0.14)' },
}

const QUICK_PROMPTS = [
  'Compare UAC et UNSTIM pour informatique',
  'Serie D : quelles filieres en sante ?',
  'Comment obtenir une bourse universitaire ?',
  'Serie C, MATH 15, PHYS 14, SVT 13, CHIMIE 12',
]

const SUBJECT_CODE_ALIASES = {
  MATH: ['math', 'maths', 'mathematique', 'mathematiques'],
  PHY: ['phy', 'phys', 'physique', 'pc', 'physique chimie'],
  PHYS: ['phy', 'phys', 'physique', 'pc', 'physique chimie'],
  CHIMIE: ['chimie', 'chim'],
  SVT: ['svt', 'bio', 'biologie'],
  ANG: ['ang', 'anglais'],
  FR: ['francais', 'fr'],
  FRANCAIS: ['francais', 'fr'],
  HIST: ['histoire', 'hist', 'hg', 'histoire geo', 'histoire geographie'],
  GEO: ['geo', 'geographie'],
  ECON: ['eco', 'economie'],
  INFO: ['info', 'informatique'],
  COMPTA: ['compta', 'comptabilite'],
  PHILO: ['philo', 'philosophie'],
  ESP: ['esp', 'espagnol'],
  ALL: ['all', 'allemand'],
  ARABE: ['arabe'],
  PSYCHO: ['psycho', 'psychologie'],
  SPORT: ['sport', 'eps'],
  ART: ['art', 'arts'],
  MUSIQUE: ['musique'],
}

const STOP_WORDS = new Set([
  'de',
  'des',
  'du',
  'et',
  'la',
  'le',
  'les',
  'matiere',
  'matieres',
  'langue',
  'sciences',
  'serie',
])

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, "'")
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function createTimeLabel() {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
}

function createMessage(role, content, extra = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    kind: 'text',
    time: createTimeLabel(),
    ...extra,
    content,
  }
}

function createInitialMessages() {
  return [
    createMessage(
      'assistant',
      "Bonjour. Je suis O+, ton assistant d'orientation universitaire. Je peux repondre a tes questions et lancer le simulateur si tu m'envoies une serie avec des notes."
    ),
    createMessage(
      'assistant',
      'Exemple utile : "Serie C, MATH 15, PHYS 14, SVT 13, CHIMIE 12".',
      { tone: 'hint' }
    ),
  ]
}

function readStoredMessages() {
  if (typeof window === 'undefined') return createInitialMessages()

  try {
    const raw = window.localStorage.getItem(ASSISTANT_HISTORY_STORAGE_KEY)
    if (!raw) return createInitialMessages()

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.length) return createInitialMessages()

    return parsed
      .filter((item) => item && typeof item.content === 'string' && typeof item.role === 'string')
      .slice(-MAX_HISTORY_MESSAGES)
      .map((item) => ({
        kind: 'text',
        time: createTimeLabel(),
        ...item,
      }))
  } catch {
    return createInitialMessages()
  }
}

function buildSubjectEntry(matiere) {
  const code = String(matiere?.code || '').toUpperCase()
  const normalizedName = normalizeText(matiere?.nom || '')
  const aliases = new Set()

  if (code) aliases.add(normalizeText(code))
  if (normalizedName) aliases.add(normalizedName)

  normalizedName
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 4 && !STOP_WORDS.has(item))
    .forEach((item) => aliases.add(item))

  ;(SUBJECT_CODE_ALIASES[code] || []).forEach((alias) => aliases.add(normalizeText(alias)))

  if (code === 'PHY') {
    ;(SUBJECT_CODE_ALIASES.PHYS || []).forEach((alias) => aliases.add(normalizeText(alias)))
  }

  if (code === 'PHYS') {
    ;(SUBJECT_CODE_ALIASES.PHY || []).forEach((alias) => aliases.add(normalizeText(alias)))
  }

  return {
    code,
    nom: matiere?.nom || code,
    aliases: Array.from(aliases).sort((a, b) => b.length - a.length),
  }
}

function buildGenericSubjectCatalog(seriesList) {
  const uniqueSubjects = new Map()

  for (const serie of seriesList) {
    for (const item of serie.matieres || []) {
      const matiere = item.matiere
      if (matiere?.code && !uniqueSubjects.has(matiere.code)) {
        uniqueSubjects.set(matiere.code, buildSubjectEntry(matiere))
      }
    }
  }

  return Array.from(uniqueSubjects.values())
}

function detectSeries(text, seriesList) {
  const normalized = normalizeText(text)
  const orderedSeries = [...seriesList].sort(
    (left, right) => String(right.code || '').length - String(left.code || '').length
  )

  for (const serie of orderedSeries) {
    const code = normalizeText(serie.code)
    if (!code) continue

    const pattern = new RegExp(`(?:^|[^a-z0-9])${escapeRegex(code)}(?:[^a-z0-9]|$)`, 'i')
    if (pattern.test(normalized)) {
      return serie
    }
  }

  return null
}

function parseNumericValue(rawValue) {
  const value = parseFloat(String(rawValue || '').replace(',', '.'))
  if (Number.isNaN(value) || value < 0 || value > 20) return null
  return Number(value.toFixed(2))
}

function findNoteValue(normalizedText, alias) {
  const escapedAlias = alias
    .split(/\s+/)
    .map((part) => escapeRegex(part))
    .join('\\s+')

  const patterns = [
    new RegExp(
      `(?:^|[^a-z0-9])${escapedAlias}\\s*(?:note\\s*)?(?::|=|\\-|est\\s+de|a|=>)?\\s*(\\d{1,2}(?:[\\.,]\\d+)?)`,
      'i'
    ),
    new RegExp(
      `(\\d{1,2}(?:[\\.,]\\d+)?)\\s*(?:\\/\\s*20)?\\s*(?:en\\s+)?${escapedAlias}(?:[^a-z0-9]|$)`,
      'i'
    ),
  ]

  for (const pattern of patterns) {
    const match = normalizedText.match(pattern)
    if (!match?.[1]) continue

    const parsed = parseNumericValue(match[1])
    if (parsed !== null) return parsed
  }

  return null
}

function extractNotesFromCatalog(text, subjectCatalog) {
  const normalizedText = normalizeText(text)
  const notes = {}

  for (const subject of subjectCatalog) {
    for (const alias of subject.aliases) {
      const value = findNoteValue(normalizedText, alias)
      if (value !== null) {
        notes[subject.code] = value
        break
      }
    }
  }

  return notes
}

function extractSimulationIntent(text, seriesList, genericCatalog) {
  if (!seriesList.length) return null

  const detectedSeries = detectSeries(text, seriesList)

  if (detectedSeries) {
    const subjectCatalog = (detectedSeries.matieres || []).map((item) => buildSubjectEntry(item.matiere))
    const notes = extractNotesFromCatalog(text, subjectCatalog)
    const noteCount = Object.keys(notes).length

    if (noteCount >= Math.min(3, subjectCatalog.length || 3)) {
      return { status: 'complete', serie: detectedSeries, notes }
    }

    if (noteCount > 0) {
      const missingSubjects = (detectedSeries.matieres || [])
        .map((item) => item.matiere)
        .filter((matiere) => !(matiere.code in notes))
        .slice(0, 4)
        .map((matiere) => matiere.nom)

      return {
        status: 'partial',
        reason: 'missing_notes',
        serie: detectedSeries,
        notes,
        missingSubjects,
      }
    }

    return null
  }

  const genericNotes = extractNotesFromCatalog(text, genericCatalog)
  if (Object.keys(genericNotes).length >= 2) {
    return {
      status: 'partial',
      reason: 'missing_series',
      notes: genericNotes,
    }
  }

  return null
}

function buildSimulationDraft(intent) {
  return {
    serieId: intent?.serie?.id || null,
    serieCode: intent?.serie?.code || '',
    notes: intent?.notes || {},
    savedAt: Date.now(),
  }
}

function buildHistoryForBackend(messages) {
  return messages
    .filter((message) => typeof message.content === 'string' && message.content.trim())
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content: message.summary || message.content,
    }))
}

function getLatestSimulationPayload(messages) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].kind === 'simulation' && messages[index].payload) {
      return messages[index].payload
    }
  }

  return null
}

export default function AssistantPage() {
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [series, setSeries] = useState([])
  const [seriesLoading, setSeriesLoading] = useState(true)
  const [messages, setMessages] = useState(() => readStoredMessages())
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const textareaRef = useRef(null)
  const bottomRef = useRef(null)

  const genericSubjectCatalog = useMemo(() => buildGenericSubjectCatalog(series), [series])
  const latestSimulation = useMemo(() => getLatestSimulationPayload(messages), [messages])

  const composerBottom = isMobile ? 'calc(102px + env(safe-area-inset-bottom))' : '28px'
  const pageBottomPadding = isMobile ? 'calc(250px + env(safe-area-inset-bottom))' : '180px'

  useEffect(() => {
    let isMounted = true

    seriesAPI
      .list()
      .then((response) => {
        if (!isMounted) return
        setSeries(response.data.results || response.data)
        setSeriesLoading(false)
      })
      .catch(() => {
        if (!isMounted) return
        setSeriesLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(
        ASSISTANT_HISTORY_STORAGE_KEY,
        JSON.stringify(messages.slice(-MAX_HISTORY_MESSAGES))
      )
    } catch {}
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = '0px'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`
  }, [input])

  const appendMessages = (...nextMessages) => {
    setMessages((previous) => [...previous, ...nextMessages].slice(-MAX_HISTORY_MESSAGES))
  }

  const clearConversation = () => {
    const baseMessages = createInitialMessages()
    setMessages(baseMessages)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(ASSISTANT_HISTORY_STORAGE_KEY)
    }
  }

  const openOrientationWithDraft = (draft) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        ASSISTANT_SIMULATION_DRAFT_STORAGE_KEY,
        JSON.stringify({
          ...draft,
          savedAt: Date.now(),
        })
      )
    }

    navigate('/orientation')
  }

  const runSimulationFromIntent = async (intent) => {
    const draft = buildSimulationDraft(intent)

    try {
      const { data } = await suggererAPI.suggerer({
        serie_id: intent.serie.id,
        notes: intent.notes,
      })

      const resultats = Array.isArray(data?.resultats) ? data.resultats : []
      if (!resultats.length) {
        appendMessages(
          createMessage(
            'assistant',
            `J'ai lance le simulateur pour la serie ${intent.serie.code} avec ${Object.keys(intent.notes).length} notes reconnues, mais je n'obtiens pas de proposition exploitable pour le moment.`
          ),
          createMessage(
            'assistant',
            'Tu peux ouvrir le simulateur complet pour verifier ou completer tes notes.',
            {
              kind: 'action',
              actionLabel: 'Ouvrir le simulateur',
              actionType: 'redirect',
              draft,
            }
          )
        )
        return
      }

      const topResults = resultats.slice(0, 4)
      const summary = topResults
        .map((resultat) => `${resultat.filiere_nom} (${resultat.pourcentage}%)`)
        .join(', ')

      appendMessages(
        createMessage(
          'assistant',
          `J'ai utilise le simulateur ORIENTA+ pour la serie ${intent.serie.code} avec ${Object.keys(intent.notes).length} notes reconnues. Voici les meilleures pistes obtenues par l'algo.`,
          { summary: `Simulation ${intent.serie.code}: ${summary}` }
        ),
        createMessage(
          'assistant',
          `Simulation ${intent.serie.code}`,
          {
            kind: 'simulation',
            summary: `Simulation ${intent.serie.code}: ${summary}`,
            payload: {
              serieCode: intent.serie.code,
              noteCount: Object.keys(intent.notes).length,
              resultats: topResults,
              total: resultats.length,
            },
          }
        ),
        createMessage(
          'assistant',
          'Si tu veux, tu peux aussi ouvrir le simulateur complet avec le brouillon deja prepare.',
          {
            kind: 'action',
            actionLabel: 'Continuer dans le simulateur',
            actionType: 'redirect',
            draft,
          }
        )
      )
    } catch {
      appendMessages(
        createMessage(
          'assistant',
          "Je n'ai pas reussi a lancer la simulation automatiquement cette fois-ci."
        ),
        createMessage(
          'assistant',
          'Ouvre le simulateur complet et je t y enverrai avec les informations deja reconnues.',
          {
            kind: 'action',
            actionLabel: 'Ouvrir le simulateur',
            actionType: 'redirect',
            draft,
          }
        )
      )
    }
  }

  const handlePartialSimulationIntent = (intent) => {
    const draft = buildSimulationDraft(intent)

    if (intent.reason === 'missing_series') {
      appendMessages(
        createMessage(
          'assistant',
          "J'ai reconnu des notes, mais pas la serie du bac. Dis-moi par exemple 'Serie C' ou ouvre directement le simulateur."
        ),
        createMessage(
          'assistant',
          'Le simulateur complet est la meilleure option si tu veux saisir les informations proprement.',
          {
            kind: 'action',
            actionLabel: 'Ouvrir le simulateur',
            actionType: 'redirect',
            draft,
          }
        )
      )
      return
    }

    const missingText =
      intent.missingSubjects?.length
        ? `Il me manque encore par exemple : ${intent.missingSubjects.join(', ')}.`
        : 'Il me manque encore quelques notes pour une simulation plus solide.'

    appendMessages(
      createMessage(
        'assistant',
        `J'ai reconnu la serie ${intent.serie.code} et ${Object.keys(intent.notes).length} note(s). ${missingText}`
      ),
      createMessage(
        'assistant',
        'Je peux continuer directement dans le simulateur avec ce brouillon.',
        {
          kind: 'action',
          actionLabel: 'Ouvrir le simulateur',
          actionType: 'redirect',
          draft,
        }
      )
    )
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMessage = createMessage('user', text)
    const historyMessages = [...messages, userMessage]
    const simulationIntent = extractSimulationIntent(text, series, genericSubjectCatalog)

    setInput('')
    setMessages((previous) => [...previous, userMessage].slice(-MAX_HISTORY_MESSAGES))

    if (simulationIntent?.status === 'partial') {
      handlePartialSimulationIntent(simulationIntent)
      return
    }

    setLoading(true)

    if (simulationIntent?.status === 'complete') {
      await runSimulationFromIntent(simulationIntent)
      setLoading(false)
      return
    }

    try {
      const { data } = await chatbotAPI.envoyer({
        message: text,
        historique: buildHistoryForBackend(historyMessages),
        context: latestSimulation
          ? {
              serie: latestSimulation.serieCode,
              has_results: true,
            }
          : {},
      })

      appendMessages(createMessage('assistant', data.reponse))
    } catch {
      appendMessages(
        createMessage(
          'assistant',
          "Je rencontre une difficulte technique. Reessaie dans quelques instants avec ta question d'orientation."
        )
      )
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  const renderMessage = (message) => {
    if (message.kind === 'simulation' && message.payload) {
      return (
        <div
          key={message.id}
          style={{
            maxWidth: '100%',
            borderRadius: 24,
            border: '1px solid rgba(201,106,74,0.16)',
            background: 'linear-gradient(135deg, rgba(201,106,74,0.10), rgba(47,92,127,0.06))',
            padding: isMobile ? 14 : 18,
            boxShadow: '0 20px 44px rgba(0,0,0,0.16)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 14,
              flexWrap: 'wrap',
              marginBottom: 14,
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 12px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.06)',
                  color: '#F0B39A',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <MdOutlineAutoGraph size={15} />
                Simulation ORIENTA+
              </div>
              <div
                style={{
                  marginTop: 10,
                  color: '#F7EFE8',
                  fontFamily: 'Fraunces, serif',
                  fontSize: isMobile ? 20 : 24,
                  fontWeight: 700,
                }}
              >
                Serie {message.payload.serieCode}
              </div>
              <div style={{ marginTop: 4, color: '#B8C3D1', fontSize: 13 }}>
                {message.payload.noteCount} note(s) reconnue(s) • {message.payload.total} proposition(s)
              </div>
            </div>

            <div
              style={{
                minWidth: 120,
                padding: '12px 14px',
                borderRadius: 18,
                background: 'rgba(255,255,255,0.05)',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#8B9AA8', fontSize: 11, textTransform: 'uppercase' }}>
                Meilleure compat.
              </div>
              <div
                style={{
                  color: '#F0B39A',
                  fontFamily: 'Fraunces, serif',
                  fontSize: 32,
                  fontWeight: 800,
                  lineHeight: 1,
                  marginTop: 6,
                }}
              >
                {message.payload.resultats[0]?.pourcentage || 0}%
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {message.payload.resultats.map((resultat) => {
              const config = RESULT_CONFIG[resultat.statut] || RESULT_CONFIG.non_admissible
              const universities = (resultat.universites || [])
                .slice(0, 2)
                .map((item) => item.universite_nom)
                .join(' • ')

              return (
                <div
                  key={`${message.id}-${resultat.filiere_id}`}
                  style={{
                    borderRadius: 18,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(9,13,19,0.48)',
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ color: '#F7EFE8', fontWeight: 700, fontSize: 15 }}>
                        {resultat.filiere_nom}
                      </div>
                      <div style={{ marginTop: 4, color: '#8B9AA8', fontSize: 12 }}>
                        Moyenne calculee : {resultat.moyenne_calculee}/20
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '7px 10px',
                        borderRadius: 999,
                        background: config.bg,
                        color: config.color,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {resultat.pourcentage}% • {config.label}
                    </div>
                  </div>

                  {universities && (
                    <div style={{ marginTop: 10, color: '#B8C3D1', fontSize: 12, lineHeight: 1.6 }}>
                      Universites : {universities}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    if (message.kind === 'action') {
      return (
        <div
          key={message.id}
          style={{
            maxWidth: isMobile ? '100%' : '84%',
            padding: isMobile ? '14px' : '16px',
            borderRadius: 22,
            border: '1px solid rgba(47,92,127,0.18)',
            background: 'rgba(47,92,127,0.10)',
            boxShadow: '0 16px 36px rgba(0,0,0,0.12)',
          }}
        >
          <div style={{ color: '#F7EFE8', fontWeight: 700, fontSize: 15 }}>{message.content}</div>
          <div style={{ marginTop: 6, color: '#B8C3D1', fontSize: 13, lineHeight: 1.7 }}>
            Je garde le brouillon pour t'eviter de retaper les informations reconnues.
          </div>
          <button
            type="button"
            onClick={() => openOrientationWithDraft(message.draft || {})}
            style={{
              marginTop: 14,
              padding: '11px 16px',
              borderRadius: 14,
              border: 'none',
              background: 'linear-gradient(135deg, #2F5C7F, #244760)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {message.actionLabel || 'Ouvrir le simulateur'}
          </button>
        </div>
      )
    }

    const isUser = message.role === 'user'
    const bubbleColor = isUser
      ? 'linear-gradient(135deg, #C96A4A, #A94D31)'
      : message.tone === 'hint'
        ? 'rgba(47,92,127,0.14)'
        : 'rgba(255,255,255,0.08)'

    return (
      <div
        key={message.id}
        style={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          gap: 10,
        }}
      >
        {!isUser && (
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #C96A4A, #A94D31)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <RiRobot2Line size={16} color="#fff" />
          </div>
        )}

        <div
          style={{
            maxWidth: isMobile ? '88%' : '76%',
            padding: '12px 14px 8px',
            borderRadius: isUser ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
            background: bubbleColor,
            color: '#fff',
            lineHeight: 1.65,
            boxShadow: '0 14px 30px rgba(0,0,0,0.14)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          <div style={{ fontSize: 14 }}>{message.content}</div>
          <div
            style={{
              marginTop: 8,
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 6,
              color: 'rgba(255,255,255,0.62)',
              fontSize: 10,
            }}
          >
            <span>{message.time}</span>
            {isUser && <FaCheckDouble size={11} />}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Navbar />

      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: isMobile ? '10%' : '12%',
            right: isMobile ? -110 : -40,
            width: isMobile ? 280 : 520,
            height: isMobile ? 280 : 520,
            borderRadius: '50%',
            border: '1px solid rgba(201,106,74,0.18)',
            animation: 'assistantOrbit 24s linear infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: isMobile ? '17%' : '19%',
            right: isMobile ? -40 : 40,
            width: isMobile ? 190 : 340,
            height: isMobile ? 190 : 340,
            borderRadius: '50%',
            border: '1px solid rgba(47,92,127,0.20)',
            animation: 'assistantOrbitReverse 16s linear infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: isMobile ? '24%' : '28%',
            right: isMobile ? 34 : 126,
            width: isMobile ? 110 : 154,
            height: isMobile ? 110 : 154,
            borderRadius: 36,
            background: 'linear-gradient(135deg, #C96A4A, #A94D31)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontFamily: 'Fraunces, serif',
            fontWeight: 800,
            fontSize: isMobile ? 38 : 58,
            boxShadow: '0 28px 60px rgba(201,106,74,0.30)',
            animation: 'assistantSpin 16s linear infinite',
          }}
        >
          O+
        </div>
      </div>

      <main
        style={{
          position: 'relative',
          zIndex: 1,
          width: 'min(1180px, calc(100% - 24px))',
          margin: '0 auto',
          padding: `34px 0 ${pageBottomPadding}`,
        }}
      >
        <section
          style={{
            borderRadius: 32,
            border: '1px solid rgba(255,255,255,0.08)',
            background:
              'linear-gradient(180deg, rgba(10,14,18,0.78), rgba(10,14,18,0.88)), linear-gradient(135deg, rgba(201,106,74,0.06), rgba(47,92,127,0.05))',
            boxShadow: '0 28px 72px rgba(0,0,0,0.28)',
            padding: isMobile ? 22 : 32,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid rgba(201,106,74,0.18)',
              background: 'rgba(201,106,74,0.08)',
              color: '#F0B39A',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <HiOutlineSparkles size={14} />
            Espace Assistant O+
          </div>

          <div
            style={{
              marginTop: 18,
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.1fr) minmax(260px, 320px)',
              gap: 22,
              alignItems: 'start',
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  color: '#F7EFE8',
                  fontFamily: 'Fraunces, serif',
                  fontSize: isMobile ? 34 : 52,
                  fontWeight: 800,
                  lineHeight: 1.04,
                  letterSpacing: '-0.05em',
                }}
              >
                Une vraie conversation
                <br />
                pour ton orientation.
              </h1>

              <p
                style={{
                  margin: '16px 0 0',
                  maxWidth: 720,
                  color: '#A7B1C0',
                  fontSize: 15,
                  lineHeight: 1.8,
                }}
              >
                Si tu poses une question classique, O+ te repond. Si tu lui envoies une serie et des
                notes, il essaie d'utiliser directement le simulateur ORIENTA+ au lieu de rester dans
                une simple discussion.
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                  marginTop: 18,
                }}
              >
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.04)',
                      color: '#E6D9CF',
                      cursor: 'pointer',
                      fontSize: 12,
                      textAlign: 'left',
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gap: 12,
              }}
            >
              <div
                style={{
                  borderRadius: 24,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  padding: 18,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    color: '#F7EFE8',
                    fontWeight: 700,
                  }}
                >
                  <MdOutlineAutoGraph size={20} color="#F0B39A" />
                  Simulation intelligente
                </div>
                <p style={{ margin: '10px 0 0', color: '#A7B1C0', fontSize: 13, lineHeight: 1.75 }}>
                  Exemple reconnu automatiquement : Serie C, MATH 15, PHYS 14, SVT 13.
                </p>
              </div>

              <div
                style={{
                  borderRadius: 24,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  padding: 18,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    color: '#F7EFE8',
                    fontWeight: 700,
                  }}
                >
                  <MdOutlineTravelExplore size={20} color="#9CC0D7" />
                  Historique conserve
                </div>
                <p style={{ margin: '10px 0 0', color: '#A7B1C0', fontSize: 13, lineHeight: 1.75 }}>
                  La discussion reste sauvegardee si tu changes de page puis reviens plus tard.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            marginTop: 24,
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '320px minmax(0, 1fr)',
            gap: 24,
          }}
        >
          <aside
            style={{
              display: 'grid',
              gap: 16,
              alignSelf: 'start',
            }}
          >
            <div
              style={{
                borderRadius: 28,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'linear-gradient(180deg, rgba(9,13,19,0.78), rgba(9,13,19,0.88))',
                boxShadow: '0 22px 60px rgba(0,0,0,0.20)',
                padding: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ color: '#F7EFE8', fontSize: 18, fontWeight: 700, fontFamily: 'Fraunces, serif' }}>
                    O+ comprend
                  </div>
                  <div style={{ marginTop: 4, color: '#8B9AA8', fontSize: 12 }}>
                    {seriesLoading ? 'Chargement des series...' : `${series.length} series disponibles`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearConversation}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#B8C3D1',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Effacer
                </button>
              </div>

              <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                {[
                  {
                    icon: MdOutlineSchool,
                    title: 'Questions d orientation',
                    text: 'Filieres, universites, debouches, bourses, reorientation.',
                    color: '#F0B39A',
                  },
                  {
                    icon: MdOutlineAutoGraph,
                    title: 'Serie + notes',
                    text: "Si le message est exploitable, j'utilise l'algo de suggestion au lieu d'improviser.",
                    color: '#9CC0D7',
                  },
                  {
                    icon: HiOutlineSparkles,
                    title: 'Redirection intelligente',
                    text: "S'il manque des informations, je prepare un brouillon pour le simulateur.",
                    color: '#EDC98A',
                  },
                ].map((item) => {
                  const Icon = item.icon

                  return (
                    <div
                      key={item.title}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '44px minmax(0, 1fr)',
                        gap: 12,
                        alignItems: 'start',
                        padding: 14,
                        borderRadius: 18,
                        border: '1px solid rgba(255,255,255,0.07)',
                        background: 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 14,
                          background: `${item.color}18`,
                          color: item.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={19} />
                      </div>
                      <div>
                        <div style={{ color: '#F7EFE8', fontWeight: 700, fontSize: 14 }}>{item.title}</div>
                        <div style={{ marginTop: 4, color: '#A7B1C0', fontSize: 13, lineHeight: 1.65 }}>
                          {item.text}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </aside>

          <section
            style={{
              borderRadius: 30,
              border: '1px solid rgba(255,255,255,0.08)',
              background:
                'linear-gradient(180deg, rgba(9,13,19,0.78), rgba(9,13,19,0.90)), linear-gradient(135deg, rgba(201,106,74,0.05), rgba(47,92,127,0.04))',
              boxShadow: '0 24px 70px rgba(0,0,0,0.22)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: '18px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'linear-gradient(135deg, rgba(201,106,74,0.08), rgba(47,92,127,0.05))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #C96A4A, #A94D31)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 18px 34px rgba(201,106,74,0.20)',
                  }}
                >
                  <RiRobot2Line size={22} color="#fff" />
                </div>
                <div>
                  <div style={{ color: '#F7EFE8', fontWeight: 700, fontSize: 18, fontFamily: 'Fraunces, serif' }}>
                    O+ Assistant
                  </div>
                  <div style={{ marginTop: 2, color: '#8B9AA8', fontSize: 12 }}>
                    {loading ? "Analyse en cours..." : 'Pret a repondre ou a simuler'}
                  </div>
                </div>
              </div>

              {!isMobile && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#E6D9CF',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Orientation universitaire uniquement
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                padding: isMobile ? '16px 14px 20px' : '20px 18px 24px',
                minHeight: isMobile ? '52vh' : '60vh',
                background:
                  'radial-gradient(circle at top left, rgba(201,106,74,0.05), transparent 24%), radial-gradient(circle at top right, rgba(47,92,127,0.05), transparent 22%), rgba(10,10,15,0.28)',
              }}
            >
              <div
                style={{
                  alignSelf: 'center',
                  padding: '7px 12px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#C7D2E0',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Historique local actif
              </div>

              {messages.map((message) => renderMessage(message))}

              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #C96A4A, #A94D31)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <RiRobot2Line size={16} color="#fff" />
                  </div>

                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '20px 20px 20px 6px',
                      background: 'rgba(255,255,255,0.08)',
                      display: 'flex',
                      gap: 6,
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'assistantBounce 1.4s infinite' }} />
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'assistantBounce 1.4s 0.2s infinite' }} />
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'assistantBounce 1.4s 0.4s infinite' }} />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </section>
        </section>
      </main>

      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: composerBottom,
          zIndex: 1000,
          padding: '12px 16px',
          background: 'rgba(10,10,15,0.92)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '320px minmax(0, 1fr)',
            gap: 24,
          }}
        >
          {!isMobile && <div />}

          <div style={{ display: 'flex', gap: 12 }}>
            <div
              style={{
                flex: 1,
                padding: '10px 12px 8px',
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.05)',
              }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Pose une question ou colle une serie avec des notes..."
                style={{
                  width: '100%',
                  minHeight: 28,
                  maxHeight: 140,
                  resize: 'none',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  marginTop: 6,
                  color: '#94a3b8',
                  fontSize: 11,
                }}
              >
                <span>Exemple : Serie D, SVT 15, CHIMIE 13, MATH 12</span>
                {!isMobile && <span>{seriesLoading ? 'Series en chargement...' : 'Simulation automatique active'}</span>}
              </div>
            </div>

            <button
              type="button"
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                border: 'none',
                background: input.trim()
                  ? 'linear-gradient(135deg, #C96A4A, #A94D31)'
                  : 'rgba(255,255,255,0.08)',
                color: '#fff',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: input.trim() ? '0 18px 38px rgba(201,106,74,0.24)' : 'none',
              }}
            >
              <IoSend size={19} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes assistantBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.45; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes assistantOrbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes assistantOrbitReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes assistantSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
