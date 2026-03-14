import { useState, useEffect } from 'react'
import { useHomily } from '../../context/HomilyContext'
import { LECTIO_PROMPTS } from '../../data/lectionary'
import { fetchAllReadings } from '../../lib/bibleApi'
import SectionHeader from '../ui/SectionHeader'
import TextArea from '../ui/TextArea'
import PromptCard from '../ui/PromptCard'
import ReadingsPanel from '../ui/ReadingsPanel'
import AmbientPlayer from '../ui/AmbientPlayer'
import { RotateCcw, BookOpen, Eye, Heart, Sparkles, CornerDownLeft } from 'lucide-react'

// Phase → state key mapping (TheTurn needs special key)
const PHASE_STATE_KEY = {
  lectio: 'lectio',
  meditatio: 'meditatio',
  oratio: 'oratio',
  contemplatio: 'contemplatio',
  theturn: 'theTurn',
}

// Clean line icons for each Lectio Divina phase
const PHASE_ICON_MAP = {
  Lectio:       BookOpen,
  Meditatio:    Eye,
  Oratio:       Heart,
  Contemplatio: Sparkles,
  TheTurn:      CornerDownLeft,
}

function PhaseIcon({ phase, size = 16 }) {
  const Icon = PHASE_ICON_MAP[phase]
  return Icon ? <Icon size={size} strokeWidth={1.5} /> : null
}

export default function Step3Lectio() {
  const { state, dispatch } = useHomily()
  const [activePhase, setActivePhase] = useState(0)
  const [recovering, setRecovering] = useState(false)

  // Recovery fetch — if readings arrived without text (race condition or stale cache), load it now
  useEffect(() => {
    const readings = state.readings || []
    if (!readings.length) return
    const needsFetch = readings.some(r => !r.text?.trim())
    if (!needsFetch) return
    setRecovering(true)
    fetchAllReadings(readings)
      .then(populated => {
        dispatch({ type: 'SET_READINGS', payload: populated })
      })
      .catch(() => {/* silent fail */})
      .finally(() => setRecovering(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const phase = LECTIO_PROMPTS[activePhase]
  const phaseKey = PHASE_STATE_KEY[phase.phase.toLowerCase()] ?? phase.phase.toLowerCase()

  function handleNext() {
    if (activePhase < LECTIO_PROMPTS.length - 1) {
      setActivePhase(activePhase + 1)
    } else {
      dispatch({ type: 'COMPLETE_STEP', step: 3, nextStep: 4 })
    }
  }

  const isLastPhase = activePhase === LECTIO_PROMPTS.length - 1

  return (
    <div className="animate-slide-up">
      <SectionHeader
        step={3}
        label="Lectio Divina"
        title="Sit with the Word"
        subtitle="The text and resources stay with you on the left as you move through each moment."
      />

      {/* Two-column layout: resources + reading LEFT (sticky), phases RIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6 items-start">

        {/* LEFT — sticky: all readings */}
        <div className="lg:sticky lg:top-28">
          <ReadingsPanel readings={state.readings} maxHeight="75vh" loading={recovering} />
        </div>

        {/* RIGHT — phases */}
        <div>
          {/* Ambient player — unobtrusive, above the phase work */}
          <div className="mb-5">
            <AmbientPlayer />
          </div>

          {/* Phase tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {LECTIO_PROMPTS.map((p, i) => {
              const isActive = activePhase === i
              const stateKey = PHASE_STATE_KEY[p.phase.toLowerCase()] ?? p.phase.toLowerCase()
              const hasNote = Boolean(state.lectioNotes[stateKey])
              const isTurn = p.phase === 'TheTurn'

              return (
                <button
                  key={p.phase}
                  onClick={() => setActivePhase(i)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all duration-200 border"
                  style={{
                    background: isActive ? 'var(--bg-surface)' : 'transparent',
                    borderColor: isActive
                      ? (isTurn ? '#2d7a4f' : 'var(--gold)')
                      : hasNote ? 'var(--border-medium)' : 'var(--border-subtle)',
                    color: isActive ? 'var(--text-primary)' : hasNote ? 'var(--text-muted)' : 'var(--text-faint)',
                  }}
                >
                  <span className="leading-none flex items-center" style={{ color: 'var(--text-muted)' }}><PhaseIcon phase={p.phase} size={14} /></span>
                  <span className="hidden sm:inline">{isTurn ? 'The Turn' : p.phase}</span>
                  {hasNote && (
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isTurn ? '#2d7a4f' : 'var(--gold)' }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Active phase card */}
          <div className="step-card">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="leading-none flex items-center" style={{ color: 'var(--gold)' }}><PhaseIcon phase={phase.phase} size={18} /></span>
                <h3 className="text-lg font-serif" style={{ color: 'var(--text-primary)' }}>
                  {phase.phase === 'TheTurn' ? 'The Turn' : phase.phase} — {phase.title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed italic" style={{ color: 'var(--text-muted)' }}>
                {phase.instruction}
              </p>
            </div>

            <PromptCard prompts={phase.prompts} title="Reflection prompts" />

            <div className="mt-4">
              <TextArea
                value={state.lectioNotes[phaseKey] || ''}
                onChange={(val) => dispatch({ type: 'SET_LECTIO_NOTE', phase: phaseKey, value: val })}
                placeholder={
                  phase.phase === 'TheTurn'
                    ? 'What surprised you? What changed in how you read this text...'
                    : 'Write freely here — this is just for you.'
                }
                rows={phase.phase === 'TheTurn' ? 5 : 6}
                showCount
              />
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 my-4">
            {LECTIO_PROMPTS.map((_, i) => (
              <div
                key={i}
                className="h-2 rounded-full transition-all duration-200 cursor-pointer"
                onClick={() => setActivePhase(i)}
                style={{
                  width: i === activePhase ? '1rem' : '0.5rem',
                  background: i === activePhase ? 'var(--gold)' : 'var(--border-medium)',
                }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => activePhase > 0 ? setActivePhase(activePhase - 1) : dispatch({ type: 'GO_TO_STEP', step: 2 })}
              className="btn-ghost"
            >
              ← {activePhase > 0 ? 'Previous' : 'Back'}
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => dispatch({ type: 'COMPLETE_STEP', step: 3, nextStep: 4 })}
                className="btn-ghost text-sm"
                style={{ color: 'var(--text-faint)' }}
              >
                Skip →
              </button>
              <button onClick={handleNext} className="btn-primary">
                {isLastPhase
                  ? 'Your Story →'
                  : phase.phase === 'Contemplatio'
                  ? <span className="flex items-center gap-1.5"><RotateCcw size={13} /> The Turn →</span>
                  : `${LECTIO_PROMPTS[activePhase + 1].phase === 'TheTurn' ? 'The Turn' : LECTIO_PROMPTS[activePhase + 1].phase} →`
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
