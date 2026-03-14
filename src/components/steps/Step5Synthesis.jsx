import { useState } from 'react'
import { useHomily } from '../../context/HomilyContext'
import { getInsightsForPassage, INSIGHT_TYPES } from '../../data/verbumInsights'
import SectionHeader from '../ui/SectionHeader'
import TextArea from '../ui/TextArea'
import { cn } from '../../lib/utils'
import { Sparkles, BookMarked, X, ChevronDown, ChevronUp } from 'lucide-react'
import { THEME_OPTIONS } from '../../data/lectionary'

// ── Suggested themes derived from the preacher's prep work ────────────────────
function deriveThemeSuggestions(state) {
  const notes = Object.values(state.lectioNotes).join(' ').toLowerCase()
  const story = (state.personalStory + ' ' + state.storyConnection).toLowerCase()
  const gospel = (state.readings.find(r => r.id === 'gospel')?.text || '').toLowerCase()

  // Score each theme against what they wrote
  const scored = THEME_OPTIONS.map(theme => {
    const keywords = theme.toLowerCase().split(/[\s&]+/)
    const hits = keywords.filter(k =>
      notes.includes(k) || story.includes(k) || gospel.includes(k)
    ).length
    return { theme, hits }
  })

  // Return top 3 by relevance, minimum 3 always shown
  const sorted = scored.sort((a, b) => b.hits - a.hits)
  const top = sorted.slice(0, 3)
  // If all scores are 0, just return the first 3 options
  return top.map(t => t.theme)
}

