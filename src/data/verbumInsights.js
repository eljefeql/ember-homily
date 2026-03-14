// Verbum Scholar insight data
// In production: fetched live from app.verbum.com via Chrome MCP browser automation
// Structure: keyed by Gospel reference, with fallback by theme/season
//
// Each insight has:
//   type: 'language' | 'commentary' | 'patristic' | 'structural'
//   headline: 5 words max
//   keyword: the Greek/Hebrew word or key phrase being highlighted
//   keywordTranslit: transliteration
//   body: 2–3 sentences max
//   source: commentary/father name
//   verbumUrl: deep link to app.verbum.com for full context

export const INSIGHT_TYPES = {
  language:    { label: 'Word Study',         color: 'var(--gold)',       icon: 'α' },
  commentary:  { label: 'Commentary',         color: '#7a9fc8',           icon: '📖' },
  patristic:   { label: 'Church Father',      color: '#9a7ac8',           icon: '✝' },
  structural:  { label: 'Narrative Context',  color: 'var(--text-muted)', icon: '⊞' },
}

// Dynamic count logic
// passageVerseCount: number of verses in the Gospel pericope
// themeSet: boolean — has the preacher already selected a theme?
export function getInsightCount(passageVerseCount, themeSet) {
  if (!themeSet) return 3               // No theme yet — cast wide
  if (passageVerseCount <= 8) return 1  // Short, tight passage — one perfect insight
  if (passageVerseCount <= 18) return 2 // Medium — language + commentary
  return 3                              // Long passage — full spread
}

// Build a Verbum Factbook deep link for a passage
export function verbumFactbookUrl(reference) {
  const encoded = encodeURIComponent(reference)
  return `https://app.verbum.com/tools/factbook?title=${encoded}&lens=biblical`
}

export function verbumGreekUrl(lemma) {
  const encoded = encodeURIComponent(lemma)
  return `https://app.verbum.com/tools/factbook?title=${encoded}&lens=biblical`
}

// ── Stub insight data ────────────────────────────────────────────────────────
// Keyed by Gospel reference string (normalized)
// In production these are scraped/generated from live Verbum data

