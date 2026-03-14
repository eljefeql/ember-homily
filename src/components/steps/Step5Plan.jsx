import { useState } from 'react'
import { useHomily } from '../../context/HomilyContext'
import { TONE_OPTIONS, THEME_OPTIONS } from '../../data/lectionary'
import SectionHeader from '../ui/SectionHeader'
import TextArea from '../ui/TextArea'
import ReadingsPanel from '../ui/ReadingsPanel'
import { cn } from '../../lib/utils'
import { ChevronDown, ChevronUp, Target, Users, RotateCcw, X } from 'lucide-react'

// ── Live aim sentence composer ─────────────────────────────────────────────────
function AimComposer({ aim, onChange }) {
  const hasAim = aim.action || aim.because

  return (
    <div>
      <div className="space-y-3">
        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
            After this homily, I want my congregation to…
          </p>
          <input
            type="text"
            value={aim.action}
            onChange={e => onChange({ action: e.target.value })}
            placeholder="leave knowing that their struggles are not signs of abandonment…"
            className="input-field w-full text-sm"
          />
        </div>
        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
            …because
          </p>
          <input
            type="text"
            value={aim.because}
            onChange={e => onChange({ because: e.target.value })}
            placeholder="the same God who met Jesus in the desert meets us in ours"
            className="input-field w-full text-sm"
          />
        </div>
      </div>

      {/* Live composed sentence */}
      {hasAim && (
        <div
          className="rounded-lg p-3 mt-4 border-l-4 animate-slide-up"
          style={{ borderLeftColor: 'var(--gold)', background: 'var(--gold-bg)' }}
        >
          <p className="text-sm font-serif italic leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            "After this homily, I want my congregation to{' '}
            <span style={{ color: 'var(--gold)' }}>{aim.action || '___'}</span>
            {' '}because{' '}
            <span style={{ color: 'var(--gold)' }}>{aim.because || '___'}</span>."
          </p>
        </div>
      )}
    </div>
  )
}

// ── Gathered insights — prep work pulled forward ───────────────────────────────
function GatheredInsights({ state, dispatch }) {
  const [open, setOpen] = useState(false)

  const meditatio = state.lectioNotes?.meditatio
  const theTurn   = state.lectioNotes?.theTurn
  const connection = state.storyConnection
  const clips = state.synthesis?.verbumClips ?? []

  const hasAnything = meditatio || theTurn || connection || clips.length > 0

  if (!hasAnything) return null

  function pullToWorkshop(sectionId, text) {
    dispatch({ type: 'SET_FRAMEWORK_SECTION', section: sectionId, value: text })
  }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm transition-colors"
        style={{ background: 'var(--bg-inset)', color: 'var(--text-body)' }}
      >
        <span className="font-medium">From your preparation</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="divide-y animate-slide-up" style={{ borderColor: 'var(--border-subtle)' }}>

          {meditatio && (
            <InsightRow
              label="Meditatio"
              text={meditatio}
              action="Pull to Gospel Anchor"
              onPull={() => pullToWorkshop('gospelAnchor', meditatio)}
            />
          )}

          {theTurn && (
            <InsightRow
              label="The Turn"
              text={theTurn}
              icon={<RotateCcw size={11} />}
              action="Pull to Gospel Insight"
              onPull={() => pullToWorkshop('gospelInsight', theTurn)}
            />
          )}

          {connection && (
            <InsightRow
              label="Story connection"
              text={connection}
              action="Pull to Preview"
              onPull={() => pullToWorkshop('preview', connection)}
            />
          )}

          {clips.map((clip, i) => (
            <InsightRow
              key={i}
              label={`Verbum · ${clip.type}`}
              text={`${clip.headline} — ${clip.body}`}
              action="Pull to Gospel Insight"
              onPull={() => {
                const existing = state.framework?.gospelInsight || ''
                const appended = existing
                  ? `${existing}\n\n[${clip.source}] ${clip.headline}: ${clip.body}`
                  : `[${clip.source}] ${clip.headline}: ${clip.body}`
                pullToWorkshop('gospelInsight', appended)
              }}
              onRemove={() => dispatch({ type: 'REMOVE_VERBUM_CLIP', index: i })}
            />
          ))}

        </div>
      )}
    </div>
  )
}

