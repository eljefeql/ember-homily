import { useState, useEffect, useRef } from 'react'
import { useHomily } from '../../context/HomilyContext'
import { getInsightsForPassage, INSIGHT_TYPES } from '../../data/verbumInsights'
import { cn } from '../../lib/utils'
import { X, ExternalLink, ClipboardCheck, BookMarked, RefreshCw, Loader2 } from 'lucide-react'

const CACHE_PREFIX = 'verbum-live-'
const CACHE_TTL_DAYS = 7

// ── Cache helpers ─────────────────────────────────────────────────────────────

function cacheKey(ref) {
  return CACHE_PREFIX + ref.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_:.-]/g, '')
}

function loadCache(ref) {
  try {
    const raw = localStorage.getItem(cacheKey(ref))
    if (!raw) return null
    const { insights, timestamp } = JSON.parse(raw)
    const ageDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24)
    if (ageDays > CACHE_TTL_DAYS) return null
    return insights
  } catch {
    return null
  }
}

function saveCache(ref, insights) {
  try {
    localStorage.setItem(cacheKey(ref), JSON.stringify({
      insights,
      timestamp: Date.now(),
    }))
  } catch { /* quota exceeded — ignore */ }
}

function cacheAge(ref) {
  try {
    const raw = localStorage.getItem(cacheKey(ref))
    if (!raw) return null
    const { timestamp } = JSON.parse(raw)
    const hours = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60))
    if (hours < 1) return 'just now'
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  } catch { return null }
}

// ── Insight Card ──────────────────────────────────────────────────────────────

