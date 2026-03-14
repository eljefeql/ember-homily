import { useRef, useState, useEffect } from 'react'
import { useHomily } from '../../context/HomilyContext'
import SectionHeader from '../ui/SectionHeader'
import TextArea from '../ui/TextArea'
import AimAnchor from '../ui/AimAnchor'
import { estimateReadingTime, wordCount } from '../../lib/utils'
import { streamHomilyDraft } from '../../lib/claudeApi'
import {
  Printer, Copy, RotateCcw, Check, PenLine, LayoutTemplate,
  Sparkles, BookOpen, X, Loader2, StopCircle,
} from 'lucide-react'

// ─── Section metadata ────────────────────────────────────────────────
const SECTION_LABELS = {
  openingStory: 'Opening',
  preview:      'Invitation',
  gospelAnchor: 'Anchor',
  gospelInsight:'Insight',
  gospelBridge: 'Bridge',
  mission:      'Mission',
  closeLoop:    'Close',
}

const SECTION_ACCENT = {
  openingStory:  { borderColor: 'var(--gold)', background: 'var(--bg-surface)' },
  preview:       { background: 'transparent' },
  gospelAnchor:  { background: 'var(--bg-inset)' },
  gospelInsight: { background: 'var(--bg-inset)' },
  gospelBridge:  { background: 'var(--bg-inset)' },
  mission:       { borderColor: 'var(--accent-red)', background: 'var(--bg-surface)' },
  closeLoop:     { borderColor: 'var(--gold-dim)', background: 'var(--bg-surface)' },
}

const SECTION_ORDER = [
  'openingStory', 'preview',
  'gospelAnchor', 'gospelInsight', 'gospelBridge',
  'mission', 'closeLoop',
]

// ─── Path definitions ────────────────────────────────────────────────
const PATHS = [
  {
    id: 'write',
    icon: PenLine,
    label: 'Write it',
    description: 'Your prep work on one page. Write freely beneath it.',
  },
  {
    id: 'frame',
    icon: LayoutTemplate,
    label: 'Frame it',
    description: 'Your workshop sections assembled — edit until it sings.',
  },
  {
    id: 'draft',
    icon: Sparkles,
    label: 'Draft with Claude',
    description: 'Claude writes a first draft from your notes. You revise until it\'s yours.',
  },
]

// ─── Utility ────────────────────────────────────────────────────────
function StatsBar({ fullText, tone, theme }) {
  const total = wordCount(fullText)
  const mins  = estimateReadingTime(fullText)
  const timeColor = mins >= 5 && mins <= 10 ? '#4ade80' : mins > 10 ? '#f87171' : '#eab308'

  return (
    <div
      className="flex flex-wrap items-center gap-6 rounded-xl p-4 mb-6 border no-print"
      style={{ background: 'var(--bg-inset)', borderColor: 'var(--border-subtle)' }}
    >
      <div>
        <p className="text-xs mb-0.5" style={{ color: 'var(--text-faint)' }}>Words</p>
        <p className="text-xl font-serif" style={{ color: 'var(--text-primary)' }}>{total}</p>
      </div>
      <div>
        <p className="text-xs mb-0.5" style={{ color: 'var(--text-faint)' }}>Delivery time</p>
        <p className="text-xl font-serif" style={{ color: timeColor }}>{mins} min</p>
      </div>
      {tone && (
        <div>
          <p className="text-xs mb-0.5" style={{ color: 'var(--text-faint)' }}>Tone</p>
          <p className="text-sm capitalize" style={{ color: 'var(--gold)' }}>{tone}</p>
        </div>
      )}
      {theme && (
        <div>
          <p className="text-xs mb-0.5" style={{ color: 'var(--text-faint)' }}>Theme</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{theme}</p>
        </div>
      )}
    </div>
  )
}

