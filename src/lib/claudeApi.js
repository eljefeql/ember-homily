/**
 * claudeApi.js — streaming Claude integration for homily drafting
 *
 * Calls the Anthropic Messages API via the Netlify proxy at /api/claude.
 *
 * Usage:
 *   import { streamHomilyDraft, reviewHomilyDraft } from '../lib/claudeApi'
 *   await streamHomilyDraft(state, onChunk, onDone, onError)
 *   const review = await reviewHomilyDraft(draft, state)
 */

const MODEL = 'claude-opus-4-5'
const MAX_TOKENS = 2048

// ── System prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(tradition = 'Catholic') {
  const universal = `You are an expert homily coach and ghostwriter. Write in first-person as the preacher — not about them.

WRITING CRAFT RULES:
1. Every sentence earns its place. If it doesn't move the hearer forward, deepen the emotion, or sharpen the truth — cut it.
2. The opening story ends on tension or a question — never on resolution. The homily resolves it.
3. Be ruthlessly specific. Not "a difficult time in my family" — the exact moment. Not "people suffer" — this person, this loss, this Tuesday.
4. The Gospel anchor is a declaration. Not a question, not a hedge — a plain statement of what is true.
5. The bridge names something concrete: a person in the news, a moment in this neighborhood, a feeling this congregation carried in the door.
6. The mission gives one doable thing. Something possible by Wednesday. Not "be more loving" — something you could actually do.
7. The closing echo is 1–2 sentences. It should feel inevitable — as if the opening always pointed here.
8. No filler transitions: "And so we see…", "As we reflect…". Move directly.
9. No rhetorical questions used as filler. No lists of three virtues. No academic hedging.
10. The voice is warm, honest, occasionally self-deprecating. This is a person at a dinner table, not a document on a lectern.`

  const traditions = {
    Catholic: `
TRADITION: Catholic
- The Eucharist is the destination of every Sunday homily. If it fits naturally, end at the table.
- Saints, Doctors of the Church, and papal teaching may be cited if they genuinely illuminate — not just to display erudition.
- Marian references are welcome when organic.
- "The assembly," "the altar," "the Eucharist," "the Mass" are natural liturgical language.
- Aim for 8–10 minutes (650–900 words). Catholicism values density over length.
- Avoid Protestant-sounding invitations to "accept Jesus" — the homily invites deeper participation in the sacramental life.`,

    Episcopal: `
TRADITION: Episcopal
- Poetry, literature, and cultural references are expected tools of the Episcopal pulpit — use them when they genuinely serve the text.
- The homily may dwell in the question. It does not always need to resolve. Mystery is honored.
- "Sermon" is the natural word. Personal vulnerability from the pulpit is not just permitted — it is the tradition.
- Justice, lament, and naming difficult public realities are part of the preaching inheritance.
- 12–15 minutes (900–1,200 words) is natural. Ecumenical and interfaith references are welcome.
- Avoid overly Roman-sounding liturgical language ("the altar," "the Mass").`,
  }

  const traditionBlock = traditions[tradition] || traditions['Catholic']
  return `${universal}\n${traditionBlock}`
}

// ── User prompt (context + task) ────────────────────────────────────────────

