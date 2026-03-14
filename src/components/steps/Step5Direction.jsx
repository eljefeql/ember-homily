import { useHomily } from '../../context/HomilyContext'
import { TONE_OPTIONS, THEME_OPTIONS, AUDIENCE_OPTIONS } from '../../data/lectionary'
import SectionHeader from '../ui/SectionHeader'
import TextArea from '../ui/TextArea'
import { cn } from '../../lib/utils'
import { Newspaper, Info } from 'lucide-react'

export default function Step6Direction() {
  const { state, dispatch } = useHomily()

  function set(payload) {
    dispatch({ type: 'SET_DIRECTION', payload })
  }

  function handleNext() {
    dispatch({ type: 'COMPLETE_STEP', step: 6, nextStep: 7 })
  }

  return (
    <div className="animate-slide-up">
      <SectionHeader
        step={6}
        label="The Shape"
        title="Set the direction"
        subtitle="These choices give the homily its voice. You can always adjust in the workshop."
      />

      <div className="space-y-10">

        {/* ── Tone ── */}
        <div>
          <p className="section-label mb-4">Tone</p>
          <div className="grid grid-cols-2 gap-2">
            {TONE_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => set({ tone: t.id === state.tone ? '' : t.id })}
                className={cn('option-card', state.tone === t.id && 'selected')}
              >
                <p className="option-card-title">{t.label}</p>
                <p className="option-card-desc">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Theme — pre-populated from Synthesis ── */}
        <div>
          <p className="section-label mb-1">Theme</p>
          <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {state.synthesis?.selectedTheme
              ? 'Carried over from your synthesis — adjust if needed.'
              : 'What is this homily really about?'}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {THEME_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => set({ theme: t === state.theme ? '' : t })}
                className={cn('pill-option', state.theme === t && 'selected')}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={THEME_OPTIONS.includes(state.theme) ? '' : state.theme}
            onChange={(e) => set({ theme: e.target.value })}
            placeholder="Or write your own theme..."
            className="input-field text-sm"
          />
        </div>

        {/* ── Audience ── */}
        <div>
          <p className="section-label mb-4">Audience</p>
          <div className="flex flex-wrap gap-2">
            {AUDIENCE_OPTIONS.map((a) => (
              <button
                key={a.id}
                onClick={() => set({ audience: a.id })}
                className={cn('pill-option', state.audience === a.id && 'selected')}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Current events ── */}
        <div>
          <p className="section-label mb-1">
            <span className="inline-flex items-center gap-1.5">
              <Newspaper size={12} />
              What's on people's minds this week?
            </span>
          </p>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            What stories, struggles, or current moments feel present in your community right now?
            What are people carrying when they walk through the door?
          </p>
          <div className="notice-banner mb-3">
            <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
            <span style={{ color: 'var(--text-muted)' }}>
              In the full version, relevant headlines and events are suggested automatically based on your theme and Gospel passage.
            </span>
          </div>
          <TextArea
            value={state.currentEvents}
            onChange={(val) => set({ currentEvents: val })}
            placeholder="Jot down what feels urgent or alive in your community this week..."
            rows={4}
          />
        </div>

        {/* ── Mission ── */}
        <div>
          <p className="section-label mb-1">Mission</p>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            What do you want people to do or become? A strong mission is phrased as a question or gentle challenge —
            specific enough to act on, open enough to apply to anyone in the room.
          </p>
          <TextArea
            value={state.missionFocus}
            onChange={(val) => set({ missionFocus: val })}
            placeholder="Who in your life is waiting for something from you that you haven't given yet?"
            rows={3}
          />
        </div>

      </div>

      <div className="mt-10 flex items-center justify-between">
        <button onClick={() => dispatch({ type: 'GO_TO_STEP', step: 5 })} className="btn-ghost">
          ← Back
        </button>
        <button onClick={handleNext} className="btn-primary">
          Open the Workshop →
        </button>
      </div>
    </div>
  )
}