function InsightRow({ label, text, action, onPull, onRemove, icon }) {
  return (
    <div className="px-4 py-3 flex items-start gap-3" style={{ background: 'var(--bg-surface)' }}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium mb-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          {icon}
          {label}
        </p>
        <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--text-body)' }}>
          {text}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onPull}
          className="text-xs px-2.5 py-1 rounded-md transition-colors whitespace-nowrap"
          style={{ background: 'var(--bg-inset)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.borderColor = 'var(--gold-border)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
        >
          {action}
        </button>
        {onRemove && (
          <button onClick={onRemove} style={{ color: 'var(--text-ghost)' }}>
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Deeper theme accordion (synthesis fields, secondary) ──────────────────────
function DeeperTheme({ synthesis, dispatch }) {
  const [open, setOpen] = useState(false)

  function setSynthesis(payload) {
    dispatch({ type: 'SET_SYNTHESIS', payload })
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm transition-colors"
        style={{ background: 'var(--bg-inset)', color: 'var(--text-body)' }}
      >
        <span className="font-medium">Deepen your theme <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(optional)</span></span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="px-4 py-4 space-y-5 animate-slide-up" style={{ background: 'var(--bg-surface)' }}>
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>This homily is really about…</p>
            <TextArea
              value={synthesis.themeStatement}
              onChange={val => setSynthesis({ themeStatement: val })}
              placeholder="How God meets us in the places we'd rather not be."
              rows={2}
            />
          </div>
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Core Gospel insight</p>
            <TextArea
              value={synthesis.coreInsight}
              onChange={val => setSynthesis({ coreInsight: val })}
              placeholder="The Spirit does not protect Jesus from the desert — the Spirit leads him there."
              rows={3}
            />
          </div>
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>What your congregation needs to hear</p>
            <TextArea
              value={synthesis.congregationNeed}
              onChange={val => setSynthesis({ congregationNeed: val })}
              placeholder="Permission to see their hard season as sacred, not as failure."
              rows={3}
            />
          </div>
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Connection between Gospel and First Reading</p>
            <TextArea
              value={synthesis.gospelFirstConnection}
              onChange={val => setSynthesis({ gospelFirstConnection: val })}
              placeholder="Both texts circle the same mystery — the First Reading plants the seed that the Gospel brings to flower…"
              rows={3}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Step5Plan() {
  const { state, dispatch } = useHomily()

  const aim = state.homilyAim ?? { action: '', because: '' }
  const theTurn = state.lectioNotes?.theTurn
  const congregationMoment = state.congregationMoment

  function setAim(payload) {
    dispatch({ type: 'SET_HOMILY_AIM', payload })
  }

  function setDirection(payload) {
    dispatch({ type: 'SET_DIRECTION', payload })
  }

  function handleNext() {
    // Carry theme from synthesis if not yet set in direction
    if (state.synthesis?.selectedTheme && !state.theme) {
      dispatch({ type: 'SET_DIRECTION', payload: { theme: state.synthesis.selectedTheme } })
    }
    dispatch({ type: 'COMPLETE_STEP', step: 5, nextStep: 6 })
  }

  const hasAim = aim.action && aim.because

  return (
    <div className="animate-slide-up">
      <SectionHeader
        step={5}
        label="The Plan"
        title="Shape the homily"
        subtitle="Name the tone, the theme, the moment you're preaching into — then distill it all into one aim."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6 items-start">

        {/* LEFT — sticky: all readings */}
        <div className="lg:sticky lg:top-28">
          <ReadingsPanel readings={state.readings} maxHeight="75vh" />
        </div>

        {/* RIGHT — plan work */}
        <div className="space-y-8">

        {/* ── Context from prep (if exists) ── */}
        {(theTurn || congregationMoment) && (
          <div
            className="rounded-xl p-4 space-y-3 border"
            style={{ background: 'var(--bg-inset)', borderColor: 'var(--border-subtle)' }}
          >
            <p className="section-label">From your preparation</p>

            {theTurn && (
              <div className="flex items-start gap-2">
                <RotateCcw size={13} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--gold)' }}>The Turn</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>
                    {theTurn.length > 180 ? theTurn.slice(0, 180) + '…' : theTurn}
                  </p>
                </div>
              </div>
            )}

            {congregationMoment && (
              <div className="flex items-start gap-2">
                <Users size={13} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>Preaching to</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>
                    {congregationMoment.length > 160 ? congregationMoment.slice(0, 160) + '…' : congregationMoment}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tone ── */}
        <div>
          <p className="section-label mb-4">Tone</p>
          <div className="grid grid-cols-2 gap-2">
            {TONE_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => setDirection({ tone: t.id === state.tone ? '' : t.id })}
                className={cn('option-card', state.tone === t.id && 'selected')}
              >
                <p className="option-card-title">{t.label}</p>
                <p className="option-card-desc">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Theme ── */}
        <div>
          <p className="section-label mb-1">Theme</p>
          <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {state.synthesis?.selectedTheme
              ? 'Carried from your preparation — adjust if it has shifted.'
              : 'What is this homily really about? One word or phrase.'}
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {THEME_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => setDirection({ theme: t === state.theme ? '' : t })}
                className={cn('pill-option', state.theme === t && 'selected')}
              >
                {t}
              </button>
            ))}
          </div>
          {!THEME_OPTIONS.includes(state.theme) && (
            <input
              type="text"
              value={state.theme}
              onChange={e => setDirection({ theme: e.target.value })}
              placeholder="Or type your own theme…"
              className="input-field w-full text-sm"
            />
          )}
        </div>

        {/* ── What's alive in your community ── */}
        <div>
          <p className="section-label mb-1">What's alive in your community</p>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            What's on people's minds this week? A loss, a local event, a collective mood. This helps the Gospel land in real life.
          </p>
          <TextArea
            value={state.currentEvents}
            onChange={val => setDirection({ currentEvents: val })}
            placeholder="Many families are dealing with the aftermath of the plant closure. There's an undercurrent of fear about the future…"
            rows={3}
          />
        </div>

        {/* ── Gathered insights tray ── */}
        <GatheredInsights state={state} dispatch={dispatch} />

        {/* ── Deeper theme (secondary, collapsed) ── */}
        <DeeperTheme synthesis={state.synthesis ?? {}} dispatch={dispatch} />

        {/* ── The Aim — synthesis moment at the end ── */}
        <div className="step-card">
          <div className="flex items-center gap-2 mb-1">
            <Target size={15} style={{ color: 'var(--gold)' }} />
            <h3 className="font-serif text-lg" style={{ color: 'var(--text-primary)' }}>
              The Aim
            </h3>
            {hasAim && (
              <span
                className="text-xs px-2 py-0.5 rounded-full ml-auto"
                style={{ background: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}
              >
                ✓ Set
              </span>
            )}
          </div>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            You've named the tone, the theme, the moment. Now distill it into one sentence — what do you want your people to carry out the door?
          </p>
          <AimComposer aim={aim} onChange={setAim} />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <button onClick={() => dispatch({ type: 'GO_TO_STEP', step: 4 })} className="btn-ghost">
            ← Back
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch({ type: 'COMPLETE_STEP', step: 5, nextStep: 6 })}
              className="btn-ghost text-sm"
              style={{ color: 'var(--text-faint)' }}
            >
              Skip for now
            </button>
            <button onClick={handleNext} className="btn-primary">
              Open the Workshop →
            </button>
          </div>
        </div>

        </div>{/* end right column */}
      </div>{/* end grid */}
    </div>
  )
}
