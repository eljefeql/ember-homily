import { useState } from 'react'
import { useHomily } from '../../context/HomilyContext'
import SectionHeader from '../ui/SectionHeader'
import TextArea from '../ui/TextArea'
import PromptCard from '../ui/PromptCard'
import AimAnchor from '../ui/AimAnchor'
import ReadingsPanel from '../ui/ReadingsPanel'
import { wordCount, estimateReadingTime } from '../../lib/utils'
import { ChevronDown, ChevronUp, Sparkles, RotateCcw } from 'lucide-react'

const FRAMEWORK_SECTIONS = [
  {
    id: 'openingStory',
    number: 1,
    title: 'Open with a Personal Story',
    label: 'The Hook',
    description: 'Brief, specific, honest. Two to four sentences. Its only job is to create a point of entry that feels real.',
    placeholder: 'Begin your homily here — with the specific moment you identified in Step 4...',
    targetWords: [40, 80],
    tips: [
      'Specific beats general every time. "Last Tuesday at the coffee shop..." not "I\'ve noticed lately..."',
      'You don\'t need a punchline or a tidy lesson. Just the scene.',
      'Read it aloud — does it sound like you, or does it sound like a homily?',
    ],
  },
  {
    id: 'preview',
    number: 2,
    title: 'Tell Them What You\'re Going to Tell Them',
    label: 'The Invitation',
    description: 'One or two sentences. Preview the theme. Echo your opening story lightly. This is not a thesis — it is an invitation.',
    placeholder: 'In one or two sentences, invite the congregation into the theme...',
    targetWords: [20, 50],
    tips: [
      'Resist the urge to explain. This is a door, not a map.',
      'Echo the image or question from your opening story — don\'t repeat it, echo it.',
      'It should feel like something is about to happen.',
    ],
  },
  {
    id: 'gospelAnchor',
    number: 3,
    title: 'State the Gospel Truth',
    label: 'The Anchor',
    description: 'One or two sentences. What is the single truth in this Gospel passage? Name it plainly — not as a lecture, but as a discovery.',
    placeholder: 'In this moment, Jesus is doing something specific — and it tells us something true about God...',
    targetWords: [30, 80],
    tips: [
      'One sentence is better than three. What is the Gospel actually saying?',
      'Avoid starting with "Today\'s Gospel tells us..." — go straight to the claim.',
      'If you had to preach just this line, would the homily still land? Then you\'ve found it.',
    ],
    theTurnHint: true,
  },
  {
    id: 'gospelInsight',
    number: 4,
    title: 'Open Up the Language',
    label: 'The Insight',
    description: 'What does the original word, cultural context, or patristic tradition reveal that the congregation doesn\'t know? One insight, delivered simply.',
    placeholder: 'The word translated here as "..." actually means something closer to "..." — and that changes everything...',
    targetWords: [50, 150],
    tips: [
      'One insight, not a lecture. Choose your best one.',
      'Lead with the payoff: "The Greek word here means..." not a long setup.',
      'Your Verbum clips from Step 5 are gold here — use them.',
      'Connect the insight immediately to lived experience, or it floats.',
    ],
  },
  {
    id: 'gospelBridge',
    number: 5,
    title: 'Bridge to Their Life',
    label: 'The Bridge',
    description: 'Connect the Gospel truth to the real world your congregation is living in this week. This is where the anchor meets the current.',
    placeholder: 'This is not ancient history — it is happening in your neighborhood, in your marriage, in your inbox...',
    targetWords: [80, 180],
    tips: [
      'Use what you wrote in the current events field — reference it without belaboring it.',
      'Name the real struggle. People wait the whole homily for you to say what everyone is thinking.',
      'The First Reading often deepens the bridge — use it when the connection is genuine, not forced.',
      'You\'re not solving the problem. You\'re naming it with Gospel eyes.',
    ],
  },
  {
    id: 'mission',
    number: 6,
    title: 'Give a Mission',
    label: 'The Challenge',
    description: 'Send people out with something to do or someone to become. Phrase it as a question or gentle challenge.',
    placeholder: 'Who in your life is waiting for something from you that you have not given yet?...',
    targetWords: [40, 100],
    tips: [
      'A weak mission: "Think about forgiveness this week."',
      'A strong mission: "Who in your life is waiting for something from you that you haven\'t given yet? What is one small step you could take toward them before Sunday?"',
      'Specific enough to act on. Open enough to apply to anyone in the room.',
      'Be honest about the difficulty. Don\'t pretend it\'s easy.',
    ],
    aimHint: true,
  },
  {
    id: 'closeLoop',
    number: 7,
    title: 'Close the Loop',
    label: 'The Echo',
    description: 'Return to your opening story. One sentence that echoes the image or question you opened with.',
    placeholder: 'Return to where you started — one sentence that closes the circle...',
    targetWords: [15, 40],
    tips: [
      'This is not a summary. It\'s a resonance.',
      'When it works, the congregation feels the homily as one complete thought.',
      'The shorter, the better.',
    ],
  },
]

