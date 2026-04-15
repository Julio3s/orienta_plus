import { useEffect, useRef, useState } from 'react'

const TOTAL_DURATION_MS = 4600
const EXIT_DURATION_MS = 450

const INTRO_LINES = [
  'Lis tes notes.',
  'Visualise les options.',
  'Trouve ton cap.',
]

const INTRO_TAGS = ['Series', 'Filieres', 'Bourses']

export default function AnimationIntro({ onComplete }) {
  const [visible, setVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  const doneRef = useRef(false)
  const timersRef = useRef([])

  const clearTimers = () => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    timersRef.current = []
  }

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    clearTimers()
    setVisible(false)
    onComplete?.()
  }

  const triggerExit = () => {
    if (doneRef.current || isExiting) return

    clearTimers()
    setIsExiting(true)

    timersRef.current = [
      window.setTimeout(() => {
        finish()
      }, EXIT_DURATION_MS),
    ]
  }

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      timersRef.current = [
        window.setTimeout(() => {
          finish()
        }, 120),
      ]

      return () => {
        clearTimers()
      }
    }

    timersRef.current = [
      window.setTimeout(() => {
        setIsExiting(true)
      }, TOTAL_DURATION_MS - EXIT_DURATION_MS),
      window.setTimeout(() => {
        finish()
      }, TOTAL_DURATION_MS),
    ]

    return () => {
      clearTimers()
    }
  }, [])

  if (!visible) return null

  return (
    <div className={`intro-shell${isExiting ? ' is-exiting' : ''}`}>
      <div className="intro-aurora intro-aurora-a" />
      <div className="intro-aurora intro-aurora-b" />
      <div className="intro-aurora intro-aurora-c" />
      <div className="intro-grid" />

      <div className="intro-frame">
        <div className="intro-card">
          <div className="intro-badge">Orientation universitaire au Benin</div>

          <div className="intro-layout">
            <div className="intro-visual">
              <div className="intro-orbit">
                <span className="intro-ring intro-ring-a" />
                <span className="intro-ring intro-ring-b" />
                <span className="intro-ring intro-ring-c" />
                <span className="intro-axis" />
                <span className="intro-node intro-node-a" />
                <span className="intro-node intro-node-b" />
                <span className="intro-node intro-node-c" />
                <span className="intro-core">O+</span>
              </div>

              <div className="intro-tags" aria-hidden="true">
                {INTRO_TAGS.map((tag, index) => (
                  <span
                    key={tag}
                    className="intro-tag"
                    style={{ animationDelay: `${0.95 + index * 0.16}s` }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="intro-copy">
              <div className="intro-kicker">ORIENTA+</div>

              <div className="intro-lines" aria-label="Sequence d'introduction">
                {INTRO_LINES.map((line, index) => (
                  <div
                    key={line}
                    className="intro-line"
                    style={{ animationDelay: `${0.3 + index * 0.24}s` }}
                  >
                    {line}
                  </div>
                ))}
              </div>

              <p className="intro-subtitle">
                Une entree plus nette, plus calme, et beaucoup plus elegante.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="intro-progress" aria-hidden="true">
        <span className="intro-progress-bar" />
      </div>

      <button type="button" className="intro-skip" onClick={triggerExit}>
        Passer
      </button>
    </div>
  )
}