function ActionBar({ onCopy, copied, onPrint, onBack, backLabel = 'Edit in Workshop' }) {
  return (
    <div className="flex gap-2 mb-6 no-print">
      <button onClick={onCopy} className="btn-secondary flex items-center gap-2 text-sm">
        {copied
          ? <Check size={14} style={{ color: '#4ade80' }} />
          : <Copy size={14} />}
        {copied ? 'Copied!' : 'Copy text'}
      </button>
      <button onClick={onPrint} className="btn-secondary flex items-center gap-2 text-sm">
        <Printer size={14} />
        Print
      </button>
      <button onClick={onBack} className="btn-ghost flex items-center gap-2 text-sm ml-auto">
        <RotateCcw size={14} />
        {backLabel}
      </button>
    </div>
  )
}

function SourcesFooter({ readings, selectedReadings }) {
  const relevant = readings.filter(r => selectedReadings[r.id] || r.id === 'gospel')
  if (relevant.length === 0) return null
  return (
    <div
      className="mt-8 pt-6 no-print"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color: 'var(--text-ghost)' }}
      >
        Sources
      </p>
      {relevant.map(r => (
        <p key={r.id} className="text-xs" style={{ color: 'var(--text-faint)' }}>
          {r.label}: {r.reference} ({r.translation})
        </p>
      ))}
    </div>
  )
}

