import { Target } from 'lucide-react'

/**
 * AimAnchor — the persistent one-sentence purpose statement
 * shown at the top of Step 6 (Workshop) and Step 7 (Preach).
 *
 * Props:
 *   aim: { action: string, because: string }
 *   compact: boolean — slim version for the Preach step
 */
export default function AimAnchor({ aim, compact = false }) {
  if (!aim?.action && !aim?.because) return null

  const hasBoth = aim.action && aim.because

  if (compact) {
    return (
      <div
        className="flex items-start gap-2.5 rounded-lg px-4 py-3 mb-5 no-print"
        style={{
          background: 'var(--gold-bg)',
          border: '1px solid var(--gold-border)',
        }}
      >
        <Target size={13} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
        <p className="text-xs font-serif italic leading-relaxed" style={{ color: 'var(--text-body)' }}>
          {hasBoth
            ? <>After this homily, I want my congregation to{' '}
                <span style={{ color: 'var(--gold)' }}>{aim.action}</span>
                {' '}because{' '}
                <span style={{ color: 'var(--gold)' }}>{aim.because}</span>.
              </>
            : aim.action || aim.because
          }
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-4 mb-6 border-l-4 no-print"
      style={{
        borderLeftColor: 'var(--gold)',
        background: 'var(--gold-bg)',
        border: '1px solid var(--gold-border)',
        borderLeft: '4px solid var(--gold)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Target size={14} style={{ color: 'var(--gold)' }} />
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--gold)' }}
        >
          The Aim
        </p>
      </div>
      <p className="text-sm font-serif italic leading-relaxed" style={{ color: 'var(--text-primary)' }}>
        {hasBoth
          ? <>
              "After this homily, I want my congregation to{' '}
              <span style={{ color: 'var(--gold)' }}>{aim.action}</span>
              {' '}because{' '}
              <span style={{ color: 'var(--gold)' }}>{aim.because}</span>."
            </>
          : aim.action
            ? `"I want my congregation to ${aim.action}."`
            : `"…because ${aim.because}."`
        }
      </p>
    </div>
  )
}