export function buildHomilyPrompt(state) {
  const gospel = state.readings?.find(r => r.id === 'gospel')
  const firstReading = state.readings?.find(r => r.id === 'first')
  const tradition = state.tradition || 'Catholic'
  const wordTarget = tradition === 'Episcopal' ? '900–1,200 words' : '650–900 words'

  const lines = []

  lines.push(`## The occasion`)
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
    lines.push('\n## Opening personal story (use this verbatim or very close — it is the preacher\'s own voice)')
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
    lines.push('\n## Verbum scholar insights (weave in naturally — do not list or label them)')
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
    lines.push('\n## Sections the preacher has already drafted (incorporate or improve, do not discard)')
    frameworkKeys.forEach(k => {
      if (state.framework?.[k]?.trim()) {
        lines.push(`\n### ${frameworkLabels[k]}`)
        lines.push(state.framework[k])
      }
    })
  }

  lines.push('\n## Instructions')
  lines.push(
    `Write a complete homily. The structure is a journey, not a checklist:\n` +
    `\nOPEN (50–80 words): The preacher's specific personal moment — use the story above, close to verbatim. End it mid-tension, not resolution.` +
    `\nTURN (1–2 sentences): The Gospel is the answer to that tension. Say it simply — the moment you realized something had shifted.` +
    `\nANCHOR (2–3 sentences): State what this passage actually says, plainly. No jargon. One truth.` +
    `\nILLUMINATE (3–5 sentences): One word, one cultural detail, one insight from scholarship that makes the text suddenly sharper.` +
    `\nBRIDGE (4–6 sentences): This is where the Gospel lands in this congregation's actual week. Name something real. Be specific.` +
    `\nSEND (2–4 sentences): One thing to do before next Sunday. Concrete. Possible. Not a virtue — an action.` +
    `\nECHO (1–2 sentences): Return to the opening moment. It should feel like it has been waiting here all along.\n` +
    `\nDo not label the sections. Write in flowing prose. Target: ${wordTarget}.` +
    `\nDo not begin with "Dear brothers and sisters" or any formal opener. Start with the story.` +
    `\nWrite it so the preacher can deliver it as written, with minimal editing.`
  )

  return lines.join('\n')
}

// ── Review prompt ───────────────────────────────────────────────────────────

function buildReviewPrompt(draft, state) {
  const tradition = state.tradition || 'Catholic'
  const aim = state.homilyAim?.action
    ? `I want my congregation to ${state.homilyAim.action}${state.homilyAim.because ? ` because ${state.homilyAim.because}` : ''}.`
    : '(not stated)'

  return `Review this homily draft against the preacher's own stated criteria.

STATED AIM: ${aim}
OPENING STORY (preacher's own words): ${(state.personalStory || '').slice(0, 300)}
TRADITION: ${tradition}

DRAFT:
${draft}

Return ONLY this exact JSON object — no prose, no markdown code fences:
{
  "aimLands": true,
  "aimNote": "one sentence — does the ending actually produce the intended change, or does it drift?",
  "openingAuthenticSounds": true,
  "openingNote": "does the opening sound like the preacher's own voice from their story, or has it been sanitized?",
  "surpriseMoment": "quote the single sentence in the draft that is most surprising or alive",
  "weakestMoment": "quote the single sentence that most needs to be cut or rewritten",
  "traditionFit": true,
  "traditionNote": "one sentence — does the language, length, and sensibility match ${tradition} preaching?",
  "oneEdit": "the single most important edit to make before delivering this"
}`
}

// ── Streaming draft ──────────────────────────────────────────────────────────

/**
 * streamHomilyDraft — calls Claude via the Netlify proxy and streams text chunks.
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
  const system = buildSystemPrompt(state.tradition)

  try {
    const res = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        stream: true,
        system,
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
      buffer = lines.pop()

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
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

// ── Review pass (non-streaming) ─────────────────────────────────────────────

/**
 * reviewHomilyDraft — makes a second Claude call to review the generated draft.
 * Returns a structured review object, or null on failure.
 *
 * @param {string} draft   — the generated homily text
 * @param {object} state   — full HomilyContext state
 * @returns {object|null}  — review JSON or null
 */
export async function reviewHomilyDraft(draft, state) {
  try {
    const res = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        system: `You are a homily editor reviewing a draft for a ${state.tradition || 'Catholic'} preacher. Be honest and kind. Return ONLY valid JSON — no prose, no markdown wrapper.`,
        messages: [{ role: 'user', content: buildReviewPrompt(draft, state) }],
      }),
    })

    if (!res.ok) return null

    const data = await res.json()
    const text = data?.content?.[0]?.text || ''

    // Strip any accidental markdown fences before parsing
    const clean = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim()
    return JSON.parse(clean)
  } catch {
    return null
  }
}