// ─── Path 1: Write it yourself ───────────────────────────────────────
function PathWrite({ state, dispatch }) {
  const [showPanel, setShowPanel] = useState(true)
  const [copied, setCopied] = useState(false)
  const freeText = state.finalHomily || ''
  const words = wordCount(freeText)
  const mins  = estimateReadingTime(freeText)

  async function handleCopy() {
    await navigator.clipboard.writeText(freeText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Build reference panel items from prep work
  const prepItems = [
    state.lectioNotes?.theTurn     && { label: 'The Turn', text: state.lectioNotes.theTurn },
    state.synthesis?.coreInsight   && { label: 'Core insight', text: state.synthesis.coreInsight },
    state.synthesis?.congregationNeed && { label: 'Congregation need', text: state.synthesis.congregationNeed },
    state.personalStory            && { label: 'Your story', text: state.personalStory },
    state.congregationMoment       && { label: 'Preaching to', text: state.congregationMoment },
    state.currentEvents            && { label: 'Current moment', text: state.currentEvents },
  ].filter(Boolean)

  const verbumClips = state.synthesis?.verbumClips || []

  return (
    <div>
      {/* Reference panel */}
      {(prepItems.length > 0 || verbumClips.length > 0) && (
        <div className="no-print mb-4">
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: 'var(--gold)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--gold-bright)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--gold)'}
          >
            <BookOpen size={14} />
            {showPanel ? 'Hide prep notes' : 'Show prep notes'}
          </button>
        </div>
      )}

      {showPanel && (prepItems.length > 0 || verbumClips.length > 0) && (
        <div
          className="rounded-xl border mb-6 no-print"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-inset)' }}
        >
          <div className="p-4 space-y-4">
            {prepItems.map(item => (
              <div key={item.label}>
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: 'var(--text-ghost)' }}
                >
                  {item.label}
                </p>
                <p
                  className="text-sm leading-relaxed font-serif italic"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {item.text}
                </p>
              </div>
            ))}

            {verbumClips.length > 0 && (
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--text-ghost)' }}
                >
                  Verbum clips ({verbumClips.length})
                </p>
                <div className="space-y-2">
                  {verbumClips.map((clip, i) => (
                    <div
                      key={i}
                      className="rounded-lg p-3 text-sm"
                      style={{ background: 'var(--bg-surface)', borderLeft: '3px solid var(--gold)' }}
                    >
                      <p className="font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>{clip.headline}</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{clip.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Free-write area */}
      <TextArea
        value={freeText}
        onChange={(val) => dispatch({ type: 'SET_FINAL_HOMILY', value: val })}
        placeholder="Write your homily here. Your prep notes are above — use them, ignore them, let them breathe into this. This page is yours."
        rows={22}
        showCount
      />

      {words > 0 && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs" style={{ color: 'var(--text-ghost)' }}>
            {words} words · {mins} min delivery
          </span>
          <div className="flex gap-2">
            {mins >= 5 && mins <= 10 && (
              <span className="text-xs" style={{ color: '#4ade80' }}>Good length</span>
            )}
            {mins > 10 && (
              <span className="text-xs" style={{ color: '#f87171' }}>Running long</span>
            )}
            {mins < 5 && words > 10 && (
              <span className="text-xs" style={{ color: '#eab308' }}>Keep going</span>
            )}
          </div>
        </div>
      )}

      {words > 0 && (
        <div className="flex gap-2 mt-4 no-print">
          <button onClick={handleCopy} className="btn-secondary flex items-center gap-2 text-sm">
            {copied ? <Check size={14} style={{ color: '#4ade80' }} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy text'}
          </button>
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2 text-sm">
            <Printer size={14} />
            Print
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Path 2: Frame it ────────────────────────────────────────────────
function PathFrame({ state, dispatch }) {
  const [copied, setCopied] = useState(false)

  const sections = SECTION_ORDER
    .map(key => ({ key, text: state.framework[key] }))
    .filter(s => s.text?.trim())

  const fullText = sections.map(s => s.text).join('\n\n')

  async function handleCopy() {
    await navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-serif text-lg mb-4" style={{ color: 'var(--text-faint)' }}>
          Nothing in the workshop yet.
        </p>
        <button
          onClick={() => dispatch({ type: 'GO_TO_STEP', step: 6 })}
          className="btn-primary"
        >
          Go to the Workshop →
        </button>
      </div>
    )
  }

  return (
    <>
      <StatsBar fullText={fullText} tone={state.tone} theme={state.theme} />
      <ActionBar
        onCopy={handleCopy}
        copied={copied}
        onPrint={() => window.print()}
        onBack={() => dispatch({ type: 'GO_TO_STEP', step: 6 })}
      />

      {/* The assembled homily */}
      <div className="print-area">
        <div className="space-y-0">
          {sections.map((section) => {
            const accent = SECTION_ACCENT[section.key] || {}
            const hasBorder = Boolean(accent.borderColor)
            return (
              <div key={section.key} className="group relative">
                <div className="flex items-center gap-2 mb-2 no-print">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-ghost)' }}
                  >
                    {SECTION_LABELS[section.key]}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                  <button
                    onClick={() => dispatch({ type: 'GO_TO_STEP', step: 6 })}
                    className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--text-ghost)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-ghost)'}
                  >
                    edit
                  </button>
                </div>

                <div
                  className="rounded-lg p-5 mb-3"
                  style={{
                    background: accent.background || 'transparent',
                    ...(hasBorder ? { borderLeft: `4px solid ${accent.borderColor}` } : {}),
                  }}
                >
                  <p
                    className="font-serif leading-8 whitespace-pre-wrap text-base"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {section.text}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <SourcesFooter readings={state.readings} selectedReadings={state.selectedReadings} />
      </div>
    </>
  )
}

// ─── Path 3: Draft with Claude ───────────────────────────────────────
function PathDraft({ state, dispatch }) {
  const [status, setStatus] = useState('idle') // idle | streaming | done | error
  const [draft, setDraft] = useState(state.finalHomily || '')
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const abortRef = useRef(null)
  const draftRef = useRef('')
  const textareaEndRef = useRef(null)

  const words = wordCount(draft)
  const hasKey = true // Key is injected server-side via Vite proxy — always allow

  // Keep draft in context when it changes
  useEffect(() => {
    if (draft) dispatch({ type: 'SET_FINAL_HOMILY', value: draft })
  }, [draft]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerate() {
    setStatus('streaming')
    setErrorMsg('')
    draftRef.current = ''
    setDraft('')

    const abort = await streamHomilyDraft(
      state,
      // onChunk
      (chunk) => {
        draftRef.current += chunk
        setDraft(draftRef.current)
        // Scroll to bottom as text arrives
        textareaEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      },
      // onDone
      (fullText) => {
        setDraft(fullText)
        setStatus('done')
      },
      // onError
      (err) => {
        setErrorMsg(err.message)
        setStatus('error')
      },
    )
    abortRef.current = abort
  }

  function handleStop() {
    abortRef.current?.()
    setStatus('done')
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Observations Claude could make after generating (shown post-draft)
  const hasAim = state.homilyAim?.action || state.homilyAim?.because
  const hasStory = Boolean(state.personalStory)

  return (
    <div>
      {/* API key warning — only shown if proxy returns auth error */}

      {/* Generate button / status */}
      {status === 'idle' && (
        <div className="mb-6">
          <div
            className="rounded-xl border p-5 mb-4"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-inset)' }}
          >
            <p className="font-serif text-base mb-2" style={{ color: 'var(--text-primary)' }}>
              Ready to draft
            </p>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
              Claude will write a complete first draft using everything you've prepared —
              your aim, story, Lectio notes, Verbum insights, and community context.
              You revise until it sounds like you.
            </p>

            {/* Summary of what Claude will use */}
            <div className="space-y-1 mb-4">
              {[
                { label: 'The Aim', present: Boolean(state.homilyAim?.action) },
                { label: 'Personal story', present: hasStory },
                { label: 'Lectio notes (incl. The Turn)', present: Boolean(state.lectioNotes?.theTurn || state.lectioNotes?.meditatio) },
                { label: 'Verbum clips', present: (state.synthesis?.verbumClips?.length || 0) > 0, count: state.synthesis?.verbumClips?.length },
                { label: 'Community context', present: Boolean(state.currentEvents || state.congregationMoment) },
                { label: 'Workshop sections', present: SECTION_ORDER.some(k => state.framework?.[k]?.trim()), count: SECTION_ORDER.filter(k => state.framework?.[k]?.trim()).length },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                    style={{
                      background: item.present ? 'rgba(34,197,94,0.15)' : 'var(--bg-surface)',
                      color: item.present ? '#4ade80' : 'var(--text-ghost)',
                    }}
                  >
                    {item.present ? '✓' : '·'}
                  </span>
                  <span className="text-xs" style={{ color: item.present ? 'var(--text-body)' : 'var(--text-ghost)' }}>
                    {item.label}
                    {item.count > 0 && ` (${item.count})`}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={!hasKey}
              className="btn-primary flex items-center gap-2"
              style={!hasKey ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <Sparkles size={15} />
              Draft the homily
            </button>
          </div>
        </div>
      )}

      {status === 'streaming' && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Loader2 size={15} className="animate-spin" style={{ color: 'var(--gold)' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Drafting…</span>
          </div>
          <button
            onClick={handleStop}
            className="btn-ghost flex items-center gap-1.5 text-xs"
            style={{ color: 'var(--text-faint)' }}
          >
            <StopCircle size={12} />
            Stop
          </button>
        </div>
      )}

      {status === 'error' && (
        <div
          className="rounded-lg p-4 mb-4 border"
          style={{ borderColor: 'rgba(248,113,113,0.3)', background: 'rgba(139,38,53,0.1)' }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: '#f87171' }}>Draft failed</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{errorMsg}</p>
          <button onClick={handleGenerate} className="btn-ghost text-xs mt-3">Try again →</button>
        </div>
      )}

      {/* The draft — live while streaming, editable when done */}
      {(status === 'streaming' || status === 'done' || draft) && (
        <div>
          {status === 'done' && words > 0 && (
            <>
              <ActionBar
                onCopy={handleCopy}
                copied={copied}
                onPrint={() => window.print()}
                onBack={() => dispatch({ type: 'GO_TO_STEP', step: 6 })}
              />
            </>
          )}

          <TextArea
            value={draft}
            onChange={(val) => {
              setDraft(val)
            }}
            placeholder=""
            rows={24}
            showCount
            readOnly={status === 'streaming'}
          />
          <div ref={textareaEndRef} />

          {status === 'done' && words > 0 && (
            <>
              <StatsBar fullText={draft} tone={state.tone} theme={state.theme} />

              {/* Post-draft observation */}
              <div
                className="rounded-xl border p-4 mt-2 mb-4 no-print"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-inset)' }}
              >
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-ghost)' }}>
                  A few things to check
                </p>
                <ul className="space-y-1.5">
                  {[
                    hasAim && `Does the homily land on "${state.homilyAim.action}"? That was your aim.`,
                    hasStory && 'Read the opening story aloud — does it sound like you?',
                    'Is there one moment in the middle that would surprise someone who wasn\'t expecting it?',
                    'Does the closing echo the opening? Read just those two pieces back to back.',
                    'Where does it feel like a document? That\'s where to loosen the language.',
                  ].filter(Boolean).map((obs, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--gold)', flexShrink: 0 }}>→</span>
                      {obs}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => { setStatus('idle'); setDraft(''); draftRef.current = '' }}
                className="btn-ghost text-xs flex items-center gap-1.5 no-print"
                style={{ color: 'var(--text-faint)' }}
              >
                <RotateCcw size={12} />
                Generate a new draft
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────
export default function Step7Homily() {
  const { state, dispatch } = useHomily()

  // Default to 'frame' if Workshop has content, else 'write'
  const hasFramework = SECTION_ORDER.some(k => state.framework[k]?.trim())
  const [activePath, setActivePath] = useState(
    state.homilyPath || (hasFramework ? 'frame' : 'write')
  )

  function choosePath(id) {
    setActivePath(id)
    dispatch({ type: 'SET_HOMILY_PATH', value: id })
  }

  return (
    <div className="animate-slide-up max-w-2xl mx-auto">
      <SectionHeader
        step={7}
        label="Preach"
        title={state.sundayName || 'Your Homily'}
        subtitle={state.date ? `${state.date} · ${state.tradition}` : undefined}
      />

      {/* Compact aim reminder */}
      <AimAnchor aim={state.homilyAim} compact />

      {/* Path selector */}
      <div className="grid grid-cols-3 gap-2 mb-8 no-print">
        {PATHS.map(path => {
          const Icon = path.icon
          const isActive = activePath === path.id
          return (
            <button
              key={path.id}
              onClick={() => choosePath(path.id)}
              className="rounded-xl p-3 text-left transition-all duration-200 border"
              style={{
                background: isActive ? 'var(--gold-bg)' : 'var(--bg-inset)',
                borderColor: isActive ? 'var(--gold-border)' : 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon size={13} style={{ color: isActive ? 'var(--gold)' : 'var(--text-faint)' }} />
                <span
                  className="text-xs font-semibold"
                  style={{ color: isActive ? 'var(--gold)' : 'var(--text-muted)' }}
                >
                  {path.label}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-faint)' }}>
                {path.description}
              </p>
            </button>
          )
        })}
      </div>

      {/* Path content */}
      {activePath === 'write' && <PathWrite state={state} dispatch={dispatch} />}
      {activePath === 'frame' && <PathFrame state={state} dispatch={dispatch} />}
      {activePath === 'draft' && <PathDraft state={state} dispatch={dispatch} />}

      {/* Footer */}
      <div
        className="mt-10 pt-6 flex items-center justify-between no-print"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch({ type: 'GO_TO_STEP', step: 6 })}
            className="btn-ghost text-sm"
          >
            ← Workshop
          </button>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            May it land well.
          </p>
          <button
            onClick={() => {
              if (window.confirm('Start a new homily? This will clear your current work.')) {
                dispatch({ type: 'RESET' })
              }
            }}
            className="btn-ghost text-sm"
            style={{ color: 'var(--text-faint)' }}
          >
            New homily
          </button>
        </div>
      </div>
    </div>
  )
}
