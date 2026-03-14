import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Music, SkipForward } from 'lucide-react'

// All URLs verified live (HTTP 200) on Wikimedia Commons.
// All recordings are public domain (pre-1928 or CC0 licensed).
const TRACKS = [
  {
    id: 'kyrie-xi',
    title: 'Kyrie XI',
    desc: 'Gregorian Chant',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Kyrie_XI.ogg',
  },
  {
    id: 'jesu-joy',
    title: 'Jesu, Joy of Man\'s Desiring',
    desc: 'Bach · BWV 147',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/27/Bach%2C_BWV_147%2C_10._Jesus_bleibet_meine_Freude.ogg',
  },
  {
    id: 'salve-regina',
    title: 'Salve Regina',
    desc: 'Gregorian Chant',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Petits_Chanteurs_de_Passy_-_Salve_Regina_de_Hermann_Contract.ogg',
  },
  {
    id: 'psalm-23',
    title: 'Psalm 23',
    desc: 'Sacred Vocal',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Psalm23.ogg',
  },
  {
    id: 'bach-chorale',
    title: 'Chorale — Nun freut euch',
    desc: 'Bach · Organ',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Bach-Busoni_-_Chorale_-_Nun_freut_euch%2C_liebe_Christen.ogg',
  },
  {
    id: 'psalm-84',
    title: 'Psalm 84',
    desc: 'Parry · Choir',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Psalm_84_CH_Parry_Trinity_Church_Boston.ogg',
  },
  {
    id: 'ave-maria',
    title: 'Ave Maria',
    desc: 'Sacred Choir',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Apollo-Ave_Maria.ogg',
  },
  {
    id: 'kyrie-orbis',
    title: 'Kyrie — Orbis Factor',
    desc: 'Gregorian Chant',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Kyrie_Eleison_Orbis_Factor.ogg',
  },
]

export default function AmbientPlayer() {
  const [expanded, setExpanded] = useState(false)
  const [trackIndex, setTrackIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.4)
  const [error, setError] = useState(false)
  const audioRef = useRef(null)

  const track = TRACKS[trackIndex]

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume
    }
  }, [volume, muted])

  function playTrack(index, autoplay = false) {
    setError(false)
    setTrackIndex(index)
    if (autoplay || playing) {
      // Give the src time to update, then play
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load()
          audioRef.current.play()
            .then(() => setPlaying(true))
            .catch(() => { setError(true); setPlaying(false) })
        }
      }, 50)
    }
  }

  function handlePlayPause() {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play()
        .then(() => setPlaying(true))
        .catch(() => { setError(true); setPlaying(false) })
    }
  }

  function handleSkip() {
    playTrack((trackIndex + 1) % TRACKS.length, true)
  }

  function handleEnded() {
    playTrack((trackIndex + 1) % TRACKS.length, true)
  }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-inset)' }}
    >
      {/* ── Header row — always visible ── */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* Play/pause */}
        <button
          onClick={handlePlayPause}
          className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 transition-all duration-150"
          style={{
            background: playing ? 'var(--gold-bg)' : 'var(--bg-surface)',
            border: '1px solid',
            borderColor: playing ? 'var(--gold-border)' : 'var(--border-medium)',
            color: playing ? 'var(--gold)' : 'var(--text-muted)',
          }}
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={11} /> : <Play size={11} />}
        </button>

        {/* Track info — clicking expands */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex-1 text-left min-w-0"
        >
          {playing ? (
            <span className="text-sm flex items-baseline gap-1.5 min-w-0">
              <span
                className="truncate"
                style={{ color: 'var(--text-body)' }}
              >
                {track.title}
              </span>
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-faint)' }}>
                {track.desc}
              </span>
            </span>
          ) : (
            <span className="text-sm flex items-center gap-2" style={{ color: 'var(--text-faint)' }}>
              <Music size={12} />
              Ambient music for reflection
            </span>
          )}
        </button>

        {/* Skip (only when playing) */}
        {playing && (
          <button
            onClick={handleSkip}
            className="flex-shrink-0 transition-colors"
            style={{ color: 'var(--text-ghost)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-muted)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-ghost)'}
            title="Next track"
          >
            <SkipForward size={13} />
          </button>
        )}

        {/* Expand chevron */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex-shrink-0 text-xs transition-transform duration-200"
          style={{
            color: 'var(--text-ghost)',
            display: 'inline-block',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▾
        </button>
      </div>

      {/* ── Expanded panel ── */}
      {expanded && (
        <div
          className="px-4 pb-4 space-y-3 animate-slide-up"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          {/* Track list */}
          <div className="pt-3 space-y-0.5">
            {TRACKS.map((t, i) => (
              <button
                key={t.id}
                onClick={() => playTrack(i, true)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-all duration-150"
                style={{
                  background: trackIndex === i ? 'var(--bg-surface)' : 'transparent',
                  color: trackIndex === i ? 'var(--text-body)' : 'var(--text-muted)',
                  border: '1px solid',
                  borderColor: trackIndex === i ? 'var(--border-medium)' : 'transparent',
                }}
              >
                <span
                  className="w-4 text-center flex-shrink-0 text-xs font-mono"
                  style={{ color: trackIndex === i && playing ? 'var(--gold)' : 'var(--text-ghost)' }}
                >
                  {trackIndex === i && playing ? '♩' : `${i + 1}`}
                </span>
                <span className="flex-1 truncate">{t.title}</span>
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-ghost)' }}>
                  {t.desc}
                </span>
              </button>
            ))}
          </div>

          {/* Volume row */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setMuted(v => !v)}
              className="flex-shrink-0"
              style={{ color: muted ? 'var(--text-ghost)' : 'var(--text-muted)' }}
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={muted ? 0 : volume}
              onChange={e => { setMuted(false); setVolume(Number(e.target.value)) }}
              className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: 'var(--gold)' }}
            />
          </div>

          {error && (
            <p className="text-xs px-1" style={{ color: 'var(--text-faint)' }}>
              Could not load this track — try another or check your connection.
            </p>
          )}

          <p className="text-xs leading-relaxed px-1" style={{ color: 'var(--text-ghost)' }}>
            Public domain sacred music. Let it quiet the room as you sit with the Word.
          </p>
        </div>
      )}

      {/* Hidden audio element — src updates with trackIndex */}
      <audio
        ref={audioRef}
        src={track.url}
        onEnded={handleEnded}
        onError={() => { setError(true); setPlaying(false) }}
        preload="none"
      />
    </div>
  )
}
