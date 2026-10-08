import { useEffect, useRef, useState } from 'react'
import { useHomily } from '../../context/HomilyContext'
import { getReadingsForOccasion } from '../../data/lectionary'
import { getEpiscopalReadings } from '../../data/episcopalCalendar'
import { WEDDING_READINGS, FUNERAL_READINGS } from '../../data/specialReadings'
import { EPISCOPAL_MARRIAGE, EPISCOPAL_BURIAL } from '../../data/episcopalSpecial'
import { fetchAllReadings } from '../../lib/bibleApi'
import SectionHeader from '../ui/SectionHeader'
import { BookOpen, ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react'

// ─── Alternate lessons ("or …") — click one to read it instead ───────────────
function AlternateChips({ reading, onSwap }) {
  if (!reading.alternates?.length) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
      <span className="text-xs" style={{ color: 'var(--text-ghost)' }}>or</span>
      {reading.alternates.map(alt => (
        <button
          key={alt}
          onClick={() => onSwap(reading.id, alt)}
          className="text-xs px-2 py-0.5 rounded-full border transition-colors"
          style={{ borderColor: 'var(--border-medium)', color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold-border)'; e.currentTarget.style.color = 'var(--gold)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-medium)'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          {alt}
        </button>
      ))}
    </div>
  )
}