// ── Verbum insight card (compact, for synthesis step) ─────────────────────────
function VerbumInsightCard({ insight, onClip, clipped }) {
  const [expanded, setExpanded] = useState(false)
  const meta = INSIGHT_TYPES[insight.type]

  return (
    <div
      className="rounded-lg border transition-all"
      style={{
        borderColor: clipped ? 'var(--gold-border)' : 'var(--border-subtle)',
        background: clipped ? 'var(--gold-bg)' : 'var(--bg-inset)',
      }}
    >
      <div className="flex items-start justify-between p-3 gap-3">
        <div className="flex-1 min-w-0">
          {/* Type + keyword */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                color: meta.color,
                background: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
              }}
            >
              {meta.icon} {meta.label}
            </span>
            {insight.keyword && (
              <span
                className="font-serif text-xs italic px-1.5 py-0.5 rounded"
                style={{ color: 'var(--gold)', background: 'var(--gold-bg)' }}
              >
                {insight.keyword}
              </span>
            )}
          </div>
          {/* Headline */}
          <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
            {insight.headline}
          </p>
          {/* Body — expandable */}
          {expanded && (
            <p className="text-xs leading-relaxed mt-2" style={{ color: 'var(--text-muted)' }}>
              {insight.body}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ color: 'var(--text-ghost)' }}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button
            onClick={() => onClip(insight)}
            className="text-[10px] font-semibold px-2 py-0.5 rounded transition-all"
            style={{
              color: clipped ? 'var(--gold)' : 'var(--text-faint)',
              border: `1px solid ${clipped ? 'var(--gold-border)' : 'var(--border-subtle)'}`,
              background: clipped ? 'var(--gold-bg)' : 'transparent',
            }}
          >
            {clipped ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Clipped insight chip (in the "Your Verbum Notes" tray) ───────────────────
function ClipChip({ clip, onRemove }) {
  return (
    <div
      className="flex items-start gap-2 rounded-lg p-2.5 border"
      style={{ background: 'var(--bg-inset)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
          {clip.headline}
        </p>
        {clip.keyword && (
          <p className="text-[10px] italic mt-0.5" style={{ color: 'var(--gold)' }}>
            {clip.keyword}
          </p>
        )}
      </div>
      <button
        onClick={onRemove}
        style={{ color: 'var(--text-ghost)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-muted)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-ghost)'}
      >
        <X size={12} />
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Step5Synthesis() {
  const { state, dispatch } = useHomily()
  const { synthesis } = state

  // Derive Verbum insights based on gospel + theme state
  const gospel = state.readings.find(r => r.id === 'gospel')
  const gospelRef = gospel?.reference ?? ''
  const gospelText = gospel?.text ?? ''
  const verseCount = gospelText
    ? gospelText.split('\n').filter(l => l.trim().length > 0).length
    : 10
  // At synthesis step, theme may not be set yet — cast wide
  const themeSet = Boolean(synthesis.selectedTheme)
  const insights = getInsightsForPassage(gospelRef, verseCount, themeSet, state.liturgicalSeason)

  const suggestedThemes = deriveThemeSuggestions(state)

  function setSynthesis(payload) {
    dispatch({ type: 'SET_SYNTHESIS', payload })
  }

  function handleClip(insight) {
    const already = synthesis.verbumClips.some(c => c.headline === insight.headline)
    if (!already) {
      dispatch({ type: 'ADD_VERBUM_CLIP', clip: insight })
    }
  }

  function handleRemoveClip(index) {
    dispatch({ type: 'REMOVE_VERBUM_CLIP', index })
  }

  function handleNext() {
    // Carry selectedTheme → theme for Direction step
    if (synthesis.selectedTheme && !state.theme) {
      dispatch({ type: 'SET_DIRECTION', payload: { theme: synthesis.selectedTheme } })
    }
    dispatch({ type: 'COMPLETE_STEP', step: 5, nextStep: 6 })
  }

  const hasEnoughToSynthesize = state.personalStory || Object.values(state.lectioNotes).some(Boolean)

  return (
    <div className="animate-slide-up max-w-2xl mx-auto">
      <SectionHeader
        step={5}
        label="Synthesis"
        title="Find the thread"
        subtitle="Before you write, let's surface what your preparation is really pointing toward. This shapes everything downstream."
      />

      {!hasEnoughToSynthesize && (
        <div
          className="rounded-lg p-4 mb-8 border text-sm"
          style={{ background: 'var(--bg-inset)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
        >
          You can come back and deepen this after completing Steps 3 and 4. For now, work with what you have.
        </div>
      )}

      <div className="space-y-10">

        {/* ── 1. What surfaced in your prep ── */}
        {hasEnoughToSynthesize && (
          <div
            className="rounded-xl p-4 border"
            style={{ background: 'var(--bg-inset)', borderColor: 'var(--border-subtle)' }}
          >
            <p className="section-label mb-3">From your preparation</p>
            <div className="space-y-3">
              {state.lectioNotes.meditatio && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-ghost)' }}>Meditatio</p>
                  <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    "{state.lectioNotes.meditatio.slice(0, 200)}{state.lectioNotes.meditatio.length > 200 ? '…' : ''}"
                  </p>
                </div>
              )}
              {state.storyConnection && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-ghost)' }}>Story connection</p>
                  <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    "{state.storyConnection.slice(0, 200)}{state.storyConnection.length > 200 ? '…' : ''}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 2. Choose / confirm the theme ── */}
        <div>
          <p className="section-label mb-1">The theme</p>
          <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {suggestedThemes.length > 0
              ? 'Based on your preparation, these themes seem most present. Pick one or write your own.'
              : 'What is this homily really about? Choose one or write your own.'}
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {suggestedThemes.map(t => (
              <button
                key={t}
                onClick={() => setSynthesis({ selectedTheme: t === synthesis.selectedTheme ? '' : t })}
                className="pill-option"
                style={synthesis.selectedTheme === t ? {
                  borderColor: 'var(--gold-border)',
                  color: 'var(--gold)',
                  background: 'var(--gold-bg)',
                } : {}}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={THEME_OPTIONS.includes(synthesis.selectedTheme) ? '' : synthesis.selectedTheme}
            onChange={e => setSynthesis({ selectedTheme: e.target.value })}
            placeholder="Or write your own theme..."
            className="input-field text-sm"
          />
        </div>

        {/* ── 3. Theme statement ── */}
        <div>
          <p className="section-label mb-1">Theme statement</p>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Complete this sentence: <em style={{ color: 'var(--text-body)' }}>"This homily is really about…"</em>{' '}
            One sentence. As specific as you can make it.
          </p>
          <TextArea
            value={synthesis.themeStatement}
            onChange={val => setSynthesis({ themeStatement: val })}
            placeholder="…the moment when someone chooses not to condemn, and what that choice costs them."
            rows={2}
          />
        </div>

        {/* ── 4. Core Gospel insight ── */}
        <div>
          <p className="section-label mb-1">Core Gospel insight</p>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            What is the one thing about this Gospel — a word, a scene, a reversal — that you most want your people to see?
          </p>
          <TextArea
            value={synthesis.coreInsight}
            onChange={val => setSynthesis({ coreInsight: val })}
            placeholder="The crowd came with a law. Jesus came with a pause. That pause is the whole Gospel."
            rows={3}
          />
        </div>

        {/* ── 5. What the congregation needs ── */}
        <div>
          <p className="section-label mb-1">What your people need</p>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Who is sitting in front of you? What are they carrying? What truth do they need to hear — not in general, but this specific Sunday?
          </p>
          <TextArea
            value={synthesis.congregationNeed}
            onChange={val => setSynthesis({ congregationNeed: val })}
            placeholder="People exhausted by having to be right all the time. They need permission to lay something down."
            rows={3}
          />
        </div>

        {/* ── 6. Verbum Scholar insights ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookMarked size={14} style={{ color: 'var(--gold)' }} />
            <p className="section-label">Verbum Scholar</p>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}
            >
              {insights.length} insights for {gospelRef || 'your Gospel'}
            </span>
          </div>
          <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Save the ones that sharpen your theme. They'll be available in the Workshop.
          </p>

          {insights.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
              Complete Step 2 to load Gospel insights.
            </p>
          ) : (
            <div className="space-y-2">
              {insights.map((insight, i) => (
                <VerbumInsightCard
                  key={i}
                  insight={insight}
                  onClip={handleClip}
                  clipped={synthesis.verbumClips.some(c => c.headline === insight.headline)}
                />
              ))}
            </div>
          )}

          {/* Saved clips tray */}
          {synthesis.verbumClips.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-ghost)' }}>
                Saved for the workshop ({synthesis.verbumClips.length})
              </p>
              <div className="space-y-2">
                {synthesis.verbumClips.map((clip, i) => (
                  <ClipChip key={i} clip={clip} onRemove={() => handleRemoveClip(i)} />
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Nav */}
      <div className="mt-10 flex items-center justify-between">
        <button onClick={() => dispatch({ type: 'GO_TO_STEP', step: 4 })} className="btn-ghost">
          ← Back
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch({ type: 'COMPLETE_STEP', step: 5, nextStep: 6 })}
            className="btn-ghost"
            style={{ color: 'var(--text-faint)' }}
          >
            Skip for now
          </button>
          <button onClick={handleNext} className="btn-primary">
            Set Direction →
          </button>
        </div>
      </div>
    </div>
  )
}