function WordCountBadge({ count, min, max }) {
  if (count === 0) return null
  const inRange = count >= min && count <= max
  const tooLong = count > max

  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full"
      style={{
        background: inRange
          ? 'rgba(34,197,94,0.15)'
          : tooLong
          ? 'rgba(139,38,53,0.15)'
          : 'var(--bg-inset)',
        color: inRange
          ? '#4ade80'
          : tooLong
          ? '#f87171'
          : 'var(--text-faint)',
      }}
    >
      {count}w
    </span>
  )
}

function TheTurnNudge({ theTurn }) {
  if (!theTurn) return null
  return (
    <div
      className="flex items-start gap-2 rounded-lg px-3 py-2.5 mb-3 text-xs"
      style={{
        background: 'rgba(45,122,79,0.08)',
        border: '1px solid rgba(45,122,79,0.25)',
      }}
    >
      <RotateCcw size={11} style={{ color: '#2d7a4f', flexShrink: 0, marginTop: 1 }} />
      <div>
        <p className="font-medium mb-0.5" style={{ color: '#2d7a4f' }}>From The Turn</p>
        <p className="leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
          {theTurn}
        </p>
      </div>
    </div>
  )
}

function AimHint({ aim }) {
  if (!aim?.action && !aim?.because) return null
  return (
    <div
      className="flex items-start gap-2 rounded-lg px-3 py-2.5 mb-3 text-xs"
      style={{
        background: 'var(--gold-bg)',
        border: '1px solid var(--gold-border)',
      }}
    >
      <span style={{ color: 'var(--gold)', flexShrink: 0 }}>→</span>
      <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        <span className="font-medium" style={{ color: 'var(--gold)' }}>Aim: </span>
        {aim.action && `I want my congregation to ${aim.action}`}
        {aim.action && aim.because && ' — '}
        {aim.because && `because ${aim.because}`}.
      </p>
    </div>
  )
}

