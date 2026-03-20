import { useState } from 'react'
import { BookOpen, Loader2, ExternalLink } from 'lucide-react'
import { useHomily } from '../../context/HomilyContext'

function usccbUrl(date) {
  if (!date) return null
  const [year, month, day] = date.split('-')
  if (!year || !month || !day) return null
  return `https://bible.usccb.org/bible/readings/${month}${day}${year.slice(2)}.cfm`
}

// One collapsible reading row — header always visible, text scrolls inside
function ReadingRow({ label, reference, text, defaultOpen = false, emptyMessage, loading = false }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-t flex-shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-xs px-4 py-3 transition-colors w-full text-left"
        style={{ color: open ? 'var(--text-primary)' : 'var(--text-muted)' }}
      >
        <BookOpen size={11} style={{ flexShrink: 0 }} />
        <span className="section-label truncate">{label}{reference ? ` · ${reference}` : ''}</span>
        <span className="ml-auto flex-shrink-0">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="overflow-y-auto px-4 pb-4" style={{ maxHeight: '26vh' }}>
          {loading && !text ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 size={12} className="animate-spin" style={{ color: 'var(--text-ghost)' }} />
              <p className="text-sm" style={{ color: 'var(--text-ghost)' }}>Loading scripture…</p>
            </div>
          ) : (
            <p className="scripture-text text-sm leading-7 whitespace-pre-line animate-slide-up" style={{ color: 'var(--text-body)' }}>
              {text || emptyMessage || 'Complete Step 2 to load this reading.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Shared left-column panel used by Steps 3–6
// readings: array from state.readings  (ids: gospel, first, psalm, second)
export default function ReadingsPanel({ readings = [], maxHeight = '80vh', loading = false }) {
  const { state } = useHomily()
  const gospel  = readings.find(r => r.id === 'gospel')
  const first   = readings.find(r => r.id === 'first')
  const psalm   = readings.find(r => r.id === 'psalm')
  const second  = readings.find(r => r.id === 'second')

  const [gospelOpen, setGospelOpen] = useState(true)

  return (
    <div
      className="rounded-xl border overflow-hidden flex flex-col"
      style={{ background: 'var(--bg-inset)', borderColor: 'var(--border-subtle)', maxHeight }}
    >
      {/* Gospel — collapsible, open by default, scrollable text */}
      <button
        onClick={() => setGospelOpen(v => !v)}
        className="flex items-center gap-2 px-4 pt-4 pb-3 text-xs w-full text-left flex-shrink-0"
        style={{
          color: gospelOpen ? 'var(--text-primary)' : 'var(--text-muted)',
          borderBottom: gospelOpen ? '1px solid var(--border-subtle)' : 'none',
        }}
      >
        <BookOpen size={13} style={{ color: 'var(--gold)', flexShrink: 0 }} />
        <span className="section-label">Gospel{gospel?.reference ? ` · ${gospel.reference}` : ''}</span>
        <span className="ml-auto flex-shrink-0">{gospelOpen ? '▲' : '▼'}</span>
      </button>

      {gospelOpen && (
        <div className="overflow-y-auto px-4 pb-4" style={{ maxHeight: '40vh' }}>
          {loading && !gospel?.text ? (
            <div className="flex items-center gap-2 py-3">
              <Loader2 size={13} className="animate-spin" style={{ color: 'var(--text-ghost)' }} />
              <p className="text-sm" style={{ color: 'var(--text-ghost)' }}>Loading scripture…</p>
            </div>
          ) : (
            <p className="scripture-text text-sm leading-7 whitespace-pre-line" style={{ color: 'var(--text-body)' }}>
              {gospel?.text || 'Complete Step 2 to load the Gospel text here.'}
            </p>
          )}
        </div>
      )}

      {/* First Reading */}
      {first && (
        <ReadingRow
          label="First Reading"
          reference={first.reference}
          text={first.text}
          emptyMessage="Complete Step 2 to load the First Reading."
          loading={loading}
        />
      )}

      {/* Responsorial Psalm */}
      {psalm && (
        <ReadingRow
          label="Responsorial Psalm"
          reference={psalm.reference}
          text={psalm.text}
          emptyMessage="Complete Step 2 to load the Psalm."
          loading={loading}
        />
      )}

      {/* Second Reading */}
      {second && (
        <ReadingRow
          label="Second Reading"
          reference={second.reference}
          text={second.text}
          emptyMessage="Complete Step 2 to load the Second Reading."
          loading={loading}
        />
      )}

      {/* USCCB official readings link — Catholic only */}
      {state.tradition === 'Catholic' && usccbUrl(state.date) && (
        <div
          className="px-4 py-2 border-t flex-shrink-0"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <a
            href={usccbUrl(state.date)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: 'var(--text-ghost)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-ghost)'}
          >
            <ExternalLink size={10} />
            Official USCCB readings
          </a>
        </div>
      )}
    </div>
  )
}