export const VERBUM_INSIGHTS = {

  // John 4:5-42 — The Samaritan Woman at the Well
  'John 4:5-42': [
    {
      type: 'language',
      headline: 'Living water — two meanings at once',
      keyword: 'ὕδωρ ζῶν',
      keywordTranslit: 'hydōr zōn',
      body: 'The phrase "living water" (ὕδωρ ζῶν) meant flowing spring water in everyday Greek — as opposed to the stagnant water of a cistern. Jesus uses the woman\'s literal understanding as a ladder to the theological one. This double-meaning (a Johannine signature) isn\'t wordplay for its own sake — it is the whole structure of the encounter: she comes for one water and leaves with another.',
      source: 'BDAG Lexicon via Verbum',
      verbumUrl: verbumFactbookUrl('ὕδωρ ζῶν'),
    },
    {
      type: 'language',
      headline: '"Spring welling up" — present participle',
      keyword: 'πηγὴ ἁλλομένου',
      keywordTranslit: 'pēgē hallomenou',
      body: 'The water Jesus gives becomes "a spring of water welling up" (πηγὴ ὕδατος ἁλλομένου) to eternal life. The participle ἁλλόμενον is active and continuous — leaping, bubbling, springing. The gift is not a stored supply; it is a living source inside the person. Zodhiates notes this verb is used elsewhere of John the Baptist leaping in the womb — this water has personality.',
      source: 'Zodhiates, Complete Word Study Dictionary',
      verbumUrl: verbumFactbookUrl('πηγή'),
    },
    {
      type: 'language',
      headline: '"You have had five husbands"',
      keyword: 'ἄνδρας ἔσχες πέντε',
      keywordTranslit: 'andras esches pente',
      body: 'The detail about five husbands has generated two major readings. The historical-pastoral: she has been abandoned, widowed, or divorced repeatedly — a woman of genuine social precarity. The allegorical (Raymond Brown after 2 Kings 17): the five peoples settled in Samaria by the Assyrians each brought their own god. Either reading serves the homily, but the pastoral one keeps her a person rather than a symbol.',
      source: 'Raymond Brown, Anchor Bible: Gospel of John',
      verbumUrl: verbumFactbookUrl('John 4:18'),
    },
    {
      type: 'structural',
      headline: 'Jacob\'s well: a betrothal type-scene',
      keyword: 'φρέαρ τοῦ Ἰακώβ',
      keywordTranslit: 'phrear tou Iakōb',
      body: 'Robert Alter\'s analysis of biblical type-scenes identifies the "well encounter" as a betrothal scene in the Hebrew tradition (Gen 24: Isaac and Rebekah; Gen 29: Jacob and Rachel; Ex 2: Moses and Zipporah). A man arrives at a well, meets a woman, water is drawn, and a union follows. John\'s readers would have felt the shape immediately. Jesus arrives at a well and finds — Israel. The wedding imagery runs the entire Gospel.',
      source: 'Robert Alter, The Art of Biblical Narrative',
      verbumUrl: verbumFactbookUrl('John 4:6'),
    },
    {
      type: 'structural',
      headline: '"The sixth hour" — hour of isolation',
      keyword: 'ὥρα ἦν ὡς ἕκτη',
      keywordTranslit: 'hōra ēn hōs hektē',
      body: 'Noon is the hottest part of the day — women typically drew water in the morning or evening in community. The woman comes alone at the sixth hour. This is not an incidental detail but a portrait of social exclusion. Jesus sits precisely at the hour when the excluded come, and he is already there, already tired, already waiting. He sought her out.',
      source: 'Pilch, Cultural World of Jesus (Sacra Pagina)',
      verbumUrl: verbumFactbookUrl('John 4:6'),
    },
    {
      type: 'structural',
      headline: 'First evangelist in John\'s Gospel',
      keyword: 'ἀφῆκεν οὖν τὴν ὑδρίαν',
      keywordTranslit: 'aphēken oun tēn hydrian',
      body: 'The woman "left her water jar" (ἀφῆκεν τὴν ὑδρίαν) and went to tell the town. Commentators note she came for water and forgot her jar — a small, perfect detail of someone transformed mid-errand. More significantly, she becomes the first missionary figure in John\'s Gospel: she goes, she testifies, and the townspeople believe "because of her word" (διὰ τὸν λόγον τῆς γυναικός).',
      source: 'Francis Moloney, Sacra Pagina: Gospel of John',
      verbumUrl: verbumFactbookUrl('John 4:28'),
    },
    {
      type: 'commentary',
      headline: 'Worship in spirit and truth',
      keyword: 'ἐν πνεύματι καὶ ἀληθείᾳ',
      keywordTranslit: 'en pneumati kai alētheia',
      body: 'The phrase "in spirit and in truth" (v.23–24) is the theological heart of the passage. Scholars debate whether "spirit" (πνεῦμα) refers to the Holy Spirit or the human spirit. Most (Brown, Moloney, Keener) read it as the divine Spirit — the new age of worship is enabled by the Spirit Jesus gives, not by choosing the right mountain. This matters: the woman\'s question about place is answered by a gift, not a geography.',
      source: 'Craig Keener, Commentary on the Gospel of John',
      verbumUrl: verbumFactbookUrl('John 4:24'),
    },
    {
      type: 'commentary',
      headline: 'The harvest is now',
      keyword: 'θεάσασθε τὰς χώρας',
      keywordTranslit: 'theasasthe tas chōras',
      body: 'Jesus tells the disciples to "lift up your eyes and look at the fields" (v.35) — white for harvest. The approaching Samaritans are the harvest. The mission has already begun, in a conversation the disciples missed. Keener notes this is a rebuke disguised as an invitation: the disciples were worried about bread (v.33) while the real meal was happening at the well.',
      source: 'Craig Keener, Commentary on the Gospel of John',
      verbumUrl: verbumFactbookUrl('John 4:35'),
    },
    {
      type: 'patristic',
      headline: 'Augustine: our heart is the well',
      keyword: 'cor nostrum inquietum',
      keywordTranslit: '"our heart is restless"',
      body: 'Augustine returns repeatedly to this passage in his Tractates on John. He reads the woman\'s thirst as the universal human restlessness — the soul that has drunk from created things and remains parched. "Our heart is restless until it rests in Thee" is not from the Confessions alone; Augustine draws it directly from this well. The woman is everyman, coming at noon, alone, thirsty for something she cannot name.',
      source: 'Augustine, Tractates on John 15.16–17',
      verbumUrl: verbumFactbookUrl('John 4:13'),
    },
    {
      type: 'patristic',
      headline: 'Origen: she is the Church from Gentiles',
      keyword: 'Ecclesia ex gentibus',
      keywordTranslit: '"Church from the Gentiles"',
      body: 'Origen reads the Samaritan woman as a figure of the Church drawn from the Gentiles — neither fully Jewish nor fully pagan, but sought out by Christ precisely in her in-between status. The five husbands become the five books of the Law the Samaritans accepted but did not fully receive. The "husband you now have" is the incomplete god of mixed worship. Christ comes to complete the marriage.',
      source: 'Origen, Commentary on John 13.4',
      verbumUrl: verbumFactbookUrl('John 4:17'),
    },
    {
      type: 'patristic',
      headline: 'Chrysostom on Jesus\' weariness',
      keyword: 'κεκοπιακὼς ἐκ τῆς ὁδοιπορίας',
      keywordTranslit: 'kekopiakōs ek tēs hodoiporias',
      body: 'John says Jesus was "wearied from his journey" (κεκοπιακώς) — a word of genuine physical exhaustion. Chrysostom meditates on this: the one who holds the universe does not rest on it but sits on a stone lip of a well. The incarnation means God gets tired. Chrysostom sees this as the deepest intimacy — the Creator in the posture of a creature, needing a drink, waiting for a stranger to show mercy.',
      source: 'Chrysostom, Homilies on John 31',
      verbumUrl: verbumFactbookUrl('John 4:6'),
    },
  ],

  // John 8:1–11 — The Woman Caught in Adultery
  'John 8:1–11': [
    {
      type: 'language',
      headline: 'Bent down and wrote',
      keyword: 'κατέγραφεν',
      keywordTranslit: 'katégraphen',
      body: 'The verb used for Jesus writing in the dust (κατέγραφεν) appears only here in the NT and carries the sense of writing against — as in writing an indictment. The irony is stunning: the only one with the authority to write their condemnation chooses instead to write in dirt that will blow away.',
      source: 'BDAG Lexicon via Verbum',
      verbumUrl: verbumFactbookUrl('κατέγραφεν'),
    },
    {
      type: 'patristic',
      headline: 'Augustine on the two left alone',
      keyword: 'relicti sunt duo',
      keywordTranslit: '"Two were left"',
      body: 'Augustine writes: "Two were left alone — the wretched woman and Mercy." He sees this not as the crowd leaving but as the whole movement of the Gospel: when everyone else has walked away, mercy remains. That one line has more homiletical weight than a paragraph of explanation.',
      source: 'Augustine, Tractates on John 33.5',
      verbumUrl: verbumFactbookUrl('John 8:9'),
    },
    {
      type: 'structural',
      headline: 'A passage under suspicion',
      keyword: 'Pericope Adulterae',
      keywordTranslit: '',
      body: 'This passage (the Pericope Adulterae) is absent from the oldest Greek manuscripts and was likely a floating oral tradition before being anchored here. Far from undermining it, this history suggests the early church recognized it as so authentically Jesus that it had to be preserved somewhere. The community\'s instinct was right.',
      source: 'New Jerome Biblical Commentary',
      verbumUrl: verbumFactbookUrl('John 7:53'),
    },
  ],

  // Luke 15:1–3, 11–32 — The Prodigal Son
  'Luke 15:11–32': [
    {
      type: 'language',
      headline: '"Came to himself" — inside out',
      keyword: 'εἰς ἑαυτὸν ἐλθών',
      keywordTranslit: 'eis heauton elthōn',
      body: 'The Greek phrase for "coming to his senses" is literally "coming into himself" (εἰς ἑαυτὸν ἐλθών). It is a spatial metaphor — as if the son had been living outside himself, exiled from his own interior. Conversion in Luke isn\'t primarily moral; it\'s an interior homecoming before the physical one.',
      source: 'TDNT via Verbum',
      verbumUrl: verbumFactbookUrl('εἰς ἑαυτὸν ἐλθών'),
    },
    {
      type: 'commentary',
      headline: 'The father runs — a scandal',
      keyword: 'ἔδραμεν',
      keywordTranslit: 'edramen',
      body: 'In first-century Palestine, a man of means running in public was considered undignified — you gathered your robes and ran only in emergencies or disgrace. The father\'s sprint is not sentimentality; it is a deliberate social humiliation he accepts to reach his son before anyone else can shame him first.',
      source: 'Kenneth Bailey, Poet & Peasant',
      verbumUrl: verbumFactbookUrl('Luke 15:20'),
    },
    {
      type: 'patristic',
      headline: 'The elder son is also us',
      keyword: 'ὀργίσθη',
      keywordTranslit: 'ōrgisthē',
      body: 'Origen notes that the parable ends without resolution for the elder son — we never learn if he enters. This is deliberate. Luke\'s community included Pharisees and the observant who felt displaced by the welcoming of sinners. The parable ends as an open door. The question is whether the reader walks through it.',
      source: 'Origen, Homilies on Luke',
      verbumUrl: verbumFactbookUrl('Luke 15:28'),
    },
  ],

  // Mark 10:46–52 — Bartimaeus
  'Mark 10:46–52': [
    {
      type: 'language',
      headline: '"Son of David" — loaded title',
      keyword: 'υἱὲ Δαυίδ',
      keywordTranslit: 'huie Dauid',
      body: 'Bartimaeus is the only figure in Mark to address Jesus as "Son of David" before the Passion narrative — a title with explicit messianic and royal weight. A blind beggar sees what the disciples repeatedly miss. Mark\'s irony is at full force: the one who cannot see is the one with clearest vision.',
      source: 'Boring, Mark (NTL Commentary)',
      verbumUrl: verbumFactbookUrl('υἱὲ Δαυίδ'),
    },
    {
      type: 'structural',
      headline: 'Frames the whole journey section',
      keyword: 'ἠκολούθει αὐτῷ',
      keywordTranslit: 'ēkolouthei autō',
      body: 'This healing bookends Mark\'s "Way" section (8:22–10:52), which begins with another blind man healed in stages. The disciples have been blind throughout the journey. Bartimaeus, healed in an instant, immediately follows Jesus "on the way" — the same Greek phrase used for discipleship throughout Mark.',
      source: 'New Jerome Biblical Commentary',
      verbumUrl: verbumFactbookUrl('Mark 10:52'),
    },
  ],

  // John 3:16 — For God so loved the world
  'John 3:16': [
    {
      type: 'language',
      headline: 'Loved: not a feeling but a decision',
      keyword: 'ἠγάπησεν',
      keywordTranslit: 'ēgapēsen',
      body: 'The aorist tense of ἀγαπάω (ēgapēsen) indicates a decisive, completed act — not an ongoing emotional state. "God so loved the world" describes something God did, a choice made. This matters enormously for preaching: the love of God is not subject to the world\'s lovability. It precedes and creates it.',
      source: 'BDAG via Verbum',
      verbumUrl: verbumGreekUrl('ἀγαπάω'),
    },
    {
      type: 'commentary',
      headline: '"World" means the hostile world',
      keyword: 'κόσμον',
      keywordTranslit: 'kosmon',
      body: 'In John\'s Gospel, κόσμος (world) almost never means simply "creation" — it means the world in its estrangement from God, the world as it has arranged itself against the light. "God so loved the world" is not a warm generalization. It is a statement about grace directed precisely at resistance.',
      source: 'Raymond Brown, Gospel of John (Anchor Bible)',
      verbumUrl: verbumGreekUrl('κόσμος'),
    },
  ],

  // Isaiah 43:16–21 (First Reading)
  'Isaiah 43:16–21': [
    {
      type: 'language',
      headline: '"New thing" — present tense urgency',
      keyword: 'חֲדָשָׁה',
      keywordTranslit: 'ḥadāšāh',
      body: 'The Hebrew for "new thing" (ḥadāšāh) in Isaiah 43:19 is placed emphatically at the start of the clause. And God\'s question — "Do you not perceive it?" — is present tense: the new thing is springing up now, not eventually. The prophet isn\'t offering future consolation; he\'s demanding present attention.',
      source: 'BDB Hebrew Lexicon via Verbum',
      verbumUrl: verbumFactbookUrl('Isaiah 43:19'),
    },
  ],

  // Fallback insights by season — used when specific passage not found
  _season_Lent: [
    {
      type: 'commentary',
      headline: 'Lent as return, not punishment',
      keyword: 'תְּשׁוּבָה',
      keywordTranslit: 'teshuvah',
      body: 'The Hebrew word for repentance (teshuvah) means literally "turning" or "returning" — not self-flagellation but reorientation. The Lenten invitation in the prophets is always to return to something good that was lost, not to pay for something bad. That distinction reshapes the entire emotional register of Lenten preaching.',
      source: 'Abraham Heschel, The Prophets',
      verbumUrl: verbumFactbookUrl('teshuvah'),
    },
  ],
  _season_Advent: [
    {
      type: 'language',
      headline: 'Maranatha — oldest Christian prayer',
      keyword: 'μαράνα θά',
      keywordTranslit: 'marana tha',
      body: 'The Aramaic cry marana tha ("Come, Lord!") in 1 Corinthians 16:22 and Revelation 22:20 is almost certainly the oldest surviving Christian prayer formula. That the earliest believers prayed this daily tells us Advent is not a liturgical invention — it is the permanent posture of the church. We have always been a people waiting.',
      source: 'TDNT via Verbum',
      verbumUrl: verbumFactbookUrl('maranatha'),
    },
  ],
  _season_Easter: [
    {
      type: 'language',
      headline: 'Alleluia is not a word — it\'s a shout',
      keyword: 'הַלְלוּיָהּ',
      keywordTranslit: 'Hallelujah',
      body: 'Hallelujah (הַלְלוּיָהּ) is a command form of the Hebrew hallel (praise) + Yah (the divine name). It is not a word of content — it is an exclamation of address, like a shout at someone you\'ve just caught sight of. The church sings it at Easter not because we have worked out our theology but because we have seen something we cannot contain.',
      source: 'BDB Hebrew Lexicon via Verbum',
      verbumUrl: verbumFactbookUrl('hallelujah'),
    },
  ],
}