// ─── Gospel Card — collapsible, open by default ───────────────────────────────
function GospelCard({ reading, fetching, onSwap }) {
  const [expanded, setExpanded] = useState(true)
  const hasText = Boolean(reading.text?.trim())

  return (
    <div
      className="rounded-xl border"
      style={{ borderColor: 'var(--gold-border)', background: 'var(--bg-surface)' }}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <BookOpen size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
          <div>
            <p className="section-label">{reading.id === 'gospel' && reading.label && reading.label !== 'The Gospel' ? reading.label : 'Gospel'}</p>
            <p className="font-serif text-sm mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {reading.reference}
            </p>
            <AlternateChips reading={reading} onSwap={onSwap} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {fetching && (
            <Loader2 size={13} className="animate-spin" style={{ color: 'var(--text-ghost)' }} />
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1 transition-colors"
            style={{ color: 'var(--text-faint)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-5 animate-slide-up" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          {fetching && !hasText ? (
            <div className="flex items-center gap-2 py-4">
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-ghost)' }} />
              <p className="text-sm" style={{ color: 'var(--text-ghost)' }}>Loading…</p>
            </div>
          ) : hasText ? (
            <p className="scripture-text text-sm whitespace-pre-line leading-7" style={{ color: 'var(--text-body)' }}>
              {reading.text}
            </p>
          ) : (
            <p className="font-serif text-base" style={{ color: 'var(--text-primary)' }}>
              {reading.reference}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Standard Reading Card ────────────────────────────────────────────────────
function ReadingCard({ reading, fetching, onSwap }) {
  const [expanded, setExpanded] = useState(false)
  const hasText = Boolean(reading.text?.trim())

  return (
    <div
      className="rounded-xl border transition-all duration-200"
      style={{
        borderColor: 'var(--border-medium)',
        background: 'var(--bg-surface)',
      }}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <BookOpen size={15} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
          <div>
            <p className="section-label">{reading.label}</p>
            <p className="font-serif text-sm mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {reading.reference}
            </p>
            <AlternateChips reading={reading} onSwap={onSwap} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {fetching && (
            <Loader2 size={12} className="animate-spin" style={{ color: 'var(--text-ghost)' }} />
          )}
          {hasText && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="p-1 transition-colors"
              style={{ color: 'var(--text-faint)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          )}
        </div>
      </div>

      {expanded && hasText && (
        <div className="px-4 pb-4 animate-slide-up" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <p className="scripture-text text-sm whitespace-pre-line leading-7" style={{ color: 'var(--text-body)' }}>
            {reading.text}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Wedding / Funeral Picker ─────────────────────────────────────────────────
const PICKER_SECTIONS = [
  { key: 'oldTestament', id: 'first',  label: 'Old Testament Reading', required: false },
  { key: 'psalms',       id: 'psalm',  label: 'Responsorial Psalm',    required: false },
  { key: 'newTestament', id: 'second', label: 'New Testament Reading', required: false },
  { key: 'gospels',      id: 'gospel', label: 'Gospel',                required: true  },
]

function ReadingPickerSection({ sectionDef, options, selectedRef, onSelect }) {
  const [open, setOpen] = useState(sectionDef.required)

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: selectedRef ? 'var(--gold-border)' : 'var(--border-subtle)', background: 'var(--bg-surface)' }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: selectedRef ? 'var(--gold)' : 'var(--bg-hover)',
              border: selectedRef ? 'none' : '2px solid var(--border-medium)',
            }}
          >
            {selectedRef && <Check size={10} style={{ color: 'var(--bg-app)' }} />}
          </div>
          <div>
            <p className="section-label">{sectionDef.label}</p>
            {selectedRef
              ? <p className="font-serif text-sm mt-0.5" style={{ color: 'var(--text-primary)' }}>{selectedRef}</p>
              : <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>Choose one</p>
            }
          </div>
        </div>
        <span style={{ color: 'var(--text-faint)' }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {open && (
        <div className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          {options.map(option => {
            const isSelected = selectedRef === option.ref
            return (
              <button
                key={option.ref}
                onClick={() => onSelect(isSelected ? null : option.ref)}
                className="w-full text-left px-4 py-3 border-b transition-all last:border-0"
                style={{
                  borderColor: 'var(--border-subtle)',
                  background: isSelected ? 'var(--gold-bg)' : 'transparent',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center border"
                    style={{
                      background: isSelected ? 'var(--gold)' : 'transparent',
                      borderColor: isSelected ? 'var(--gold)' : 'var(--border-medium)',
                    }}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--bg-app)' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-0.5" style={{ color: isSelected ? 'var(--gold)' : 'var(--text-primary)' }}>
                      {option.ref}
                    </p>
                    <p className="text-xs italic leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {option.label}
                    </p>
                    {isSelected && option.shortText && (
                      <p className="text-xs mt-1.5 leading-relaxed font-serif" style={{ color: 'var(--text-faint)' }}>
                        "{option.shortText}"
                      </p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function WeddingFuneralPicker({ mode, tradition, onConfirm }) {
  const episcopal = tradition === 'Episcopal'
  const readingsData = episcopal
    ? (mode === 'wedding' ? EPISCOPAL_MARRIAGE : EPISCOPAL_BURIAL)
    : (mode === 'wedding' ? WEDDING_READINGS : FUNERAL_READINGS)
  const [selections, setSelections] = useState({ first: null, psalm: null, second: null, gospel: null })

  function handleConfirm() {
    const readings = []
    PICKER_SECTIONS.forEach(section => {
      const ref = selections[section.id]
      if (!ref) return
      const chosen = (readingsData[section.key] || []).find(o => o.ref === ref)
      if (chosen) {
        readings.push({
          id: section.id,
          label: section.label,
          reference: chosen.ref,
          translation: '',
          text: '',
          hasShortVersion: false,
          // Episcopal: a BCP psalm range may need a different Bible verse range for its text
          ...(chosen.textRef ? { textRefs: { [chosen.ref]: chosen.textRef } } : {}),
        })
      }
    })
    onConfirm(readings)
  }

  return (
    <div>
      <div
        className="rounded-lg p-3 mb-5 border text-sm"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <p style={{ color: 'var(--text-muted)' }}>
          {episcopal
            ? (mode === 'wedding'
              ? 'Choose one reading from each section. The Gospel is required. These are the lessons appointed in the Book of Common Prayer for the Celebration and Blessing of a Marriage.'
              : 'Choose one reading from each section. The Gospel is required. These are the lessons appointed in the Book of Common Prayer (and Enriching Our Worship 3) for the Burial of the Dead.')
            : mode === 'wedding'
              ? 'Choose one reading from each section. The Gospel is required. All readings are USCCB approved for the Rite of Marriage.'
              : 'Choose one reading from each section. The Gospel is required. All readings are from the Order of Christian Funerals.'}
        </p>
      </div>
      <div className="space-y-3">
        {PICKER_SECTIONS.map(section => (
          <ReadingPickerSection
            key={section.key}
            sectionDef={episcopal && section.id === 'psalm' ? { ...section, label: 'Psalm' } : section}
            options={readingsData[section.key] || []}
            selectedRef={selections[section.id]}
            onSelect={(ref) => setSelections(prev => ({ ...prev, [section.id]: ref }))}
          />
        ))}
      </div>
      <div className="mt-6">
        <button onClick={handleConfirm} disabled={!selections.gospel} className="btn-primary w-full">
          Load These Readings →
        </button>
        {!selections.gospel && (
          <p className="text-xs text-center mt-2" style={{ color: 'var(--text-faint)' }}>
            Select at least the Gospel to continue
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Step2Readings() {
  const { state, dispatch } = useHomily()
  const [resolving, setResolving] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [episcopal, setEpiscopal] = useState(null)   // Episcopal day info (track2Available, also, names)
  // Use a ref so the in-flight guard survives React StrictMode double-invocation
  const fetchingRef = useRef(false)

  const pickerMode = state.pickerMode || 'standard'
  const readings = state.readings || []
  const isSchoolMass = state.occasion === 'School Mass' || state.occasion === "Children's Mass"
  const isEpiscopal = state.tradition === 'Episcopal'
  // Changes when the lessons themselves change (e.g. an alternate is chosen) so text is re-fetched
  const readingsKey = readings.map(r => r.reference).join('|')

  // Step A — resolve references from lectionary when occasion/date changes
  useEffect(() => {
    if (state.occasion === 'Wedding' || state.occasion === 'Funeral Mass') {
      dispatch({ type: 'SET_PICKER_MODE', value: state.occasion === 'Wedding' ? 'wedding' : 'funeral' })
      return
    }
    dispatch({ type: 'SET_READINGS', payload: [] })
    fetchingRef.current = false   // reset guard when readings change
    setResolving(true)
    const timer = setTimeout(() => {
      if (state.tradition === 'Episcopal') {
        const result = getEpiscopalReadings({
          date: state.date,
          occasion: state.occasion,
          feastName: state.feastName,
          track: state.track || 1,
          observe: state.observe,
        })
        setEpiscopal(result)
        dispatch({ type: 'SET_READINGS', payload: result.readings })
        dispatch({ type: 'SET_PICKER_MODE', value: 'standard' })
        setResolving(false)
        return
      }
      setEpiscopal(null)
      const result = getReadingsForOccasion({
        date: state.date,
        occasion: state.occasion,
        tradition: state.tradition,
        liturgicalYear: state.liturgicalYear,
        liturgicalSeason: state.liturgicalSeason,
        feastName: state.feastName,
      })
      if (result.pickerMode === 'standard') {
        dispatch({ type: 'SET_READINGS', payload: result.readings })
        dispatch({ type: 'SET_PICKER_MODE', value: 'standard' })
      }
      setResolving(false)
    }, 300)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.occasion, state.date, state.feastName, state.tradition, state.track, state.observe])

  // Step B — fetch text whenever readings arrive with no text yet
  useEffect(() => {
    if (!readings.length || pickerMode !== 'standard') return
    if (fetchingRef.current) return
    const needsFetch = readings.some(r => !r.text?.trim())
    if (!needsFetch) return

    fetchingRef.current = true
    setFetching(true)
    fetchAllReadings(readings, state.tradition).then(populated => {
      fetchingRef.current = false
      setFetching(false)
      // Episcopal: only fill text into lessons that are still on screen (the preacher may have swapped one meanwhile)
      dispatch(state.tradition === 'Episcopal'
        ? { type: 'MERGE_READING_TEXTS', readings: populated }
        : { type: 'SET_READINGS', payload: populated })
    }).catch(() => {
      fetchingRef.current = false
      setFetching(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readings.length, pickerMode, resolving, readingsKey])

  // After wedding/funeral picker confirm, fetch text for chosen readings
  function handlePickerConfirm(chosenReadings) {
    fetchingRef.current = false   // reset guard for fresh fetch
    dispatch({ type: 'SET_READINGS', payload: chosenReadings })
    dispatch({ type: 'SET_PICKER_MODE', value: 'confirmed' })
  }

  // After picker confirm, also auto-fetch their text
  useEffect(() => {
    if (pickerMode !== 'confirmed') return
    if (!readings.length) return
    const needsFetch = readings.some(r => !r.text?.trim())
    if (!needsFetch) return
    if (fetchingRef.current) return
    fetchingRef.current = true
    setFetching(true)
    fetchAllReadings(readings, state.tradition).then(populated => {
      fetchingRef.current = false
      setFetching(false)
      dispatch({ type: 'SET_READINGS', payload: populated })
    }).catch(() => {
      fetchingRef.current = false
      setFetching(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerMode, readings.length])

  function handleSwap(id, reference) {
    fetchingRef.current = false
    dispatch({ type: 'SWAP_ALTERNATE', id, reference })
  }

  function handleNext() {
    dispatch({ type: 'COMPLETE_STEP', step: 2, nextStep: 3 })
  }

  const showPicker = (pickerMode === 'wedding' || pickerMode === 'funeral') && readings.length === 0
  const showReadings = !showPicker && readings.length > 0
  const gospel = readings.find(r => r.id === 'gospel')
  const otherReadings = readings.filter(r => r.id !== 'gospel')

  const headerSubtitle = (() => {
    if (isEpiscopal && episcopal && !episcopal.notFound && episcopal.entry) {
      const title = episcopal.feastName || episcopal.sundayName || episcopal.entry.name
      const bits = [title, episcopal.year ? `Year ${episcopal.year}` : null,
        episcopal.track2Available ? `Track ${state.track || 1}` : null].filter(Boolean)
      return bits.join(' · ')
    }
    if (isEpiscopal && state.occasion === 'Wedding') return 'Choose from the lessons appointed for the Celebration and Blessing of a Marriage.'
    if (isEpiscopal && state.occasion === 'Funeral Mass') return 'Choose from the lessons appointed for the Burial of the Dead.'
    if (state.occasion === 'Wedding') return 'Choose from the approved readings for the Rite of Marriage.'
    if (state.occasion === 'Funeral Mass') return 'Choose from the approved readings for the Order of Christian Funerals.'
    if (state.feastName) return `Readings for ${state.feastName}`
    if (state.sundayName) return `${state.sundayName}${state.liturgicalYear ? ' · Year ' + state.liturgicalYear : ''}`
    return 'The Gospel is always included. Toggle the others based on what you\'ll preach from.'
  })()

  return (
    <div className="animate-slide-up max-w-2xl mx-auto">
      <SectionHeader
        step={2}
        label="The Word"
        title="This week's readings"
        subtitle={headerSubtitle}
      />

      {/* Episcopal: Track 1 / Track 2 (Season after Pentecost) */}
      {isEpiscopal && !resolving && episcopal?.track2Available && (
        <div className="mb-5">
          <div className="inline-flex rounded-lg border p-0.5" style={{ borderColor: 'var(--border-medium)', background: 'var(--bg-surface)' }}>
            {[
              { n: 1, label: 'Track 1', hint: 'Old Testament read in sequence' },
              { n: 2, label: 'Track 2', hint: 'Old Testament paired with the Gospel' },
            ].map(t => {
              const active = (state.track || 1) === t.n
              return (
                <button
                  key={t.n}
                  onClick={() => dispatch({ type: 'SET_DATE_INFO', payload: { track: t.n } })}
                  className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                  style={{
                    background: active ? 'var(--gold-bg)' : 'transparent',
                    color: active ? 'var(--gold)' : 'var(--text-muted)',
                  }}
                  title={t.hint}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>
            {(state.track || 1) === 1
              ? 'Track 1 reads the Old Testament as a continuous story across the season.'
              : 'Track 2 pairs the Old Testament reading with the Gospel. The Epistle and Gospel are the same on either track.'}
          </p>
        </div>
      )}

      {/* Episcopal: this date can be observed more than one way (e.g. All Saints on a Sunday) */}
      {isEpiscopal && !resolving && episcopal?.also?.length > 0 && (
        <div className="mb-5 rounded-lg border p-3" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--text-faint)' }}>This date can also be observed as:</p>
          <div className="flex flex-wrap gap-2">
            {episcopal.also.map(o => (
              <button
                key={o.key}
                onClick={() => dispatch({ type: 'SET_DATE_INFO', payload: { observe: o.key } })}
                className="text-sm px-3 py-1 rounded-full border transition-colors"
                style={{ borderColor: 'var(--border-medium)', color: 'var(--text-body)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold-border)'; e.currentTarget.style.color = 'var(--gold)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-medium)'; e.currentTarget.style.color = 'var(--text-body)' }}
              >
                {o.name}{o.kind === 'lff' ? ' · Lesser Feast' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading — resolving lectionary references */}
      {resolving && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div
              className="w-8 h-8 border-2 rounded-full animate-spin mx-auto"
              style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }}
            />
            <p className="text-sm" style={{ color: 'var(--text-faint)' }}>Finding readings…</p>
          </div>
        </div>
      )}

      {/* Wedding / Funeral picker */}
      {!resolving && showPicker && (
        <WeddingFuneralPicker mode={pickerMode} tradition={state.tradition} onConfirm={handlePickerConfirm} />
      )}

      {/* Readings */}
      {!resolving && showReadings && (
        <div className="space-y-3">
          {/* Gospel — always first, always open with full text */}
          {gospel && (
            <GospelCard reading={gospel} fetching={fetching} onSwap={handleSwap} />
          )}

          {/* Other readings — toggleable, collapsible */}
          {otherReadings.map(reading => (
            <ReadingCard
              key={reading.id}
              reading={reading}
              fetching={fetching}
              onSwap={handleSwap}
            />
          ))}
        </div>
      )}

      {/* Episcopal: translation note */}
      {isEpiscopal && !resolving && showReadings && (
        <p className="text-xs mt-5 leading-relaxed" style={{ color: 'var(--text-ghost)' }}>
          Lessons and citations follow the Revised Common Lectionary as used in the Episcopal Church. Text is shown in the
          World English Bible (public domain); the lectionary itself prescribes the NRSV, so wording will differ slightly.
          Optional verses are included. Psalm text is from the Bible, not the BCP Psalter.
        </p>
      )}

      {/* Empty state */}
      {!resolving && !showPicker && readings.length === 0 && (
        <div
          className="text-center py-16 rounded-xl border"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-inset)' }}
        >
          <p className="font-serif text-lg mb-2" style={{ color: 'var(--text-faint)' }}>No readings loaded</p>
          <p className="text-sm" style={{ color: 'var(--text-ghost)' }}>
            {isEpiscopal && episcopal?.notFound
              ? 'No Sunday or Holy Day falls on this date. Weekday lessons aren’t included yet — pick a Sunday, or choose Holy Day / Feast.'
              : 'Go back and select a date or occasion.'}
          </p>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button onClick={() => dispatch({ type: 'GO_TO_STEP', step: 1 })} className="btn-ghost">
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={readings.length === 0 || resolving || fetching}
          className="btn-primary"
        >
          {fetching ? 'Loading text…' : 'Begin Reflection →'}
        </button>
      </div>
    </div>
  )
}
