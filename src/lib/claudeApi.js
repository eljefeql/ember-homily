/**
 * claudeApi.js — streaming Claude integration for homily drafting
 *
 * Calls the Anthropic Messages API via Vite's dev-proxy at /api/claude.
 * In production you'd route through your own backend — never expose the key client-side.
 *
 * Usage:
 *   import { streamHomilyDraft } from '../lib/claudeApi'
 *   await streamHomilyDraft(state, onChunk, onDone, onError)
 */

const MODEL = 'claude-opus-4-5'
const MAX_TOKENS = 2048

// ── Prompt builder ─────────────────────────────────────────────────────────────

export function buildHomilyPrompt(state) {
  const gospel = state.readings?.find(r => r.id === 'gospel')
  const firstReading = state.readings?.find(r => r.id === 'first')

  const lines = []

  lines.push(
    `You are helping a ${state.tradition || 'Catholic'} preacher write a homily.` +
    ` Write in first-person, as the preacher — not about them.` +
    ` The voice should be warm, pastoral, conversational, and grounded — not academic or preachy.` +
    ` Avoid theological jargon. Sound like a person, not a document.`
  )

  lines.push('\n## The occasion')
  lines.push(`Sunday / Occasion: ${state.sundayName || state.occasion || 'Sunday Mass'}`)
  if (state.date) lines.push(`Date: ${state.date}`)
  if (state.tone) lines.push(`Tone: ${state.tone}`)
  if (state.theme) lines.push(`Theme: ${state.theme}`)

  if (gospel) {
    lines.push('\n## Gospel')
    lines.push(`${gospel.reference}`)
    if (gospel.text?.trim()) {
      lines.push(gospel.text.slice(0, 800) + (gospel.text.length > 800 ? '…' : ''))
    }
  }

  if (firstReading?.text?.trim()) {
    lines.push('\n## First Reading')
    lines.push(`${firstReading.reference}: ${firstReading.text.slice(0, 400)}…`)
  }

  if (state.homilyAim?.action || state.homilyAim?.because) {
    lines.push('\n## The aim of this homily')
    if (state.homilyAim.action && state.homilyAim.because) {
      lines.push(
        `I want my congregation to ${state.homilyAim.action} because ${state.homilyAim.because}.`
      )
    } else if (state.homilyAim.action) {
      lines.push(`I want my congregation to ${state.homilyAim.action}.`)
    }
  }

  if (state.personalStory?.trim()) {
    lines.push('\n## Opening personal story (preacher\'s own — use this verbatim or very close)')
    lines.push(state.personalStory)
  }

  if (state.storyConnection?.trim()) {
    lines.push('\n## How the story connects to the Gospel')
    lines.push(state.storyConnection)
  }

  if (state.lectioNotes?.theTurn?.trim()) {
    lines.push('\n## The Turn — what surprised me in this text')
    lines.push(state.lectioNotes.theTurn)
  }

  if (state.lectioNotes?.meditatio?.trim()) {
    lines.push('\n## Meditatio notes')
    lines.push(state.lectioNotes.meditatio)
  }

  if (state.congregationMoment?.trim()) {
    lines.push('\n## Who I\'m preaching to this week')
    lines.push(state.congregationMoment)
  }

  if (state.currentEvents?.trim()) {
    lines.push('\n## What\'s alive in the community')
    lines.push(state.currentEvents)
  }

  if (state.synthesis?.verbumClips?.length > 0) {
    lines.push('\n## Verbum scholar insights (weave in naturally — do not list them)')
    state.synthesis.verbumClips.forEach(clip => {
      lines.push(`• ${clip.headline}${clip.keyword ? ` (key word: "${clip.keyword}")` : ''}: ${clip.body}`)
    })
  }

  if (state.synthesis?.coreInsight?.trim()) {
    lines.push('\n## Core Gospel insight to preach')
    lines.push(state.synthesis.coreInsight)
  }

  if (state.synthesis?.congregationNeed?.trim()) {
    lines.push('\n## What the congregation needs to hear')
    lines.push(state.synthesis.congregationNeed)
  }

  // Pull in any Workshop sections the preacher has already drafted
  const frameworkKeys = ['openingStory', 'preview', 'gospelAnchor', 'gospelInsight', 'gospelBridge', 'mission', 'closeLoop']
  const frameworkLabels = {
    openingStory: 'Opening story (already drafted)',
    preview: 'Invitation / preview (already drafted)',
    gospelAnchor: 'Gospel anchor (already drafted)',
    gospelInsight: 'Gospel insight (already drafted)',
    gospelBridge: 'Bridge (already drafted)',
    mission: 'Mission / challenge (already drafted)',
    closeLoop: 'Closing echo (already drafted)',
  }
  const hasDrafted = frameworkKeys.some(k => state.framework?.[k]?.trim())
  if (hasDrafted) {
    lines.push('\n## Sections the preacher has already drafted (incorporate or improve, don\'t discard)')
    frameworkKeys.forEach(k => {
      if (state.framework?.[k]?.trim()) {
        lines.push(`\n### ${frameworkLabels[k]}`)
        lines.push(state.framework[k])
      }
    })
  }

  lines.push('\n## Instructions')
  lines.push(
    'Write a complete homily following this structure:' +
    '\n1. Open with the personal story above (brief, specific — 50–80 words)' +
    '\n2. Invitation — one or two sentences previewing the theme' +
    '\n3. Gospel anchor — state the single truth of this passage plainly' +
    '\n4. Insight — one language/context/patristic insight, delivered simply' +
    '\n5. Bridge — connect the Gospel truth to real life this week' +
    '\n6. Mission — send them out with something specific to do or become' +
    '\n7. Close the loop — one sentence that echoes the opening story' +
    '\n\nTarget: 650–900 words (5–7 minutes delivered at ~130 wpm).' +
    '\nDo not use section headers or labels in the output — it should read as continuous prose.' +
    '\nDo not begin with "Dear brothers and sisters" or similar formal openers unless the tradition strongly calls for it.' +
    '\nWrite it so the preacher can deliver it as written, with minimal editing.'
  )

  return lines.join('\n')
}

// ── Streaming fetch ────────────────────────────────────────────────────────────

/**
 * streamHomilyDraft — calls Claude via the Vite proxy and streams text chunks.
 *
 * @param {object} state      — full HomilyContext state
 * @param {function} onChunk  — called with each text delta (string)
 * @param {function} onDone   — called with the complete text when streaming ends
 * @param {function} onError  — called with an Error if something goes wrong
 * @returns {function}        — abort() function to cancel the stream
 */
export async function streamHomilyDraft(state, onChunk, onDone, onError) {
  const controller = new AbortController()

  const prompt = buildHomilyPrompt(state)

  try {
    const res = await fetch('/api/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Claude API error ${res.status}: ${err}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() // keep incomplete line

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          // Anthropic streaming: content_block_delta events carry text_delta
          // Shape: { type: 'content_block_delta', delta: { type: 'text_delta', text: '...' } }
          const delta =
            (parsed?.type === 'content_block_delta' && parsed?.delta?.type === 'text_delta'
              ? parsed.delta.text
              : null) ??
            parsed?.delta?.text ??
            parsed?.choices?.[0]?.delta?.content ??
            ''
          if (delta) {
            fullText += delta
            onChunk(delta)
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }

    onDone(fullText)
  } catch (err) {
    if (err.name === 'AbortError') return
    onError(err)
  }

  return () => controller.abort()
}