function FrameworkSection({ section, value, onChange, theTurn, aim }) {
  const [open, setOpen] = useState(true)
  const [showTips, setShowTips] = useState(false)
  const count = wordCount(value)
  const [min, max] = section.targetWords
  const inRange = count >= min && count <= max
  const tooShort = count > 0 && count < min
  const tooLong = count > max

  return (
    <div
      className="rounded-xl border transition-all duration-300"
      style={{
        borderColor: value ? 'var(--border-medium)' : 'var(--border-subtle)',
        background: value ? 'var(--bg-surface)' : 'var(--bg-inset)',
      }}
    >
      {/* Section header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{
              background: value ? 'var(--gold)' : 'var(--bg-hover)',
              color: value ? 'var(--bg-app)' : 'var(--text-faint)',
            }}
          >
            {section.number}
          </div>
          <div>
            <p className="section-label text-xs">{section.label}</p>
            <p className="font-serif text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {section.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <WordCountBadge count={count} min={min} max={max} />
          <span style={{ color: 'var(--text-faint)' }}>
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 animate-slide-up">
          <p className="text-sm leading-relaxed mb-3 pl-11" style={{ color: 'var(--text-muted)' }}>
            {section.description}
          </p>

          <div className="pl-11">
            {/* Contextual nudges */}
            {section.theTurnHint && <TheTurnNudge theTurn={theTurn} />}
            {section.aimHint && <AimHint aim={aim} />}

            <button
              onClick={() => setShowTips(!showTips)}
              className="flex items-center gap-1.5 text-xs mb-3 transition-colors"
              style={{ color: 'var(--gold)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--gold-bright)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--gold)'}
            >
              <Sparkles size={12} />
              {showTips ? 'Hide tips' : 'Show writing tips'}
            </button>

            {showTips && (
              <PromptCard prompts={section.tips} title="Tips for this section" className="mb-3" />
            )}

            <TextArea
              value={value}
              onChange={onChange}
              placeholder={section.placeholder}
              rows={section.id === 'gospelBridge' ? 6 : 4}
              showCount
            />

            <div className="flex items-center justify-between mt-1">
              <span className="text-xs" style={{ color: 'var(--text-ghost)' }}>
                Target: {min}–{max} words
              </span>
              {tooLong && (
                <span className="text-xs" style={{ color: '#f87171' }}>Consider trimming</span>
              )}
              {tooShort && count > 0 && (
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Keep going...</span>
              )}
              {inRange && (
                <span className="text-xs" style={{ color: '#4ade80' }}>Good length</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Step6Workshop() {
  const { state, dispatch } = useHomily()

  function handleSectionChange(sectionId, value) {
    dispatch({ type: 'SET_FRAMEWORK_SECTION', section: sectionId, value })
  }

  function handleNext() {
    dispatch({ type: 'COMPLETE_STEP', step: 6, nextStep: 7 })
  }

  const totalWords = Object.values(state.framework).reduce((sum, v) => sum + wordCount(v), 0)
  const readingMins = estimateReadingTime(Object.values(state.framework).join(' '))

  const timeColor = readingMins >= 5 && readingMins <= 10
    ? '#4ade80'
    : readingMins < 5 && totalWords > 0
    ? '#eab308'
    : readingMins > 10
    ? '#f87171'
    : 'var(--text-primary)'

  return (
    <div className="animate-slide-up">
      <SectionHeader
        step={6}
        label="The Workshop"
        title="Build the homily"
        subtitle="Follow the framework section by section. Each piece does a specific job — trust the structure."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-6 items-start">

        {/* LEFT — sticky: all readings */}
        <div className="lg:sticky lg:top-28">
          <ReadingsPanel readings={state.readings} maxHeight="80vh" />
        </div>

        {/* RIGHT — all workshop content */}
        <div>

          {/* The Aim — always visible at top */}
          <AimAnchor aim={state.homilyAim} />

          {/* Context chips */}
          {(state.tone || state.theme) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {state.tone && (
                <span
                  className="px-3 py-1 rounded-full text-xs border"
                  style={{ borderColor: 'var(--gold-border)', color: 'var(--gold)', background: 'var(--gold-bg)' }}
                >
                  Tone: {state.tone}
                </span>
              )}
              {state.theme && (
                <span
                  className="px-3 py-1 rounded-full text-xs border"
                  style={{ borderColor: 'var(--border-medium)', color: 'var(--text-muted)' }}
                >
                  Theme: {state.theme}
                </span>
              )}
              {state.sundayName && (
                <span
                  className="px-3 py-1 rounded-full text-xs border"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-faint)' }}
                >
                  {state.sundayName}
                </span>
              )}
            </div>
          )}

          {/* Story import banner — only if no story in Workshop yet */}
          {state.personalStory && !state.framework.openingStory && (
            <div
              className="flex items-center justify-between rounded-lg p-3 mb-4 text-sm border"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-medium)' }}
            >
              <p style={{ color: 'var(--text-muted)' }}>Your story from Step 4 is ready — bring it in to start.</p>
              <button
                onClick={() => handleSectionChange('openingStory', state.personalStory)}
                className="text-xs font-medium ml-3 flex-shrink-0 transition-colors"
                style={{ color: 'var(--gold)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--gold-bright)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--gold)'}
              >
                Import story →
              </button>
            </div>
          )}

          {/* Verbum clips banner — shown when clips exist and Insight not yet written */}
          {state.synthesis?.verbumClips?.length > 0 && !state.framework.gospelInsight && (
            <div
              className="flex items-start justify-between rounded-lg p-3 mb-4 text-sm border"
              style={{ background: 'var(--gold-bg)', borderColor: 'var(--gold-border)' }}
            >
              <div>
                <p className="font-medium mb-0.5" style={{ color: 'var(--gold)' }}>
                  {state.synthesis.verbumClips.length} Verbum clip{state.synthesis.verbumClips.length > 1 ? 's' : ''} ready
                </p>
                <p style={{ color: 'var(--text-muted)' }}>
                  Use them in section 4 — The Insight.
                </p>
              </div>
              <button
                onClick={() => {
                  const clips = state.synthesis.verbumClips
                  const clipText = clips.map(c => `"${c.headline}" — ${c.body}`).join('\n\n')
                  handleSectionChange('gospelInsight', clipText)
                }}
                className="text-xs font-medium ml-3 flex-shrink-0 mt-0.5 transition-colors"
                style={{ color: 'var(--gold)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--gold-bright)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--gold)'}
              >
                Import clips →
              </button>
            </div>
          )}

          {/* Framework sections */}
          <div className="space-y-3">
            {/* Opening */}
            {['openingStory', 'preview'].map(id => {
              const section = FRAMEWORK_SECTIONS.find(s => s.id === id)
              return (
                <FrameworkSection
                  key={section.id}
                  section={section}
                  value={state.framework[section.id]}
                  onChange={(val) => handleSectionChange(section.id, val)}
                  theTurn={state.lectioNotes?.theTurn}
                  aim={state.homilyAim}
                />
              )
            })}

            {/* The Heart — three sub-sections grouped */}
            <div
              className="rounded-xl border"
              style={{ borderColor: 'var(--border-medium)', background: 'var(--bg-inset)' }}
            >
              {/* Heart header */}
              <div
                className="flex items-center gap-3 px-4 pt-4 pb-3"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <div
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider"
                  style={{ background: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}
                >
                  The Heart
                </div>
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  Three sections that form the center of the homily
                </p>
              </div>

              {/* Sub-sections */}
              <div className="p-3 space-y-3">
                {['gospelAnchor', 'gospelInsight', 'gospelBridge'].map(id => {
                  const section = FRAMEWORK_SECTIONS.find(s => s.id === id)
                  return (
                    <FrameworkSection
                      key={section.id}
                      section={section}
                      value={state.framework[section.id]}
                      onChange={(val) => handleSectionChange(section.id, val)}
                      theTurn={state.lectioNotes?.theTurn}
                      aim={state.homilyAim}
                    />
                  )
                })}
              </div>
            </div>

            {/* Closing */}
            {['mission', 'closeLoop'].map(id => {
              const section = FRAMEWORK_SECTIONS.find(s => s.id === id)
              return (
                <FrameworkSection
                  key={section.id}
                  section={section}
                  value={state.framework[section.id]}
                  onChange={(val) => handleSectionChange(section.id, val)}
                  theTurn={state.lectioNotes?.theTurn}
                  aim={state.homilyAim}
                />
              )
            })}
          </div>

          {/* Word count footer */}
          <div
            className="mt-6 flex items-center justify-between rounded-lg p-4 border"
            style={{ background: 'var(--bg-inset)', borderColor: 'var(--border-subtle)' }}
          >
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-faint)' }}>Total length</p>
              <p className="text-2xl font-serif font-medium" style={{ color: 'var(--text-primary)' }}>
                {totalWords}{' '}
                <span className="text-sm" style={{ color: 'var(--text-faint)' }}>words</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs mb-1" style={{ color: 'var(--text-faint)' }}>Est. delivery time</p>
              <p className="text-2xl font-serif font-medium" style={{ color: timeColor }}>
                {readingMins}{' '}
                <span className="text-sm" style={{ color: 'var(--text-faint)' }}>min</span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-ghost)' }}>Target: 5–10 min</p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => dispatch({ type: 'GO_TO_STEP', step: 5 })} className="btn-ghost">
              ← Back
            </button>
            <button onClick={handleNext} className="btn-primary">
              {totalWords >= 50 ? 'Preach It →' : 'Build the Homily →'}
            </button>
          </div>

        </div>{/* end right column */}
      </div>{/* end grid */}
    </div>
  )
}
