import { useState } from 'react'
import { useHomily } from '../../context/HomilyContext'
import { getLiturgicalSeason, getLiturgicalYear, getSundayName } from '../../data/lectionary'
import { FIXED_FEAST_NAMES } from '../../data/specialReadings'
import { formatDate } from '../../lib/utils'
import SectionHeader from '../ui/SectionHeader'
import { CalendarDays, Church, Search } from 'lucide-react'

const TRADITIONS = [
  { id: 'Catholic', label: 'Roman Catholic' },
  { id: 'Episcopal', label: 'Episcopal / Anglican' },
]

const OCCASIONS = [
  'Sunday Mass',
  'Daily Mass',
  'Ash Wednesday',
  'Holy Day / Feast',
  'Funeral Mass',
  'Wedding',
  "Children's Mass",
  'School Mass',
  'Retreat',
  'Vigil',
  'Other',
]

// Occasions that bypass the normal date → lectionary flow
const PICKER_OCCASIONS = ['Wedding', 'Funeral Mass']
const FEAST_OCCASIONS = ['Holy Day / Feast', 'Ash Wednesday']

export default function Step1Date() {
  const { state, dispatch } = useHomily()
  const [feastQuery, setFeastQuery] = useState(state.feastName || '')
  const [feastSuggestions, setFeastSuggestions] = useState([])

  function handleDateChange(e) {
    const date = e.target.value
    if (!date) return
    const season = getLiturgicalSeason(date)
    const litYear = getLiturgicalYear(date)
    const sundayName = getSundayName(date)
    dispatch({
      type: 'SET_DATE_INFO',
      payload: { date, liturgicalSeason: season, liturgicalYear: litYear, sundayName },
    })
  }

  function handleOccasionChange(o) {
    dispatch({ type: 'SET_DATE_INFO', payload: { occasion: o } })
    // Reset picker mode when occasion changes
    dispatch({ type: 'SET_PICKER_MODE', value: 'standard' })
    // Reset feast name if switching away from feast
    if (!FEAST_OCCASIONS.includes(o)) {
      setFeastQuery('')
      dispatch({ type: 'SET_DATE_INFO', payload: { feastName: '' } })
    }
    // Auto-set feastName for Ash Wednesday
    if (o === 'Ash Wednesday') {
      setFeastQuery('Ash Wednesday')
      dispatch({ type: 'SET_DATE_INFO', payload: { feastName: 'Ash Wednesday' } })
    }
  }

  function handleFeastSearch(query) {
    setFeastQuery(query)
    if (query.length < 2) {
      setFeastSuggestions([])
      return
    }
    const matches = FIXED_FEAST_NAMES.filter(name =>
      name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 6)
    setFeastSuggestions(matches)
  }

  function selectFeast(name) {
    setFeastQuery(name)
    setFeastSuggestions([])
    dispatch({ type: 'SET_DATE_INFO', payload: { feastName: name } })
  }

  function handleNext() {
    // Reset readings so Step2 re-resolves with current occasion
    dispatch({ type: 'SET_READINGS', payload: [] })
    dispatch({ type: 'COMPLETE_STEP', step: 1, nextStep: 2 })
  }

  const canProceed = (() => {
    if (PICKER_OCCASIONS.includes(state.occasion)) return true // weddings/funerals don't need a date
    if (FEAST_OCCASIONS.includes(state.occasion)) return state.feastName?.trim() || state.date
    return Boolean(state.date)
  })()

  const seasonColors = {
    'Advent': 'text-purple-400',
    'Christmas': 'text-yellow-300',
    'Lent': 'text-purple-400',
    'Easter': 'text-yellow-300',
    'Ordinary Time': 'text-green-400',
    'Pentecost': 'text-red-400',
    'Trinity Sunday': 'text-white',
  }
  const seasonColor = seasonColors[state.liturgicalSeason] || 'text-parchment-200'

  const showFeastSearch = state.occasion === 'Holy Day / Feast'
  const showDatePicker = !PICKER_OCCASIONS.includes(state.occasion) && !FEAST_OCCASIONS.includes(state.occasion)

  return (
    <div className="animate-slide-up max-w-2xl mx-auto">
      <SectionHeader
        step={1}
        label="Begin Here"
        title="When are you preaching?"
        subtitle="We'll pull the readings and liturgical context from the calendar."
      />

      <div className="space-y-6">
        {/* Tradition */}
        <div>
          <label className="section-label block mb-3">Tradition</label>
          <div className="flex gap-3">
            {TRADITIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => dispatch({ type: 'SET_DATE_INFO', payload: { tradition: t.id } })}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all duration-200 text-sm font-medium ${
                  state.tradition === t.id
                    ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                    : 'border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                <Church size={16} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Occasion */}
        <div>
          <label className="section-label block mb-3">Occasion</label>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((o) => (
              <button
                key={o}
                onClick={() => handleOccasionChange(o)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 border ${
                  state.occasion === o
                    ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                    : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        {/* Feast search — shown when Holy Day / Feast selected */}
        {showFeastSearch && (
          <div className="animate-slide-up">
            <label className="section-label block mb-3">
              <span className="flex items-center gap-2">
                <Search size={14} />
                Which feast or solemnity?
              </span>
            </label>
            <div className="relative max-w-sm">
              <input
                type="text"
                value={feastQuery}
                onChange={(e) => handleFeastSearch(e.target.value)}
                placeholder="e.g. Immaculate Conception, All Saints..."
                className="input-field w-full"
                autoFocus
              />
              {feastSuggestions.length > 0 && (
                <div
                  className="absolute z-10 w-full mt-1 rounded-lg border overflow-hidden shadow-lg"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-medium)' }}
                >
                  {feastSuggestions.map(name => (
                    <button
                      key={name}
                      onClick={() => selectFeast(name)}
                      className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                      style={{ color: 'var(--text-body)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
              {state.feastName && (
                <p className="text-xs mt-2" style={{ color: 'var(--gold)' }}>
                  ✓ {state.feastName}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Wedding/Funeral note — no date needed */}
        {PICKER_OCCASIONS.includes(state.occasion) && (
          <div
            className="rounded-lg p-3 text-sm animate-slide-up"
            style={{ background: 'var(--bg-surface)', borderLeft: '3px solid var(--gold)' }}
          >
            <p style={{ color: 'var(--text-muted)' }}>
              {state.occasion === 'Wedding'
                ? "In Step 2, you'll choose from the approved list of readings. The family or couple selects one reading from each category."
                : "In Step 2, you'll choose from the approved funeral readings. The family typically selects one from each category."}
            </p>
          </div>
        )}

        {/* Ash Wednesday note — readings are fixed, no date picker needed */}
        {state.occasion === 'Ash Wednesday' && (
          <div
            className="rounded-lg p-3 text-sm animate-slide-up"
            style={{ background: 'var(--bg-surface)', borderLeft: '3px solid var(--gold)' }}
          >
            <p style={{ color: 'var(--text-muted)' }}>
              The readings for Ash Wednesday are fixed every year: Joel 2, Psalm 51, 2 Corinthians 5–6, and Matthew 6.
            </p>
          </div>
        )}

        {/* Date picker — hidden for wedding/funeral */}
        {showDatePicker && (
          <div>
            <label className="section-label block mb-3">
              <span className="flex items-center gap-2">
                <CalendarDays size={14} />
                Date of Service
              </span>
            </label>
            <input
              type="date"
              value={state.date}
              onChange={handleDateChange}
              className="input-field max-w-xs"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        )}

        {/* Liturgical context — revealed after date selected (for standard Sunday occasions only) */}
        {state.date && state.liturgicalSeason && showDatePicker && !showFeastSearch && !FEAST_OCCASIONS.includes(state.occasion) && (
          <div className="step-card animate-slide-up">
            <div className="flex items-start justify-between">
              <div>
                <p className="section-label mb-1">Liturgical Context</p>
                <p className="font-serif text-xl text-parchment-100">{state.sundayName}</p>
                <p className={`text-sm mt-1 font-medium ${seasonColor}`}>
                  {state.liturgicalSeason} · Year {state.liturgicalYear}
                </p>
                <p className="text-slate-500 text-sm mt-0.5">{formatDate(state.date)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-600">Lectionary Cycle</p>
                <p className="text-3xl font-serif font-bold text-gold-500 leading-none mt-1">
                  {state.liturgicalYear}
                </p>
              </div>
            </div>

            {/* Season description */}
            <div className="divider" />
            <p className="text-sm text-slate-400 leading-relaxed">
              {getSeasonDescription(state.liturgicalSeason)}
            </p>
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-xs text-slate-600">You can always come back and change this.</p>
          {state.completedSteps.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Start a new homily? Your current work will be cleared.')) {
                  dispatch({ type: 'CLEAR_SESSION' })
                }
              }}
              className="text-xs transition-colors"
              style={{ color: 'var(--text-faint)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-muted)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
            >
              Start fresh
            </button>
          )}
        </div>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="btn-primary"
        >
          {PICKER_OCCASIONS.includes(state.occasion) ? 'Choose Readings →' : 'Pull the Readings →'}
        </button>
      </div>
    </div>
  )
}

function getSeasonDescription(season) {
  const descriptions = {
    'Advent': 'Advent is a season of longing and preparation — not yet Christmas, but leaning toward it. The tone is watchful, hopeful, and a little restless. Preachers in Advent are invited to name what we are waiting for.',
    'Christmas': 'The Christmas season extends through the Baptism of the Lord. This is a season of wonder, of the Word made flesh, of God entering ordinary life. The preacher\'s task is to help people notice what has already arrived.',
    'Lent': 'Lent is the great school of conversion. The liturgy invites honesty — about who we are, what we carry, and what we need. The preacher in Lent can afford to be direct. People expect to be invited somewhere demanding.',
    'Easter': 'The fifty days of Easter are a season of astonishment. The resurrection has happened and the disciples are still catching up. Easter preaching should feel alive, even a little disoriented — the world has changed.',
    'Ordinary Time': 'Ordinary Time is not unimportant time — it is the long stretch where faith becomes a way of life. The preacher in Ordinary Time helps people find the sacred in the everyday.',
    'Pentecost': 'Pentecost is the great outpouring — the moment the Spirit falls and the church is born. Preaching on this day is about fire, breath, courage, and being sent.',
    'Trinity Sunday': 'Trinity Sunday invites the preacher not to explain the doctrine but to celebrate the mystery — a God who is community, relationship, love in motion.',
  }
  return descriptions[season] || 'Select a date to see the liturgical context for this celebration.'
}
