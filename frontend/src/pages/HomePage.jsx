import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { FiBarChart2, FiBookOpen, FiCamera, FiDollarSign, FiTarget } from 'react-icons/fi'
import { MdAccountBalance } from 'react-icons/md'
import studentsOutdoor from '../assets/home/students-outdoor.jpg'
import studyLaptop from '../assets/home/study-laptop.jpg'
import africanStudentsGroup from '../assets/home/slides/african-students-group.jpg'
import africanGraduate from '../assets/home/slides/african-graduate.jpg'
import africanStudentPortrait from '../assets/home/slides/african-student-portrait.jpg'

const HOME_INTRO_STORAGE_KEY = 'orienta_home_intro_seen'
const INDIGO = '#2F5C7F'
const PALM = '#6E9B73'
const CORAL = '#C96A4A'
const GOLD = '#D6A45B'

const HOME_BACKGROUND_SLIDES = [
  africanStudentsGroup,
  africanGraduate,
  africanStudentPortrait,
  studentsOutdoor,
  studyLaptop,
]

function readIntroState() {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(HOME_INTRO_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function markIntroSeen() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(HOME_INTRO_STORAGE_KEY, 'true')
  } catch {}
}

const PROBLEM_STATS = [
  { value: '70%', label: 'des bacheliers béninois', detail: 'se sentent perdus face à l\'offre de formation', color: CORAL },
  { value: '13+', label: 'universités', detail: 'publiques et privées, sans vision claire', color: INDIGO },
  { value: '80+', label: 'filières', detail: 'difficiles à comparer entre elles', color: GOLD },
  { value: '4 villes', label: 'Cotonou, Calavi, Porto-Novo, Parakou', detail: 'mais aucun outil pour choisir', color: PALM },
]

const HOW_IT_WORKS = [
  { step: '1', title: 'Je renseigne ma série et mes notes', text: 'Le projet commence par là : savoir qui vous êtes, ce que vous avez au bac, et ce que vous cherchez.' },
  { step: '2', title: 'La plateforme filtre les possibles', text: 'ORIENTA+ croise les seuils d\'admission, les bourses et les débouchés pour ne garder que ce qui est réaliste.' },
  { step: '3', title: 'Je compare et je décide', text: 'Universités, filières, coûts, salaires à la sortie — tout est là pour choisir en connaissance de cause.' },
]

const WHAT_YOU_GET = [
  { title: 'Filières avec des vrais débouchés', text: 'Pas une liste de matières. On vous dit : "voici ce que vous apprenez, voici les métiers possibles, voici ce qu\'on gagne au Bénin."', icon: FiTarget },
  { title: 'Seuils clairs (admission, bourses)', text: 'Selon votre série et vos notes, la plateforme vous montre si vous êtes admissible, éligible à la demi-bourse ou à la bourse complète.', icon: FiBarChart2 },
  { title: 'Comparaison universités', text: 'Publique ou privée ? Cotonou ou Parakou ? Frais de scolarité, logement, vie sur place — on vous aide à peser le pour et le contre.', icon: MdAccountBalance },
  { title: 'Salaires de sortie (FCFA)', text: 'Développeur, médecin, juriste, ingénieur : on vous donne des fourchettes de salaire réelles pour savoir où vous allez.', icon: FiDollarSign },
]

const JOBS_PREVIEW = [
  { role: 'Développeur full-stack', salary: '400–800k FCFA', detail: 'MTN, startups, freelancing' },
  { role: 'Médecin généraliste', salary: '500k–1.2M FCFA', detail: 'CHU, cliniques privées, ONG' },
  { role: 'Analyste financier', salary: '300–700k FCFA', detail: 'BOA, BCEAO, microfinance' },
  { role: 'Ingénieur BTP', salary: '350–800k FCFA', detail: 'SOGEA, bureaux d\'études' },
  { role: 'Pharmacien', salary: '400k–1M FCFA', detail: 'Officines, industrie pharma' },
  { role: 'Juriste d\'entreprise', salary: '350–600k FCFA', detail: 'Banques, assurances, ONG' },
]

