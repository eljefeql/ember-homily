import { useHomily } from '../../context/HomilyContext'
import { cn } from '../../lib/utils'
import { Check } from 'lucide-react'

const STEPS = [
  { number: 1, label: 'Date' },
  { number: 2, label: 'Readings' },
  { number: 3, label: 'Lectio' },
  { number: 4, label: 'Story' },
  { number: 5, label: 'The Plan' },
  { number: 6, label: 'Workshop' },
  { number: 7, label: 'Preach' },
]

export default function StepNav() {
  const { state, dispatch } = useHomily()

  const canNavigate = (stepNum) => {
    if (stepNum === 1) return true
    return state.completedSteps.includes(stepNum - 1) || state.completedSteps.includes(stepNum)
  }

  return (
    <nav className="flex items-center justify-center py-3 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-0 flex-nowrap min-w-0">
        {STEPS.map((step, i) => {
          const isDone = state.completedSteps.includes(step.number)
          const isCurrent = state.currentStep === step.number
          const isAccessible = canNavigate(step.number)

          // Button text color
          const buttonColor = isCurrent
            ? '#0d1520'                        // dark text on gold pill
            : isDone
            ? 'var(--text-muted)'
            : isAccessible
            ? 'var(--text-faint)'
            : 'var(--text-ghost)'

          // Badge bg + text
          const badgeBg = isCurrent
            ? 'var(--bg-inset)'
            : isDone
            ? 'var(--border-subtle)'
            : 'transparent'

          const badgeColor = isCurrent
            ? 'var(--gold)'
            : isDone
            ? 'var(--text-muted)'
            : isAccessible
            ? 'var(--text-faint)'
            : 'var(--text-ghost)'

          const badgeBorder = isCurrent
            ? 'transparent'
            : isDone
            ? 'transparent'
            : 'var(--border-medium)'

          return (
            <div key={step.number} className="flex items-center flex-shrink-0">
              <button
                onClick={() => isAccessible && dispatch({ type: 'GO_TO_STEP', step: step.number })}
                disabled={!isAccessible}
                title={step.label}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap',
                  !isAccessible && 'opacity-30 cursor-not-allowed',
                  isAccessible && !isCurrent && 'cursor-pointer',
                )}
                style={{
                  background: isCurrent ? 'var(--gold)' : 'transparent',
                  color: buttonColor,
                }}
              >
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 transition-all border"
                  style={{
                    background: badgeBg,
                    color: badgeColor,
                    borderColor: badgeBorder,
                  }}
                >
                  {isDone && !isCurrent ? <Check size={8} strokeWidth={3} /> : step.number}
                </span>
                <span>{step.label}</span>
              </button>

              {i < STEPS.length - 1 && (
                <div
                  className="w-5 h-px flex-shrink-0"
                  style={{ background: isDone ? 'var(--border-medium)' : 'var(--border-subtle)' }}
                />
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
