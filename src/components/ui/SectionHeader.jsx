import { cn } from '../../lib/utils'

export default function SectionHeader({ step, label, title, subtitle, className }) {
  return (
    <div className={cn('mb-10', className)}>
      <div className="flex items-center gap-2.5 mb-3">
        {step && (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-semibold"
            style={{
              background: 'var(--gold-bg)',
              border: '1px solid var(--gold-border)',
              color: 'var(--gold)',
            }}
          >
            {step}
          </div>
        )}
        {label && <span className="section-label">{label}</span>}
      </div>

      <h2
        className="font-serif font-medium leading-tight"
        style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}
      >
        {title}
      </h2>

      {subtitle && (
        <p className="mt-2.5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
