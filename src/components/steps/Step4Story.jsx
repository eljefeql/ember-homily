import { useHomily } from '../../context/HomilyContext'
import SectionHeader from '../ui/SectionHeader'
import TextArea from '../ui/TextArea'
import PromptCard from '../ui/PromptCard'
import ReadingsPanel from '../ui/ReadingsPanel'

const STORY_PROMPTS = [
  'Think of a specific moment — not a general experience, a specific one. A conversation, a scene you witnessed, something someone said.',
  'It does not need to be dramatic. It needs to be honest and human.',
  'A moment from your own life carries more weight than anything you\'ve read or heard.',
]

const CONNECTION_PROMPTS = [
  'What is the thread connecting your story to the Gospel?',
  'What does your story illuminate about what Jesus is doing or saying?',
  'If someone heard your story and then heard the Gospel, what would click into place for them?',
]

export default function Step4Story() {
  const { state, dispatch } = useHomily()

  function handleNext() {
    dispatch({ type: 'COMPLETE_STEP', step: 4, nextStep: 5 })
  }

  return (
    <div className="animate-slide-up">
      <SectionHeader
        step={4}
        label="The Anchor"
        title="Your story"
        subtitle="The homily opens with a brief, specific, personal moment. This is where we find it."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6 items-start">

        {/* LEFT — sticky: all readings */}
        <div className="lg:sticky lg:top-28">
          <ReadingsPanel readings={state.readings} maxHeight="75vh" />
        </div>

        {/* RIGHT — story work */}
        <div className="space-y-6">
        {/* Story input */}
        <div className="step-card">
          <h3 className="font-serif text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
            Find the moment
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            What memory or moment surfaced as you read or reflected on the Gospel?
          </p>
          <PromptCard prompts={STORY_PROMPTS} title="Some nudges" />
          <div className="mt-4">
            <TextArea
              value={state.personalStory}
              onChange={(val) => dispatch({ type: 'SET_STORY', value: val })}
              placeholder="Describe the moment here — raw and unpolished is fine. You'll shape it later."
              rows={5}
              showCount
              maxWords={200}
              hint="Aim for 50–150 words in the final homily. Write more here and trim later."
            />
          </div>
        </div>

        {/* Connection input — appears once story has content */}
        {state.personalStory && (
          <div
            className="step-card animate-slide-up border-l-4"
            style={{ borderLeftColor: 'var(--gold)' }}
          >
            <h3 className="font-serif text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
              Make the connection
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Why does this story matter for this Gospel, this week?
            </p>
            <PromptCard prompts={CONNECTION_PROMPTS} title="Dig deeper" />
            <div className="mt-4">
              <TextArea
                value={state.storyConnection}
                onChange={(val) => dispatch({ type: 'SET_STORY_CONNECTION', value: val })}
                placeholder="This story connects to the Gospel because..."
                rows={4}
                showCount
              />
            </div>
          </div>
        )}

        {/* Congregation moment — appears once story + connection have content */}
        {state.storyConnection && (
          <div
            className="step-card animate-slide-up border-l-4"
            style={{ borderLeftColor: 'var(--border-medium)' }}
          >
            <h3 className="font-serif text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
              Who are you preaching to this week?
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Not your congregation in general — a specific person or moment. One face you're thinking of, or something happening in your community right now. This travels with you through every step.
            </p>
            <TextArea
              value={state.congregationMoment}
              onChange={(val) => dispatch({ type: 'SET_CONGREGATION_MOMENT', value: val })}
              placeholder="Maria, who lost her husband last month and sat in the third row looking at her hands… or: Our community is three weeks into a pastoral crisis and people are raw…"
              rows={3}
              showCount
            />
          </div>
        )}

        {/* Tip box */}
        <div
          className="rounded-lg p-4 text-sm leading-relaxed border"
          style={{ background: 'var(--bg-inset)', borderColor: 'var(--border-subtle)' }}
        >
          <p className="font-medium mb-1" style={{ color: 'var(--text-body)' }}>
            What if I can't think of one?
          </p>
          <p style={{ color: 'var(--text-muted)' }}>
            Start with a question:{' '}
            <em style={{ color: 'var(--text-body)' }}>"When was the last time I was surprised by someone's mercy?"</em>{' '}
            or{' '}
            <em style={{ color: 'var(--text-body)' }}>"What's the most recent moment I felt genuinely seen?"</em>{' '}
            The story doesn't need to be yours alone — a conversation you witnessed, something a parishioner shared, a small moment in the street.
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <button onClick={() => dispatch({ type: 'GO_TO_STEP', step: 3 })} className="btn-ghost">
            ← Back
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch({ type: 'COMPLETE_STEP', step: 4, nextStep: 5 })}
              className="btn-ghost"
              style={{ color: 'var(--text-faint)' }}
            >
              Skip for now
            </button>
            <button onClick={handleNext} className="btn-primary">
              The Plan →
            </button>
          </div>
        </div>

        </div>{/* end right column */}
      </div>{/* end grid */}
    </div>
  )
}
