import { useEffect, Component } from 'react'
import { Flame } from 'lucide-react'
import { HomilyProvider, useHomily } from './context/HomilyContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import StepNav from './components/ui/StepNav'
import VerbumScholarPanel from './components/ui/VerbumScholarPanel'
import Step1Date from './components/steps/Step1Date'
import Step2Readings from './components/steps/Step2Readings'
import Step3Lectio from './components/steps/Step3Lectio'
import Step4Story from './components/steps/Step4Story'
import Step5Plan from './components/steps/Step5Plan'
import Step6Workshop from './components/steps/Step6Workshop'
import Step7Homily from './components/steps/Step7Homily'

// ── Error boundary — catches render errors and shows a recovery UI ────────────
class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '2rem',
            fontFamily: 'sans-serif',
            background: 'var(--bg-app, #0f0f0f)',
            color: 'var(--text-muted, #888)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '1rem', color: 'var(--text-body, #ccc)' }}>
            Something went wrong rendering the workshop.
          </p>
          <p style={{ fontSize: '0.8rem', opacity: 0.6, maxWidth: 360 }}>
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 1.25rem',
              borderRadius: '6px',
              border: '1px solid var(--gold-border, #7a6030)',
              background: 'var(--gold-bg, #1a1500)',
              color: 'var(--gold, #c9a84c)',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-black/10 dark:hover:bg-white/8 text-[var(--text-muted)] hover:text-[var(--text-body)]"
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      {theme === 'dark' ? (
        /* Sun */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <line x1="12" y1="2" x2="12" y2="5"/>
          <line x1="12" y1="19" x2="12" y2="22"/>
          <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/>
          <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
          <line x1="2" y1="12" x2="5" y2="12"/>
          <line x1="19" y1="12" x2="22" y2="12"/>
          <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>
          <line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        /* Moon */
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  )
}

function WorkshopContent() {
  const { state, dispatch } = useHomily()

  // Dev-only: ?seed=7 or ?seed=8 pre-fills state for quick testing
  useEffect(() => {
    if (import.meta.env.DEV) {
      const param = new URLSearchParams(window.location.search).get('seed')
      if (param) {
        import('./devSeed.js').then(({ seeds }) => {
          const seed = seeds[Number(param)]
          if (seed) dispatch({ type: 'LOAD_SEED', payload: seed })
        })
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const steps = {
    1: <Step1Date />,
    2: <Step2Readings />,
    3: <Step3Lectio />,
    4: <Step4Story />,
    5: <Step5Plan />,
    6: <Step6Workshop />,
    7: <Step7Homily />,
  }

  // Steps 3–6 use a wider container for their split/canvas layouts
  const wideSteps = [3, 4, 5, 6]
  const mainMaxWidth = wideSteps.includes(state.currentStep) ? 'max-w-5xl' : 'max-w-2xl'

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* Header */}
      <header
        className="border-b no-print sticky top-0 z-10 backdrop-blur-sm"
        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'color-mix(in srgb, var(--bg-app) 95%, transparent)' }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo / Brand */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: 'var(--gold-bg)', border: '1px solid var(--gold-border)' }}>
                <Flame size={15} strokeWidth={1.5} style={{ color: 'var(--gold)' }} />
              </div>
              <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Ember</span>
              {state.tradition && (
                <span className="text-xs pl-2.5" style={{ color: 'var(--text-faint)', borderLeft: '1px solid var(--border-subtle)' }}>{state.tradition}</span>
              )}
            </div>

            {/* Right side: occasion + theme toggle */}
            <div className="flex items-center gap-3">
              {state.sundayName && (
                <span className="text-xs font-serif italic hidden sm:block truncate max-w-xs text-right" style={{ color: 'var(--text-muted)' }}>
                  {state.sundayName}
                </span>
              )}
              <ThemeToggle />
            </div>
          </div>

          {/* Step nav sits below the brand bar */}
          <StepNav />
        </div>
      </header>

      {/* Main content — width varies by step */}
      <main className={`flex-1 ${mainMaxWidth} mx-auto w-full px-6 py-10 transition-all duration-300`}>
        {steps[state.currentStep]}
      </main>

      {/* Footer — barely visible */}
      <footer className="py-6 no-print">
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-xs text-center tracking-wide" style={{ color: 'var(--text-ghost)' }}>
            Ember
          </p>
        </div>
      </footer>

      {/* Verbum Scholar — floats over content on steps 3, 5, 6 */}
      <VerbumScholarPanel />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <HomilyProvider>
        <ErrorBoundary>
          <WorkshopContent />
        </ErrorBoundary>
      </HomilyProvider>
    </ThemeProvider>
  )
}
