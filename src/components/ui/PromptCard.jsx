import { cn } from '../../lib/utils'

export default function PromptCard({ prompts, title, className }) {
  const list = Array.isArray(prompts) ? prompts : [prompts]
  return (
    <div className={cn('prompt-card', className)}>
      {title && (
        <p className="prompt-card-title">{title}</p>
      )}
      <ul className="space-y-1.5 list-none m-0 p-0">
        {list.map((p, i) => (
          <li key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {list.length > 1 ? `· ${p}` : p}
          </li>
        ))}
      </ul>
    </div>
  )
}
