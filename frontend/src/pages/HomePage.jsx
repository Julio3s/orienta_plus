import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import heroCampus from '../assets/home/hero-campus.jpg'
import studentsOutdoor from '../assets/home/students-outdoor.jpg'
import studyLaptop from '../assets/home/study-laptop.jpg'
import africanStudentsGroup from '../assets/home/slides/african-students-group.jpg'
import africanGraduate from '../assets/home/slides/african-graduate.jpg'
import africanStudentPortrait from '../assets/home/slides/african-student-portrait.jpg'
import universityGhanaTower from '../assets/home/slides/university-ghana-tower.jpg'
import universityGhanaAerial from '../assets/home/slides/university-ghana-aerial.jpg'

const HOME_INTRO_STORAGE_KEY = 'orienta_home_intro_seen'

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
  } catch {
    // Ignore storage issues and keep the page usable.
  }
}

const PLATFORM_STATS = [
  { value: '13+', label: 'Universités référencées', detail: 'publiques et privées', color: '#10B981' },
  { value: '13+', label: 'Filières expliquées', detail: 'durée, débouchés, métiers', color: '#3B82F6' },
  { value: '3 niveaux', label: 'Seuils clarifiés', detail: 'admission, demi-bourse, bourse', color: '#F59E0B' },
  { value: '1 outil', label: 'Parcours guidé', detail: 'série, notes, compatibilité', color: '#a78bfa' },
]

const FEATURE_CARDS = [
  {
    index: '01',
    icon: '',
    title: "Comprendre l'offre avant de choisir",
    text: 'ORIENTA+ regroupe les universités, les villes, les statuts public ou privé et les parcours proposés pour éviter une recherche éparpillée.',
    color: '#10B981',
  },
  {
    index: '02',
    icon: '📚',
    title: 'Lire les filières avec plus de concret',
    text: "Chaque filière est reliée à sa durée, à ses débouchés, à des métiers possibles et aux informations utiles pour juger si elle colle vraiment au projet de l'élève.",
    color: '#3B82F6',
  },
  {
    index: '03',
    icon: '',
    title: 'Passer des notes à des pistes réelles',
    text: "La plateforme relie les notes du bac aux seuils d'admission, à la demi-bourse, à la bourse complète et aux frais pour aider à décider sans brouillard.",
    color: '#F59E0B',
  },
]

const PROJECT_POINTS = [
  "Le projet s'adresse d'abord aux nouveaux bacheliers qui cherchent une orientation post-bac plus lisible au Bénin.",
  'Il aide aussi les parents, enseignants et conseillers à discuter sur une base concrète, avec des informations structurées et comparables.',
  "ORIENTA+ ne choisit pas à la place de l'élève : il remet de la clarté dans le parcours de décision.",
]

const NAVIGATION_CARDS = [
  {
    to: '/',
    icon: '',
    title: 'Simuler mon orientation',
    text: 'Saisir la série et les notes du bac pour faire ressortir des filières compatibles et des seuils utiles.',
    cta: 'Commencer la simulation',
    color: '#10B981',
  },
  {
    to: '/universites',
    icon: '',
    title: 'Parcourir les universités',
    text: "Comparer les établissements, leurs localisations, leurs statuts et les filières qu'ils proposent.",
    cta: 'Explorer les universités',
    color: '#3B82F6',
  },
  {
    to: '/filieres',
    icon: '📖',
    title: 'Explorer les filières',
    text: 'Lire les parcours, les débouchés concrets et les métiers associés avant de se positionner.',
    cta: 'Voir les filières',
    color: '#a78bfa',
  },
]

const JOBS_PREVIEW = [
  { role: 'Développeur full-stack', salary: '400–800k FCFA', employer: 'MTN, startups numériques' },
  { role: 'Médecin généraliste', salary: '500k–1.2M FCFA', employer: 'CHU, cliniques privées' },
  { role: 'Analyste financier', salary: '300–700k FCFA', employer: 'BOA, BCEAO, microfinance' },
  { role: 'Ingénieur BTP', salary: '350–800k FCFA', employer: 'SOGEA, DG Eau et Forêts' },
  { role: 'Pharmacien', salary: '400k–1M FCFA', employer: 'Officines, CAME' },
  { role: "Juriste d'entreprise", salary: '350–600k FCFA', employer: 'Banques, ONG internationales' },
]