// ── localStorage cache helpers (mirrors VerbumScholarPanel cache logic) ───────

const CACHE_PREFIX = 'verbum-live-'
const CACHE_TTL_DAYS = 7

function _cacheKey(ref) {
  return CACHE_PREFIX + ref.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_:.-]/g, '')
}

/**
 * Returns live cached insights for a reference if present and < 7 days old.
 * Returns null if no cache or expired.
 */
export function loadLiveCache(ref) {
  if (!ref || typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(_cacheKey(ref))
    if (!raw) return null
    const { insights, timestamp } = JSON.parse(raw)
    const ageDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24)
    if (ageDays > CACHE_TTL_DAYS) return null
    return Array.isArray(insights) && insights.length > 0 ? insights : null
  } catch {
    return null
  }
}

// Get ALL insights for a given passage — full library, no artificial cap.
// Checks live localStorage cache first; falls through to stub data if not found.
// Caller decides how many to display. Insights are ordered by type for reading flow.
export function getInsightsForPassage(reference, verseCount, themeSet, season) {
  // ── Live cache first ──────────────────────────────────────────────────────
  const cached = loadLiveCache(reference)
  if (cached) return cached

  // ── Static stub data ──────────────────────────────────────────────────────
  // Try exact reference first
  let pool = VERBUM_INSIGHTS[reference]

  // Try with en-dash (stored keys may use – instead of -)
  if (!pool) {
    pool = VERBUM_INSIGHTS[reference?.replace(/-/g, '–')]
  }

  // Try stripping the long form — match book+chapter+first-verse only
  // e.g. "John 4:5-42" → try "John 4" as a prefix match
  if (!pool && reference) {
    const bookChapter = reference.split(':')[0]  // "John 4"
    const key = Object.keys(VERBUM_INSIGHTS).find(k =>
      k.startsWith(bookChapter) && !k.startsWith('_')
    )
    if (key) pool = VERBUM_INSIGHTS[key]
  }

  // Season fallback
  if (!pool && season) {
    pool = VERBUM_INSIGHTS[`_season_${season}`]
  }

  // Generic demo fallback
  if (!pool) {
    pool = VERBUM_INSIGHTS['John 8:1–11']
  }

  // Order: language → commentary → patristic → structural (for reading flow)
  const typeOrder = ['language', 'commentary', 'patristic', 'structural']
  return [...pool].sort((a, b) =>
    typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)
  )
}