function InsightCard({ insight, onClip, clipped }) {
  const meta = INSIGHT_TYPES[insight.type] ?? INSIGHT_TYPES.commentary

  return (
    <div className="insight-card mb-3 last:mb-0">
      {/* Type badge + source */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          {meta.icon} {meta.label}
        </span>
        <a
          href={insight.verbumUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] transition-colors"
          style={{ color: 'var(--text-ghost)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-ghost)'}
          title="Open in Verbum"
        >
          Verbum <ExternalLink size={9} />
        </a>
      </div>

      {/* Headline */}
      <p
        className="font-serif font-medium leading-snug mb-2"
        style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}
      >
        {insight.headline}
      </p>

      {/* Keyword chip */}
      {insight.keyword && (
        <div className="flex items-baseline gap-2 mb-2.5">
          <span
            className="font-serif text-sm italic px-2 py-0.5 rounded"
            style={{
              color: 'var(--gold)',
              background: 'var(--gold-bg)',
              border: '1px solid var(--gold-border)',
            }}
          >
            {insight.keyword}
          </span>
          {insight.keywordTranslit && (
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
              {insight.keywordTranslit}
            </span>
          )}
        </div>
      )}

      {/* Body */}
      <p
        className="text-sm leading-relaxed mb-3"
        style={{ color: 'var(--text-muted)' }}
      >
        {insight.body}
      </p>

      {/* Footer: source + clip button */}
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] italic truncate mr-2"
          style={{ color: 'var(--text-ghost)' }}
        >
          {insight.source}
        </span>
        <button
          onClick={() => onClip(insight)}
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-all flex-shrink-0',
            clipped
              ? 'bg-green-900/30 text-green-400 border border-green-800/40'
              : 'border transition-colors'
          )}
          style={clipped ? {} : {
            borderColor: 'var(--gold-border)',
            color: 'var(--gold)',
            background: 'transparent',
          }}
          onMouseEnter={e => {
            if (!clipped) e.currentTarget.style.background = 'var(--gold-bg)'
          }}
          onMouseLeave={e => {
            if (!clipped) e.currentTarget.style.background = 'transparent'
          }}
        >
          <ClipboardCheck size={11} />
          {clipped ? 'Clipped' : 'Clip to workshop'}
        </button>
      </div>
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export default function VerbumScholarPanel() {
  const { state, dispatch } = useHomily()
  const [open, setOpen] = useState(false)
  const [clippedIds, setClippedIds] = useState(new Set())

  // Live data state
  const [liveInsights, setLiveInsights] = useState(null)   // null = not loaded yet
  const [fetchStatus, setFetchStatus] = useState('idle')   // idle | loading | done | error | no-cookies
  const [lastFetched, setLastFetched] = useState(null)
  const fetchedRef = useRef('')                             // tracks which ref we've already fetched

  const VISIBLE_STEPS = [3, 5, 6]
  const isVisible = VISIBLE_STEPS.includes(state.currentStep)

  // Derive gospel info from readings
  const gospel = state.readings.find(r => r.id === 'gospel')
  const gospelRef = gospel?.reference ?? ''
  const gospelText = gospel?.text ?? ''
  const verseCount = gospelText
    ? gospelText.split('\n').filter(l => l.trim().length > 0).length
    : 10
  const themeSet = Boolean(state.theme)
  const season = state.liturgicalSeason || ''

  // Stub fallback from static data
  const stubInsights = getInsightsForPassage(gospelRef, verseCount, themeSet, season)

  // Displayed insights: live if available, stubs otherwise
  const insights = liveInsights ?? stubInsights
  const isLive = Boolean(liveInsights)

  // ── Auto-fetch on new passage ──────────────────────────────────────────────
  // NOTE: this useEffect must stay BELOW the early return guard removal —
  // all hooks must always be called, so we guard with isVisible inside the effect
  useEffect(() => {
    if (!gospelRef || !isVisible || gospelRef === fetchedRef.current) return

    // Check cache first
    const cached = loadCache(gospelRef)
    if (cached) {
      setLiveInsights(cached)
      setFetchStatus('done')
      setLastFetched(cacheAge(gospelRef))
      fetchedRef.current = gospelRef
      return
    }

    // Auto-fetch in background after a short human-like delay
    const timer = setTimeout(() => {
      doFetch(gospelRef)
    }, 1500 + Math.random() * 1000)

    return () => clearTimeout(timer)
  }, [gospelRef]) // eslint-disable-line react-hooks/exhaustive-deps

  async function doFetch(ref) {
    if (!ref) return
    setFetchStatus('loading')
    fetchedRef.current = ref

    try {
      const res = await fetch(`/api/verbum?passage=${encodeURIComponent(ref)}`, {
        signal: AbortSignal.timeout(50000),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()

      if (Array.isArray(data) && data.length > 0) {
        saveCache(ref, data)
        setLiveInsights(data)
        setFetchStatus('done')
        setLastFetched('just now')
      } else if (Array.isArray(data) && data.length === 0) {
        // Empty array = scraper ran but no cookies or Logos session issue
        setFetchStatus('no-cookies')
      } else {
        setFetchStatus('error')
      }
    } catch (err) {
      // Check if it's a "no cookies" error from the error message
      const msg = err?.message || ''
      if (msg.includes('no-cookies') || msg.includes('ENOENT')) {
        setFetchStatus('no-cookies')
      } else {
        setFetchStatus('error')
      }
    }
  }

  function handleRefresh() {
    // Clear cache and re-fetch
    try { localStorage.removeItem(cacheKey(gospelRef)) } catch { /* ignore */ }
    setLiveInsights(null)
    fetchedRef.current = ''
    doFetch(gospelRef)
  }

  function handleClip(insight) {
    dispatch({
      type: 'ADD_VERBUM_CLIP',
      clip: {
        headline: insight.headline,
        keyword: insight.keyword || '',
        body: insight.body,
        source: insight.source,
        type: insight.type,
      },
    })
    setClippedIds(prev => new Set([...prev, insight.headline]))
  }

  // Guard: only render on visible steps — but AFTER all hooks above
  if (!isVisible) return null

  return (
    <>
      {/* Trigger tab — vertical pill on the right edge */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="scholar-trigger"
          aria-label="Open Verbum Scholar panel"
        >
          <BookMarked size={13} style={{ color: 'var(--gold)' }} />
          <span
            className="font-semibold tracking-widest"
            style={{
              fontSize: '0.6rem',
              color: 'var(--text-muted)',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)',
              letterSpacing: '0.15em',
            }}
          >
            VERBUM
          </span>
        </button>
      )}

      {/* Panel */}
      <aside
        className={cn('scholar-panel no-print', !open && 'closed')}
        aria-hidden={!open}
      >
        {/* Panel header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2.5">
            <BookMarked size={15} style={{ color: 'var(--gold)' }} />
            <div>
              <p
                className="text-sm font-semibold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Verbum Scholar
              </p>
              {gospelRef && (
                <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                  {gospelRef}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Refresh button */}
            {gospelRef && fetchStatus !== 'loading' && (
              <button
                onClick={handleRefresh}
                className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                style={{ color: 'var(--text-faint)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--bg-hover)'
                  e.currentTarget.style.color = 'var(--gold)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-faint)'
                }}
                title="Refresh from Logos"
              >
                <RefreshCw size={12} />
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-faint)' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--bg-hover)'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-faint)'
              }}
              aria-label="Close panel"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div
          className="px-5 py-2 flex-shrink-0 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-inset)' }}
        >
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            {insights.length} insight{insights.length !== 1 ? 's' : ''} ·{' '}
            {themeSet ? 'theme set' : 'no theme yet'} ·{' '}
            {verseCount} verses
          </p>
          {/* Data source indicator */}
          {fetchStatus === 'loading' && (
            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--gold)' }}>
              <Loader2 size={9} className="animate-spin" />
              Loading from Logos…
            </span>
          )}
          {fetchStatus === 'done' && isLive && (
            <span className="text-[10px]" style={{ color: 'var(--gold)' }}>
              ✦ Live · {lastFetched}
            </span>
          )}
          {fetchStatus === 'no-cookies' && (
            <span className="text-[10px]" style={{ color: 'var(--text-ghost)' }}>
              stub data
            </span>
          )}
        </div>

        {/* No-cookies setup prompt */}
        {fetchStatus === 'no-cookies' && (
          <div
            className="mx-4 mt-4 rounded-lg p-3 text-xs leading-relaxed flex-shrink-0"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
          >
            <p className="font-medium mb-1" style={{ color: 'var(--gold)' }}>Connect to Logos</p>
            <p>Run this once in your terminal to enable live Logos data:</p>
            <code
              className="block mt-2 px-2 py-1 rounded text-[10px]"
              style={{ background: 'var(--bg-inset)', color: 'var(--text-body)' }}
            >
              node scripts/verbumLogin.js
            </code>
          </div>
        )}

        {/* Scrollable insight list */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
          {insights.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
                No insights found for this passage.
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-ghost)' }}>
                Add readings in Step 2 to unlock Scholar.
              </p>
            </div>
          ) : (
            insights.map((insight, i) => (
              <InsightCard
                key={`${insight.type}-${i}`}
                insight={insight}
                onClip={handleClip}
                clipped={clippedIds.has(insight.headline)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 flex-shrink-0"
          style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-inset)' }}
        >
          <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-ghost)' }}>
            Clips go to your <span style={{ color: 'var(--gold-dim)' }}>Gathered Insights</span> in Step 5.
            Full resources open in Verbum.
          </p>
        </div>
      </aside>
    </>
  )
}
