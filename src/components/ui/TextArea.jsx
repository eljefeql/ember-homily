import { cn } from '../../lib/utils'
import { wordCount } from '../../lib/utils'

export default function TextArea({
  value,
  onChange,
  placeholder,
  rows = 5,
  showCount = false,
  maxWords,
  className,
  label,
  hint,
  readOnly = false,
}) {
  const count = wordCount(value)
  const overLimit = maxWords && count > maxWords

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium" style={{ color: 'var(--text-body)' }}>{label}</label>
      )}
      {hint && (
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-faint)' }}>{hint}</p>
      )}
      <textarea
        value={value}
        onChange={readOnly ? undefined : (e) => onChange(e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          'textarea-field',
          overLimit && 'border-red-900/60',
          readOnly && 'opacity-80 cursor-default',
          className
        )}
      />
      {showCount && (
        <div className={cn(
          'text-right',
          overLimit ? 'text-red-700' : 'text-[var(--text-ghost)]'
        )} style={{ fontSize: '0.7rem' }}>
          {count}{maxWords ? ` / ${maxWords}` : ''} words
        </div>
      )}
    </div>
  )
}