// Animation d'entrée minimaliste et rapide
function QuickIntro({ onComplete }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 300)
          return 100
        }
        return prev + 6
      })
    }, 20)
    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#050508', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
    }}>
      <div style={{
        width: 80, height: 80,
        background: `linear-gradient(135deg, ${CORAL}, ${INDIGO})`,
        borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
      }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>O+</span>
      </div>
      <div style={{ width: 160, height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, ${CORAL}, ${INDIGO})`, transition: 'width 0.02s linear' }} />
      </div>
    </div>
  )
}

function BackgroundSlideshow({ images, intervalMs = 6500, fadeMs = 1200 }) {
  const [index, setIndex] = useState(0)
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setIsReducedMotion(!!mq.matches)
    apply()
    mq.addEventListener?.('change', apply)
    return () => mq.removeEventListener?.('change', apply)
  }, [])

  useEffect(() => {
    if (!images?.length) return
    if (isReducedMotion || images.length <= 1) return

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [images, intervalMs, isReducedMotion])

  if (!images?.length) return null

  const current = images[index % images.length]
  const next = images[(index + 1) % images.length]

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${current})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: 'scale(1.04)',
          filter: 'saturate(0.9) contrast(1.05) brightness(0.55)',
        }}
      />

      {!isReducedMotion && images.length > 1 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${next})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: 'scale(1.04)',
            filter: 'saturate(0.9) contrast(1.05) brightness(0.55)',
            opacity: 0,
            animation: `home-bg-fade ${intervalMs}ms ease-in-out infinite`,
          }}
        />
      )}

      {/* Teinte + vignette pour un rendu "vidéo" */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            `linear-gradient(180deg, rgba(5,5,10,0.78) 0%, rgba(5,5,10,0.92) 70%, rgba(5,5,10,0.98) 100%),` +
            `radial-gradient(circle at 18% 18%, rgba(201,106,74,0.14), transparent 40%),` +
            `radial-gradient(circle at 82% 16%, rgba(47,92,127,0.12), transparent 42%)`,
        }}
      />

      <style>{`
        @keyframes home-bg-fade {
          0%   { opacity: 0; }
          16%  { opacity: 1; }
          50%  { opacity: 1; }
          66%  { opacity: 0; }
          100% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes home-bg-fade { 0% { opacity: 0; } 100% { opacity: 0; } }
        }
      `}</style>
    </div>
  )
}

export default function HomePage() {
  const [animDone, setAnimDone] = useState(() => readIntroState())

  useEffect(() => {
    if (!animDone) return
    const hash = window.location.hash.replace('#', '')
    if (!hash) return
    setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 180)
  }, [animDone])

  const scrollTo = (id) => {
    window.history.replaceState(null, '', `#${id}`)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      {!animDone && <QuickIntro onComplete={() => { markIntroSeen(); setAnimDone(true) }} />}

      {animDone && (
        <div style={{ background: '#05050A', minHeight: '100vh', color: '#fff' }}>
          <Navbar />

          {/* Boucle de photos en background (effet vidéo) */}
          <BackgroundSlideshow images={HOME_BACKGROUND_SLIDES} />

          {/* Effet de grain subtil en overlay */}
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            pointerEvents: 'none', zIndex: 1,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          }} />

          {/* ===== HERO ===== */}
          <section style={{ maxWidth: 1280, margin: '0 auto', padding: '120px 24px 80px', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 60, alignItems: 'center' }}>
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: `rgba(201,106,74,0.1)`, border: `1px solid ${CORAL}20`,
                  borderRadius: 100, padding: '6px 16px 6px 12px', marginBottom: 28,
                }}>
                  <span style={{ fontSize: 16 }}>🇧🇯</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: CORAL }}>Orientation post-bac Bénin</span>
                </div>
                <h1 style={{
                  fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 800,
                  fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.03em',
                  margin: '0 0 24px', lineHeight: 1.1,
                }}>
                  Choisir sa filière,<br />
                  <span style={{ background: `linear-gradient(135deg, ${CORAL}, ${INDIGO}, ${GOLD})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                    ce n'est pas un sondage au hasard
                  </span>
                </h1>
                <p style={{ fontSize: 17, color: '#8A8F99', lineHeight: 1.6, marginBottom: 36, maxWidth: 520 }}>
                  ORIENTA+ vous aide à passer des notes du bac à une décision concrète : 
                  université, filière, bourses, débouchés et salaires au Bénin.
                </p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <Link to="/orientation" style={{
                    background: `linear-gradient(135deg, ${CORAL}, #A94D31)`,
                    color: '#fff', padding: '14px 36px', borderRadius: 48,
                    textDecoration: 'none', fontWeight: 600, fontSize: 15,
                    boxShadow: `0 8px 20px -8px ${CORAL}40`,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 28px -10px ${CORAL}60` }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 8px 20px -8px ${CORAL}40` }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                      <FiTarget size={18} />
                      Simuler mon orientation
                    </span>
                  </Link>
                  <button onClick={() => scrollTo('probleme')} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#B0B5C0', padding: '14px 28px', borderRadius: 48, cursor: 'pointer',
                    fontSize: 15, fontWeight: 500, transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = `${CORAL}40` }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                      <FiBookOpen size={18} />
                      Comprendre le projet
                    </span>
                  </button>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <div style={{
                  background: `linear-gradient(135deg, ${CORAL}10, ${INDIGO}10)`,
                  borderRadius: 32, padding: 12,
                  border: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <img src={africanStudentsGroup} alt="Étudiants béninois" style={{ width: '100%', borderRadius: 24, display: 'block' }} />
                </div>
                <div style={{
                  position: 'absolute', bottom: -20, right: -20,
                  background: '#05050A', border: `1px solid ${CORAL}20`, borderRadius: 16,
                  padding: '12px 20px',
                  backdropFilter: 'var(--blur-hero-chip, blur(20px))',
                }}>
                  <div style={{ fontSize: 13, color: '#8A8F99', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <FiCamera size={14} />
                    Des élèves, des vrais parcours
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== PROBLÈME ===== */}
          <section id="probleme" style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', position: 'relative', zIndex: 2 }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{
                display: 'inline-block', background: `rgba(110,155,115,0.1)`, border: `1px solid ${PALM}20`,
                borderRadius: 100, padding: '5px 14px', marginBottom: 20,
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: PALM }}>Le constat</span>
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Aujourd'hui, trop de bacheliers choisissent à l'aveugle</h2>
              <p style={{ fontSize: 16, color: '#8A8F99', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
                Parce que l'information est éparpillée, parce que les seuils ne sont pas clairs, 
                parce qu'on ne sait pas ce qu'on gagnera après.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              {PROBLEM_STATS.map((stat) => (
                <div key={stat.label} style={{
                  background: 'rgba(255,255,255,0.02)', border: `1px solid ${stat.color}15`,
                  borderRadius: 24, padding: '28px 20px', textAlign: 'center',
                  transition: 'transform 0.2s, border-color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = `${stat.color}40` }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = `${stat.color}15` }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: stat.color, marginBottom: 12, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#E8EDF5' }}>{stat.label}</div>
                  <div style={{ color: '#6B7280', fontSize: 13 }}>{stat.detail}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ===== SOLUTION ===== */}
          <section style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', position: 'relative', zIndex: 2 }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{
                display: 'inline-block', background: `rgba(201,106,74,0.1)`, border: `1px solid ${CORAL}20`,
                borderRadius: 100, padding: '5px 14px', marginBottom: 20,
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: CORAL }}>La solution</span>
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Ce que ORIENTA+ vous apporte concrètement</h2>
              <p style={{ fontSize: 16, color: '#8A8F99', maxWidth: 560, margin: '0 auto' }}>Pas de discours. Des outils. Des chiffres. Des comparaisons.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 24 }}>
              {WHAT_YOU_GET.map((item, i) => (
                <div key={item.title} style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 28, padding: '30px 24px', transition: 'all 0.25s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = `${CORAL}25`; e.currentTarget.style.transform = 'translateY(-4px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  <div style={{ marginBottom: 20, color: CORAL }}>
                    <item.icon size={44} />
                  </div>
                  <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.01em' }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: '#8A8F99', lineHeight: 1.6, margin: 0 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ===== FONCTIONNEMENT ===== */}
          <section style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', position: 'relative', zIndex: 2 }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{
                display: 'inline-block', background: `rgba(47,92,127,0.1)`, border: `1px solid ${INDIGO}20`,
                borderRadius: 100, padding: '5px 14px', marginBottom: 20,
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: INDIGO }}>En 3 étapes</span>
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Comment ORIENTA+ vous guide</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
              {HOW_IT_WORKS.map((step) => (
                <div key={step.step} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 64, height: 64, margin: '0 auto 24px',
                    background: `linear-gradient(135deg, ${CORAL}15, ${INDIGO}15)`, borderRadius: 80,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, fontWeight: 700, color: CORAL, border: `1px solid ${CORAL}20`,
                  }}>{step.step}</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{step.title}</h3>
                  <p style={{ fontSize: 14, color: '#8A8F99', lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>{step.text}</p>
                  {step.step !== '3' && (
                    <div style={{ marginTop: 24, color: '#2A2E3A', fontSize: 24 }}>↓</div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ===== MÉTIERS ===== */}
          <section style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', position: 'relative', zIndex: 2 }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{
                display: 'inline-block', background: `rgba(214,164,91,0.1)`, border: `1px solid ${GOLD}20`,
                borderRadius: 100, padding: '5px 14px', marginBottom: 20,
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: GOLD }}>Pourquoi on le fait</span>
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Des métiers qui recrutent au Bénin</h2>
              <p style={{ fontSize: 16, color: '#8A8F99', maxWidth: 560, margin: '0 auto' }}>Chaque filière est reliée à des débouchés réels et des salaires de marché.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {JOBS_PREVIEW.map((job) => (
                <div key={job.role} style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 20, padding: '20px 24px', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = `${GOLD}25` }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}>
                  <div style={{ fontWeight: 600, color: '#E8EDF5', marginBottom: 8 }}>{job.role}</div>
                  <div style={{ color: GOLD, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{job.salary}</div>
                  <div style={{ color: '#6B7280', fontSize: 13 }}>{job.detail}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ===== CTA FINAL ===== */}
          <section style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 24px 100px', position: 'relative', zIndex: 2 }}>
            <div style={{
              background: `linear-gradient(135deg, ${CORAL}08, ${INDIGO}08)`,
              border: `1px solid rgba(255,255,255,0.05)`, borderRadius: 56, padding: '64px 32px', textAlign: 'center',
            }}>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Prêt à y voir plus clair ?</h2>
              <p style={{ fontSize: 16, color: '#8A8F99', marginBottom: 36, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
                Simulation, comparaison, débouchés — tout est là pour choisir sans stress.
              </p>
              <Link to="/orientation" style={{
                background: `linear-gradient(135deg, ${CORAL}, #A94D31)`,
                color: '#fff', padding: '16px 44px', borderRadius: 60, textDecoration: 'none',
                fontWeight: 600, fontSize: 16, display: 'inline-block',
                boxShadow: `0 8px 24px -8px ${CORAL}60`,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 14px 32px -10px ${CORAL}80` }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 8px 24px -8px ${CORAL}60` }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <FiTarget size={18} />
                  Commencer la simulation
                </span>
              </Link>
            </div>
          </section>

          {/* ===== FOOTER ===== */}
          <footer style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '48px 24px 56px', textAlign: 'center', position: 'relative', zIndex: 2 }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
              <div style={{ fontSize: 14, color: '#5A6070', marginBottom: 24 }}>🇧🇯 ORIENTA+ — Orientation universitaire Bénin</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', marginBottom: 32 }}>
                <Link to="/orientation" style={{ color: '#7A8090', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = CORAL} onMouseLeave={e => e.currentTarget.style.color = '#7A8090'}>Simulation</Link>
                <Link to="/universites" style={{ color: '#7A8090', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = CORAL} onMouseLeave={e => e.currentTarget.style.color = '#7A8090'}>Universités</Link>
                <Link to="/filieres" style={{ color: '#7A8090', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = CORAL} onMouseLeave={e => e.currentTarget.style.color = '#7A8090'}>Filières</Link>
              </div>
              <div style={{ fontSize: 12, color: '#3A3E4A' }}>© 2026 ORIENTA+ — Aider les bacheliers béninois à choisir leur avenir</div>
            </div>
          </footer>
        </div>
      )}
    </>
  )
}