const HOME_GALLERY = [
  { src: africanStudentsGroup, label: 'Élèves africains' },
  { src: universityGhanaTower, label: 'Campus universitaire' },
  { src: africanGraduate, label: 'Réussite académique' },
  { src: universityGhanaAerial, label: 'Vue de campus' },
  { src: africanStudentPortrait, label: 'Portrait étudiant' },
  { src: heroCampus, label: 'Patrimoine universitaire' },
  { src: studentsOutdoor, label: 'Vie étudiante' },
  { src: studyLaptop, label: 'Simulation ORIENTA+' },
]

// Nouvelle animation de début style "loading créatif"
function CreativeIntro({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    // Animation de chargement progressive
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 2
      })
    }, 20)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (progress === 100) {
      setTimeout(() => {
        onComplete()
      }, 3000)
    }
  }, [progress, onComplete])

  useEffect(() => {
    const phases = [0, 1, 2]
    let index = 0
    const interval = setInterval(() => {
      index++
      if (index < phases.length) {
        setPhase(index)
      } else {
        clearInterval(interval)
      }
    }, 600)
    return () => clearInterval(interval)
  }, [])

  const messages = [
    { text: "Initialisation du parcours", icon: "" },
    { text: "Analyse des opportunités", icon: "" },
    { text: "Prêt à vous guider", icon: "" },
  ]

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#0a0a0f',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
    }}>
      {/* Logo avec effet 3D */}
      <div style={{
        width: 140,
        height: 140,
        marginBottom: 40,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #10b981, #059669)',
          borderRadius: 36,
          transform: 'rotate(0deg)',
          animation: 'spin3d 2s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          inset: 4,
          background: '#0a0a0f',
          borderRadius: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            fontSize: 56,
            fontWeight: 800,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            background: 'linear-gradient(135deg, #10b981, #3b82f6)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}>O+</span>
        </div>
      </div>

      {/* Message animé */}
      <div style={{
        fontSize: 'clamp(18px, 4vw, 24px)',
        fontWeight: 600,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: '#fff',
        marginBottom: 30,
        textAlign: 'center',
        minHeight: 80,
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              position: phase === idx ? 'relative' : 'absolute',
              opacity: phase === idx ? 1 : 0,
              transform: phase === idx ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {msg.icon} {msg.text}
          </div>
        ))}
      </div>

      {/* Barre de progression créative */}
      <div style={{
        width: 280,
        height: 4,
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #10b981, #3b82f6, #a78bfa)',
          borderRadius: 4,
          transition: 'width 0.02s linear',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            right: 0,
            top: -2,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 10px #10b981',
          }} />
        </div>
      </div>

      <style>{`
        @keyframes spin3d {
          0%, 100% {
            transform: rotate(0deg) scale(1);
            opacity: 0.8;
          }
          50% {
            transform: rotate(180deg) scale(1.05);
            opacity: 1;
          }
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
    const id = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 180)
    return () => clearTimeout(id)
  }, [animDone])

  const scrollTo = (id) => {
    window.history.replaceState(null, '', `#${id}`)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const galleryTrackA = [...HOME_GALLERY, ...HOME_GALLERY]
  const galleryTrackB = [...HOME_GALLERY.slice(2), ...HOME_GALLERY.slice(0, 2)]
  const galleryTrackBLoop = [...galleryTrackB, ...galleryTrackB]

  const styles = {
    titleFont: {
      fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    bodyFont: {
      fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif",
      fontWeight: 400,
    },
    label: {
      display: 'inline-block',
      marginBottom: 16,
      background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.15))',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 100,
      padding: '6px 18px',
      color: '#10b981',
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      fontFamily: "'Inter', sans-serif",
      backdropFilter: 'blur(10px)',
    },
    sectionTitle: {
      margin: '0 0 16px',
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontWeight: 700,
      fontSize: 'clamp(28px, 4vw, 42px)',
      color: '#ffffff',
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    sectionText: {
      margin: '0 0 28px',
      color: '#a0aec0',
      fontSize: 16,
      lineHeight: 1.7,
      maxWidth: 560,
      fontFamily: "'Inter', sans-serif",
      fontWeight: 400,
    },
    card: {
      background: 'rgba(255,255,255,0.03)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 24,
      padding: '28px',
      transition: 'all 0.3s ease',
    },
    section: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '80px 24px',
    },
  }

  const handleIntroComplete = () => {
    markIntroSeen()
    setAnimDone(true)
  }

  return (
    <>
      {!animDone && <CreativeIntro onComplete={handleIntroComplete} />}

      {animDone && (
        <div className="home-shell public-page-shell" style={{ position: 'relative', minHeight: '100vh', background: '#0a0a0f' }}>
          {/* Background Gallery */}
          <div className="home-background-gallery" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
            <div className="home-gallery-row" style={{ width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: 20, opacity: 0.4 }}>
              <div className="home-gallery-track" style={{ display: 'inline-flex', gap: 20, animation: 'scrollHorizontal 45s linear infinite' }}>
                {galleryTrackA.map((slide, index) => (
                  <div key={`a-${index}`} style={{ width: 280, height: 180, borderRadius: 20, overflow: 'hidden', background: '#1a1a24', display: 'inline-block' }}>
                    <img src={slide.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="home-gallery-row" style={{ width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', opacity: 0.4 }}>
              <div className="home-gallery-track" style={{ display: 'inline-flex', gap: 20, animation: 'scrollHorizontalReverse 50s linear infinite' }}>
                {galleryTrackBLoop.map((slide, index) => (
                  <div key={`b-${index}`} style={{ width: 280, height: 240, borderRadius: 20, overflow: 'hidden', background: '#1a1a24', display: 'inline-block' }}>
                    <img src={slide.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <style>{`
            @keyframes scrollHorizontal {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            @keyframes scrollHorizontalReverse {
              0% { transform: translateX(-50%); }
              100% { transform: translateX(0); }
            }
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .fade-up {
              animation: fadeInUp 0.6s ease forwards;
            }
            .gradient-text {
              background: linear-gradient(135deg, #10b981, #3b82f6, #a78bfa);
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
            }
          `}</style>

          <div className="home-backdrop-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 20% 30%, rgba(10,10,15,0.7), rgba(5,5,10,0.95))', zIndex: 1, pointerEvents: 'none' }} />
          
          <Navbar />

          {/* Hero Section avec grand message d'accueil */}
          <section style={{ ...styles.section, paddingTop: 100, position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 60, alignItems: 'center' }}>
              <div className="fade-up">
                {/* GRAND H2 d'accueil */}
                <h2 style={{
                  fontSize: 'clamp(42px, 6vw, 72px)',
                  fontWeight: 800,
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  lineHeight: 1.1,
                  marginBottom: 20,
                  color: '#fff',
                  letterSpacing: '-0.03em',
                }}>
                  <span className="gradient-text"> ORIENTA+</span>
                </h2>
                
                {/* Paragraphe d'accueil */}
                <p style={{
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  lineHeight: 1.6,
                  color: '#94a3b8',
                  marginBottom: 32,
                  maxWidth: 520,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  La plateforme qui vous aide à transformer votre parcours scolaire en opportunités 
                  d'études supérieures claires et accessibles au Bénin.
                </p>

                <span style={styles.label}></span>
                <h4 style={{ ...styles.titleFont, margin: '0 0 24px', fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.15, color: '#fff' }}>
                  Comprendre ses options<br />
                  <span className="gradient-text">avant de choisir une filière.</span>
                </h4>
                <p style={styles.sectionText}>
                  ORIENTA+ rassemble universités, filières, seuils d'admission, bourses, frais et débouchés pour une orientation éclairée.
                </p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}>
                  <Link
                    to="/orientation"
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      borderRadius: 14,
                      padding: '14px 32px',
                      textDecoration: 'none',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      fontSize: 15,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      display: 'inline-block',
                    }}
                  >
                     Commencer la simulation
                  </Link>
                  <button
                    onClick={() => scrollTo('projet')}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#cbd5e1',
                      borderRadius: 14,
                      padding: '14px 28px',
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 15,
                      fontWeight: 500,
                      transition: 'all 0.2s',
                    }}
                  >
                    📖 En savoir plus
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  {PLATFORM_STATS.map((s) => (
                    <div
                      key={s.label}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${s.color}20`,
                        borderRadius: 20,
                        padding: '20px',
                      }}
                    >
                      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 32, color: s.color, lineHeight: 1, marginBottom: 8 }}>
                        {s.value}
                      </div>
                      <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                      <div style={{ color: '#64748b', fontSize: 12 }}>{s.detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image principale */}
              <div className="fade-up" style={{ animationDelay: '0.1s' }}>
                <div style={{ position: 'relative', borderRadius: 32, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                  <img src={africanStudentsGroup} alt="Étudiants africains" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', padding: '24px' }}>
                    <p style={{ color: '#fff', fontSize: 14, margin: 0, fontFamily: "'Inter', sans-serif" }}>📍 Campus universitaire — Découvrir l'offre de formation</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section Projet - gardée identique */}
          <section id="projet" style={{ ...styles.section, borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 60, alignItems: 'center' }}>
              <div>
                <div style={{ borderRadius: 28, overflow: 'hidden', marginBottom: 28 }}>
                  <img src={universityGhanaAerial} alt="Campus aérien" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
                <div style={{ ...styles.card, background: 'rgba(59,130,246,0.05)', borderColor: 'rgba(59,130,246,0.15)' }}>
                  <div style={{ color: '#60a5fa', fontWeight: 600, fontSize: 13, marginBottom: 8, fontFamily: "'Inter', sans-serif" }}>🎓</div>
                  <div style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>L'offre de formation, le choix de vie, et la simulation : trois angles pour accompagner une décision qui engage plusieurs années.</div>
                </div>
              </div>

              <div>
                <span style={styles.label}> Projet ORIENTA+</span>
                <h2 style={styles.sectionTitle}>Une plateforme qui aide à passer d'une question floue à une décision mieux documentée.</h2>
                <p style={styles.sectionText}>
                  Beaucoup d'élèves cherchent une filière ou une université avec des informations fragmentaires. ORIENTA+ restructure ces données pour proposer un point d'entrée plus fiable.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {PROJECT_POINTS.map((point, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                      </div>
                      <span style={{ color: '#cbd5e1', fontSize: 15, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Le reste de la page (Features, métiers, navigation, footer) reste identique */}
          <section style={{ ...styles.section, borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 2 }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span style={styles.label}> Ce que contient la plateforme</span>
              <h2 style={{ ...styles.sectionTitle, marginTop: 12, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
                L'accueil présente le service avant de demander une action.
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {FEATURE_CARDS.map((f, i) => (
                <div key={f.index} style={{ ...styles.card, borderTop: `3px solid ${f.color}` }}>
                  <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 14, color: f.color, marginBottom: 12, letterSpacing: 1 }}>{f.index}</div>
                  <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 12 }}>{f.title}</h3>
                  <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7, fontFamily: "'Inter', sans-serif", margin: 0 }}>{f.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section style={{ ...styles.section, borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 2 }}>
            <div style={{ marginBottom: 48 }}>
              <span style={styles.label}>💼 Des métiers qui recrutent</span>
              <h2 style={{ ...styles.sectionTitle, marginTop: 12 }}>Des exemples concrets de postes au Bénin.</h2>
              <p style={styles.sectionText}>Chaque filière est associée à des postes réels, avec des employeurs béninois et des salaires de marché en FCFA.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
              {JOBS_PREVIEW.map((j, i) => (
                <div key={i} style={{ ...styles.card }}>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 8, fontFamily: "'Inter', sans-serif" }}>{j.role}</div>
                  <div style={{ color: '#fbbf24', fontSize: 14, fontFamily: "'Inter', sans-serif", marginBottom: 6, fontWeight: 500 }}>{j.salary}</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>📍 {j.employer}</div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ ...styles.section, borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 2 }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span style={styles.label}>Parcours dans la plateforme</span>
              <h2 style={{ ...styles.sectionTitle, marginTop: 12 }}>Chaque page a un rôle clair dans l'expérience.</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {NAVIGATION_CARDS.map((card, i) => (
                <div key={card.to} style={{ ...styles.card, borderBottom: `2px solid ${card.color}` }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>{card.icon}</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 12, color: card.color, marginBottom: 12 }}>0{i + 1}</div>
                  <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 12 }}>{card.title}</h3>
                  <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{card.text}</p>
                  <Link to={card.to} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: card.color, textDecoration: 'none', fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14 }}>
                    {card.cta} →
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '48px 24px 36px', background: '#0a0a0f', position: 'relative', zIndex: 2 }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 50, height: 50, background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 24, color: '#fff' }}>O+</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: '#fff' }}>ORIENTA+ — Orientation universitaire Bénin 🇧🇯</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Guider les visiteurs vers la simulation, les universités et les filières.</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 32 }}>
                <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Simulation</Link>
                <Link to="/universites" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Universités</Link>
                <Link to="/filieres" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Filières</Link>
                <Link to="/admin/login" style={{ color: '#475569', textDecoration: 'none', fontSize: 14 }}>Admin</Link>
              </div>
              <Link to="/orientation" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '12px 28px', borderRadius: 40, color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Commencer la simulation</Link>
            </div>
          </footer>
        </div>
      )}
    </>
  )
}
