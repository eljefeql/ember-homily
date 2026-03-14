// Stubbed Catholic lectionary data
// Structure mirrors what a real lectionary API would return
// Cycle A: years divisible by 3 remainder 1 (2023, 2026...)
// Cycle B: years divisible by 3 remainder 2 (2024, 2027...)
// Cycle C: years divisible by 3 remainder 0 (2025, 2028...)

export function getLiturgicalYear(date) {
  const d = new Date(date + 'T00:00:00')
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  // Liturgical year starts on First Sunday of Advent
  // Approximate: new liturgical year starts ~Dec 1
  const liturgicalYear = (month === 12 && day >= 1) ? year + 1 : year
  const rem = liturgicalYear % 3
  if (rem === 1) return 'A'
  if (rem === 2) return 'B'
  return 'C'
}

export function getLiturgicalSeason(dateString) {
  const date = new Date(dateString + 'T00:00:00')
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const doy = getDayOfYear(date)

  // Easter calculation (Anonymous Gregorian)
  const easter = getEasterDate(year)
  const easterDoy = getDayOfYear(easter)

  const ashWednesdayDoy = easterDoy - 46
  const palmSundayDoy = easterDoy - 7
  const pentecostDoy = easterDoy + 49
  const trinityDoy = easterDoy + 56

  // Advent: 4 Sundays before Christmas
  const christmas = new Date(year, 11, 25)
  const christmasDoy = getDayOfYear(christmas)
  const firstAdventDoy = christmasDoy - 22

  if (doy >= firstAdventDoy && doy <= christmasDoy - 1) return 'Advent'
  if ((month === 12 && day >= 25) || (month === 1 && day <= 12)) return 'Christmas'
  if (doy >= ashWednesdayDoy && doy < easterDoy) return 'Lent'
  if (doy >= easterDoy && doy < pentecostDoy) return 'Easter'
  if (doy === pentecostDoy) return 'Pentecost'
  if (doy === trinityDoy) return 'Trinity Sunday'
  return 'Ordinary Time'
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date - start
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function getEasterDate(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

export function getSundayName(dateString) {
  const season = getLiturgicalSeason(dateString)
  const date = new Date(dateString + 'T00:00:00')
  const year = date.getFullYear()

  const easter = getEasterDate(year)
  const easterDoy = getDayOfYear(easter)
  const doy = getDayOfYear(date)

  if (season === 'Lent') {
    const weekOfLent = Math.ceil((doy - (easterDoy - 46)) / 7)
    const names = ['Ash Wednesday Week', '1st Sunday of Lent', '2nd Sunday of Lent',
      '3rd Sunday of Lent', '4th Sunday of Lent', '5th Sunday of Lent', 'Palm Sunday']
    return names[Math.min(weekOfLent, 6)] || 'Lent'
  }
  if (season === 'Easter') {
    const weekOfEaster = Math.ceil((doy - easterDoy) / 7)
    const names = ['Easter Sunday', '2nd Sunday of Easter', '3rd Sunday of Easter',
      '4th Sunday of Easter', '5th Sunday of Easter', '6th Sunday of Easter',
      'Ascension / 7th Sunday of Easter']
    return names[Math.min(weekOfEaster, 6)] || 'Easter'
  }
  if (season === 'Advent') {
    const christmas = new Date(year, 11, 25)
    const christmasDoy = getDayOfYear(christmas)
    const firstAdventDoy = christmasDoy - 22
    const weekOfAdvent = Math.ceil((doy - firstAdventDoy) / 7) + 1
    return `${weekOfAdvent}${['st','nd','rd','th'][Math.min(weekOfAdvent-1,3)]} Sunday of Advent`
  }
  if (season === 'Christmas') return 'Christmas Season'
  if (season === 'Ordinary Time') {
    // Rough ordinal for Ordinary Time
    const pentecost = new Date(easter.getTime() + 49 * 24 * 60 * 60 * 1000)
    const pentecostDoy = getDayOfYear(pentecost)
    if (doy > pentecostDoy) {
      const wk = Math.ceil((doy - pentecostDoy) / 7) + 9
      return `${wk}th Sunday in Ordinary Time`
    }
    // Early Ordinary Time (between Epiphany and Lent)
    const epiphanyDoy = getDayOfYear(new Date(year, 0, 6))
    const wk = Math.ceil((doy - epiphanyDoy) / 7) + 1
    return `${wk}${['st','nd','rd','th'][Math.min(wk-1,3)]} Sunday in Ordinary Time`
  }
  return season
}

// ─── SUNDAY LECTIONARY (3-year cycle — references only) ──────────────────────
// Keyed by MM-DD (nearest Sunday date), with cycle A/B/C sub-keys
// These are approximate — Sundays shift year to year, so we match by
// season + week number rather than exact date in getReadingsForOccasion()

// Helper: build a reading object (no text — paste-in prompt shown in UI)
function ref(id, label, reference, translation = 'NABRE') {
  return { id, label, reference, translation, text: '', hasShortVersion: false }
}

// ─── FIXED FEASTS (same date every year) ─────────────────────────────────────
// Key: "MM-DD"
export const FIXED_FEAST_READINGS = {
  '12-08': { // Immaculate Conception
    name: 'Immaculate Conception of the Blessed Virgin Mary',
    readings: [
      ref('first', 'First Reading', 'Genesis 3:9-15, 20'),
      ref('psalm', 'Responsorial Psalm', 'Psalm 98:1-4'),
      ref('second', 'Second Reading', 'Ephesians 1:3-6, 11-12'),
      ref('gospel', 'Gospel', 'Luke 1:26-38'),
    ],
  },
  '12-12': { // Our Lady of Guadalupe
    name: 'Our Lady of Guadalupe',
    readings: [
      ref('first', 'First Reading', 'Zechariah 2:14-17 or Revelation 11:19a; 12:1-6a, 10ab'),
      ref('psalm', 'Responsorial Psalm', 'Judith 13:18bcde, 19'),
      ref('gospel', 'Gospel', 'Luke 1:26-38 or Luke 1:39-47'),
    ],
  },
  '12-25': { // Christmas — Mass at Midnight
    name: 'Nativity of the Lord (Christmas)',
    readings: [
      ref('first', 'First Reading', 'Isaiah 9:1-6'),
      ref('psalm', 'Responsorial Psalm', 'Psalm 96:1-3, 11-13'),
      ref('second', 'Second Reading', 'Titus 2:11-14'),
      ref('gospel', 'Gospel', 'Luke 2:1-14 (Mass at Midnight)'),
    ],
  },
  '01-01': { // Mary, Mother of God
    name: 'Mary, Mother of God (Solemnity)',
    readings: [
      ref('first', 'First Reading', 'Numbers 6:22-27'),
      ref('psalm', 'Responsorial Psalm', 'Psalm 67:2-3, 5-8'),
      ref('second', 'Second Reading', 'Galatians 4:4-7'),
      ref('gospel', 'Gospel', 'Luke 2:16-21'),
    ],
  },
  '02-02': { // Presentation of the Lord
    name: 'Presentation of the Lord',
    readings: [
      ref('first', 'First Reading', 'Malachi 3:1-4'),
      ref('psalm', 'Responsorial Psalm', 'Psalm 24:7-10'),
      ref('second', 'Second Reading', 'Hebrews 2:14-18'),
      ref('gospel', 'Gospel', 'Luke 2:22-40 (or 2:22-32)'),
    ],
  },
  '03-19': { // St. Joseph
    name: 'St. Joseph, Spouse of the Blessed Virgin Mary',
    readings: [
      ref('first', 'First Reading', '2 Samuel 7:4-5a, 12-14a, 16'),
      ref('psalm', 'Responsorial Psalm', 'Psalm 89:2-5, 27, 29'),
      ref('second', 'Second Reading', 'Romans 4:13, 16-18, 22'),
      ref('gospel', 'Gospel', 'Matthew 1:16, 18-21, 24a (or Luke 2:41-51a)'),
    ],
  },
  '03-25': { // Annunciation
    name: 'Annunciation of the Lord',
    readings: [
      ref('first', 'First Reading', 'Isaiah 7:10-14; 8:10'),
      ref('psalm', 'Responsorial Psalm', 'Psalm 40:7-11'),
      ref('second', 'Second Reading', 'Hebrews 10:4-10'),
      ref('gospel', 'Gospel', 'Luke 1:26-38'),
    ],
  },
  '06-24': { // Birth of John the Baptist
    name: 'Nativity of St. John the Baptist',
    readings: [
      ref('first', 'First Reading', 'Isaiah 49:1-6'),
      ref('psalm', 'Responsorial Psalm', 'Psalm 139:1-3, 13-15'),
      ref('second', 'Second Reading', 'Acts 13:22-26'),
      ref('gospel', 'Gospel', 'Luke 1:57-66, 80'),
    ],
  },
  '06-29': { // Sts. Peter and Paul
    name: 'Sts. Peter and Paul, Apostles',
    readings: [
      ref('first', 'First Reading', 'Acts 12:1-11'),
      ref('psalm', 'Responsorial Psalm', 'Psalm 34:2-9'),
      ref('second', 'Second Reading', '2 Timothy 4:6-8, 17-18'),
      ref('gospel', 'Gospel', 'Matthew 16:13-19'),
    ],
  },
  '08-06': { // Transfiguration
    name: 'Transfiguration of the Lord',
    readings: [
      ref('first', 'First Reading', 'Daniel 7:9-10, 13-14'),
      ref('psalm', 'Responsorial Psalm', 'Psalm 97:1-2, 5-6, 9'),
      ref('second', 'Second Reading', '2 Peter 1:16-19'),
      ref('gospel', 'Gospel', 'Matthew 17:1-9 (A) / Mark 9:2-10 (B) / Luke 9:28b-36 (C)'),
    ],
  },
  '08-15': { // Assumption
    name: 'Assumption of the Blessed Virgin Mary',
    readings: [
      ref('first', 'First Reading', 'Revelation 11:19a; 12:1-6a, 10ab'),
      ref('psalm', 'Responsorial Psalm', 'Psalm 45:10-12, 16'),
      ref('second', 'Second Reading', '1 Corinthians 15:20-27'),
      ref('gospel', 'Gospel', 'Luke 1:39-56'),
    ],
  },
  '09-14': { // Exaltation of the Holy Cross
    name: 'Exaltation of the Holy Cross',
    readings: [
      ref('first', 'First Reading', 'Numbers 21:4b-9'),
      ref('psalm', 'Responsorial Psalm', 'Psalm 78:1bc-2, 34-38'),
      ref('second', 'Second Reading', 'Philippians 2:6-11'),
      ref('gospel', 'Gospel', 'John 3:13-17'),
    ],
  },
  '11-01': { // All Saints
    name: 'All Saints',
    readings: [
      ref('first', 'First Reading', 'Revelation 7:2-4, 9-14'),
      ref('psalm', 'Responsorial Psalm', 'Psalm 24:1-6'),
      ref('second', 'Second Reading', '1 John 3:1-3'),
      ref('gospel', 'Gospel', 'Matthew 5:1-12a'),
    ],
  },
  '11-02': { // All Souls
    name: 'All Souls (Commemoration of All the Faithful Departed)',
    readings: [
      ref('first', 'First Reading', 'Wisdom 3:1-9 (or Job 19:1, 23-27a or Isaiah 25:6a, 7-9)'),
      ref('psalm', 'Responsorial Psalm', 'Psalm 23 (or Psalm 25 or Psalm 27)'),
      ref('second', 'Second Reading', 'Romans 5:5-11 (or Romans 6:3-9 or Philippians 3:20-21)'),
      ref('gospel', 'Gospel', 'John 6:37-40 (or John 11:17-27 or John 14:1-6)'),
    ],
  },
  '11-09': { // Dedication of Lateran Basilica
    name: 'Dedication of the Lateran Basilica',
    readings: [
      ref('first', 'First Reading', 'Ezekiel 47:1-2, 8-9, 12'),
      ref('psalm', 'Responsorial Psalm', 'Psalm 46:2-3, 5-6, 8-9'),
      ref('second', 'Second Reading', '1 Corinthians 3:9c-11, 16-17'),
      ref('gospel', 'Gospel', 'John 2:13-22'),
    ],
  },
}

// ─── MOVEABLE FEASTS (calculated from Easter) ────────────────────────────────
// Returns feast readings keyed by feast name, given an easter Date object
export function getMoveableFeastReadings(date, easterDate) {
  if (!easterDate) return null
  const d = date.getTime()
  const e = easterDate.getTime()
  const day = 24 * 60 * 60 * 1000
  const diff = Math.round((d - e) / day)

  // Ash Wednesday = Easter - 46
  if (diff === -46) return {
    name: 'Ash Wednesday',
    readings: [
      { id: 'first', label: 'First Reading', reference: 'Joel 2:12-18', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'psalm', label: 'Responsorial Psalm', reference: 'Psalm 51:3-6ab, 12-14, 17', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'second', label: 'Second Reading', reference: '2 Corinthians 5:20 – 6:2', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'gospel', label: 'Gospel', reference: 'Matthew 6:1-6, 16-18', translation: 'NABRE', text: '', hasShortVersion: false },
    ],
  }

  // Palm Sunday = Easter - 7
  if (diff === -7) return {
    name: 'Palm Sunday of the Lord\'s Passion',
    readings: [
      { id: 'first', label: 'First Reading', reference: 'Isaiah 50:4-7', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'psalm', label: 'Responsorial Psalm', reference: 'Psalm 22:8-9, 17-20, 23-24', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'second', label: 'Second Reading', reference: 'Philippians 2:6-11', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'gospel', label: 'Gospel', reference: 'Matthew 26:14 – 27:66 (A) / Mark 14:1 – 15:47 (B) / Luke 22:14 – 23:56 (C) [or short form]', translation: 'NABRE', text: '', hasShortVersion: true },
    ],
  }

  // Holy Thursday = Easter - 3
  if (diff === -3) return {
    name: 'Holy Thursday (Mass of the Lord\'s Supper)',
    readings: [
      { id: 'first', label: 'First Reading', reference: 'Exodus 12:1-8, 11-14', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'psalm', label: 'Responsorial Psalm', reference: 'Psalm 116:12-13, 15-18', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'second', label: 'Second Reading', reference: '1 Corinthians 11:23-26', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'gospel', label: 'Gospel', reference: 'John 13:1-15', translation: 'NABRE', text: '', hasShortVersion: false },
    ],
  }

  // Good Friday = Easter - 2
  if (diff === -2) return {
    name: 'Good Friday (Passion of the Lord)',
    readings: [
      { id: 'first', label: 'First Reading', reference: 'Isaiah 52:13 – 53:12', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'psalm', label: 'Responsorial Psalm', reference: 'Psalm 31:2, 6, 12-13, 15-17, 25', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'second', label: 'Second Reading', reference: 'Hebrews 4:14-16; 5:7-9', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'gospel', label: 'Gospel (Passion)', reference: 'John 18:1 – 19:42', translation: 'NABRE', text: '', hasShortVersion: true },
    ],
  }

  // Easter Sunday = Easter + 0
  if (diff === 0) return {
    name: 'Easter Sunday of the Resurrection of the Lord',
    readings: [
      { id: 'first', label: 'First Reading', reference: 'Acts 10:34a, 37-43', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'psalm', label: 'Responsorial Psalm', reference: 'Psalm 118:1-2, 16-17, 22-23', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'second', label: 'Second Reading', reference: 'Colossians 3:1-4 (or 1 Corinthians 5:6b-8)', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'gospel', label: 'Gospel', reference: 'John 20:1-9 (or Mark 16:1-7 at Vigil)', translation: 'NABRE', text: '', hasShortVersion: false },
    ],
  }

  // Divine Mercy Sunday = Easter + 7
  if (diff === 7) return {
    name: '2nd Sunday of Easter (Divine Mercy Sunday)',
    readings: [
      { id: 'first', label: 'First Reading', reference: 'Acts 2:42-47 (A) / Acts 4:32-35 (B) / Acts 5:12-16 (C)', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'psalm', label: 'Responsorial Psalm', reference: 'Psalm 118:2-4, 13-15, 22-24', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'second', label: 'Second Reading', reference: '1 Peter 1:3-9 (A) / 1 John 5:1-6 (B) / Revelation 1:9-11a, 12-13, 17-19 (C)', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'gospel', label: 'Gospel', reference: 'John 20:19-31', translation: 'NABRE', text: '', hasShortVersion: false },
    ],
  }

  // Ascension = Easter + 39 (or Easter + 42 for Sunday transfer — varies by diocese)
  if (diff === 39 || diff === 42) return {
    name: 'Ascension of the Lord',
    readings: [
      { id: 'first', label: 'First Reading', reference: 'Acts 1:1-11', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'psalm', label: 'Responsorial Psalm', reference: 'Psalm 47:2-3, 6-9', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'second', label: 'Second Reading', reference: 'Ephesians 1:17-23 (A) / Ephesians 4:1-13 (B) / Hebrews 9:24-28; 10:19-23 (C)', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'gospel', label: 'Gospel', reference: 'Matthew 28:16-20 (A) / Mark 16:15-20 (B) / Luke 24:46-53 (C)', translation: 'NABRE', text: '', hasShortVersion: false },
    ],
  }

  // Pentecost = Easter + 49
  if (diff === 49) return {
    name: 'Pentecost Sunday',
    readings: [
      { id: 'first', label: 'First Reading', reference: 'Acts 2:1-11', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'psalm', label: 'Responsorial Psalm', reference: 'Psalm 104:1, 24, 29-31, 34', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'second', label: 'Second Reading', reference: '1 Corinthians 12:3b-7, 12-13 (A) / Galatians 5:16-25 (B) / Romans 8:8-17 (C)', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'gospel', label: 'Gospel', reference: 'John 20:19-23 (or John 7:37-39 at Vigil)', translation: 'NABRE', text: '', hasShortVersion: false },
    ],
  }

  // Trinity Sunday = Easter + 56
  if (diff === 56) return {
    name: 'Most Holy Trinity',
    readings: [
      { id: 'first', label: 'First Reading', reference: 'Exodus 34:4b-6, 8-9 (A) / Deuteronomy 4:32-34, 39-40 (B) / Proverbs 8:22-31 (C)', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'psalm', label: 'Responsorial Psalm', reference: 'Daniel 3:52-56', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'second', label: 'Second Reading', reference: '2 Corinthians 13:11-13 (A) / Romans 8:14-17 (B) / Romans 5:1-5 (C)', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'gospel', label: 'Gospel', reference: 'John 3:16-18 (A) / Matthew 28:16-20 (B) / John 16:12-15 (C)', translation: 'NABRE', text: '', hasShortVersion: false },
    ],
  }

  // Corpus Christi = Easter + 63
  if (diff === 63) return {
    name: 'Most Holy Body and Blood of Christ (Corpus Christi)',
    readings: [
      { id: 'first', label: 'First Reading', reference: 'Deuteronomy 8:2-3, 14b-16a (A) / Exodus 24:3-8 (B) / Genesis 14:18-20 (C)', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'psalm', label: 'Responsorial Psalm', reference: 'Psalm 147:12-15, 19-20 (A) / Psalm 116:12-13, 15-18 (B) / Psalm 110:1-4 (C)', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'second', label: 'Second Reading', reference: '1 Corinthians 10:16-17 (A) / Hebrews 9:11-15 (B) / 1 Corinthians 11:23-26 (C)', translation: 'NABRE', text: '', hasShortVersion: false },
      { id: 'gospel', label: 'Gospel', reference: 'John 6:51-58 (A) / Mark 14:12-16, 22-26 (B) / Luke 9:11b-17 (C)', translation: 'NABRE', text: '', hasShortVersion: false },
    ],
  }

  return null
}

// ─── SUNDAY LECTIONARY — Season + Week lookup ─────────────────────────────────
// Rather than exact dates (which shift), we compute season+week and look up here
// Returns { first, psalm, second, gospel } reference strings by cycle

export const SUNDAY_LECTIONARY = {
  advent: {
    1: {
      A: { first: 'Isaiah 2:1-5', psalm: 'Psalm 122:1-9', second: 'Romans 13:11-14', gospel: 'Matthew 24:37-44' },
      B: { first: 'Isaiah 63:16b-17, 19b; 64:2-7', psalm: 'Psalm 80:2-3, 15-16, 18-19', second: '1 Corinthians 1:3-9', gospel: 'Mark 13:33-37' },
      C: { first: 'Jeremiah 33:14-16', psalm: 'Psalm 25:4-5, 8-10, 14', second: '1 Thessalonians 3:12 – 4:2', gospel: 'Luke 21:25-28, 34-36' },
    },
    2: {
      A: { first: 'Isaiah 11:1-10', psalm: 'Psalm 72:1-2, 7-8, 12-13, 17', second: 'Romans 15:4-9', gospel: 'Matthew 3:1-12' },
      B: { first: 'Isaiah 40:1-5, 9-11', psalm: 'Psalm 85:9-14', second: '2 Peter 3:8-14', gospel: 'Mark 1:1-8' },
      C: { first: 'Baruch 5:1-9', psalm: 'Psalm 126:1-6', second: 'Philippians 1:4-6, 8-11', gospel: 'Luke 3:1-6' },
    },
    3: {
      A: { first: 'Isaiah 35:1-6a, 10', psalm: 'Psalm 146:6-10', second: 'James 5:7-10', gospel: 'Matthew 11:2-11' },
      B: { first: 'Isaiah 61:1-2a, 10-11', psalm: 'Luke 1:46-50, 53-54', second: '1 Thessalonians 5:16-24', gospel: 'John 1:6-8, 19-28' },
      C: { first: 'Zephaniah 3:14-18a', psalm: 'Isaiah 12:2-6', second: 'Philippians 4:4-7', gospel: 'Luke 3:10-18' },
    },
    4: {
      A: { first: 'Isaiah 7:10-14', psalm: 'Psalm 24:1-6', second: 'Romans 1:1-7', gospel: 'Matthew 1:18-24' },
      B: { first: '2 Samuel 7:1-5, 8b-12, 14a, 16', psalm: 'Psalm 89:2-5, 27, 29', second: 'Romans 16:25-27', gospel: 'Luke 1:26-38' },
      C: { first: 'Micah 5:1-4a', psalm: 'Psalm 80:2-3, 15-16, 18-19', second: 'Hebrews 10:5-10', gospel: 'Luke 1:39-45' },
    },
  },
  lent: {
    1: {
      A: { first: 'Genesis 2:7-9; 3:1-7', psalm: 'Psalm 51:3-6, 12-14, 17', second: 'Romans 5:12-19', gospel: 'Matthew 4:1-11' },
      B: { first: 'Genesis 9:8-15', psalm: 'Psalm 25:4-9', second: '1 Peter 3:18-22', gospel: 'Mark 1:12-15' },
      C: { first: 'Deuteronomy 26:4-10', psalm: 'Psalm 91:1-2, 10-15', second: 'Romans 10:8-13', gospel: 'Luke 4:1-13' },
    },
    2: {
      A: { first: 'Genesis 12:1-4a', psalm: 'Psalm 33:4-5, 18-20, 22', second: '2 Timothy 1:8b-10', gospel: 'Matthew 17:1-9' },
      B: { first: 'Genesis 22:1-2, 9a, 10-13, 15-18', psalm: 'Psalm 116:10, 15-19', second: 'Romans 8:31b-34', gospel: 'Mark 9:2-10' },
      C: { first: 'Genesis 15:5-12, 17-18', psalm: 'Psalm 27:1, 7-9, 13-14', second: 'Philippians 3:17 – 4:1', gospel: 'Luke 9:28b-36' },
    },
    3: {
      A: { first: 'Exodus 17:3-7', psalm: 'Psalm 95:1-2, 6-9', second: 'Romans 5:1-2, 5-8', gospel: 'John 4:5-42' },
      B: { first: 'Exodus 20:1-17', psalm: 'Psalm 19:8-11', second: '1 Corinthians 1:22-25', gospel: 'John 2:13-25' },
      C: { first: 'Exodus 3:1-8a, 13-15', psalm: 'Psalm 103:1-4, 6-8, 11', second: '1 Corinthians 10:1-6, 10-12', gospel: 'Luke 13:1-9' },
    },
    4: {
      A: { first: '1 Samuel 16:1b, 6-7, 10-13a', psalm: 'Psalm 23:1-6', second: 'Ephesians 5:8-14', gospel: 'John 9:1-41' },
      B: { first: '2 Chronicles 36:14-16, 19-23', psalm: 'Psalm 137:1-6', second: 'Ephesians 2:4-10', gospel: 'John 3:14-21' },
      C: { first: 'Joshua 5:9a, 10-12', psalm: 'Psalm 34:2-7', second: '2 Corinthians 5:17-21', gospel: 'Luke 15:1-3, 11-32' },
    },
    5: {
      A: { first: 'Ezekiel 37:12-14', psalm: 'Psalm 130:1-8', second: 'Romans 8:8-11', gospel: 'John 11:1-45' },
      B: { first: 'Jeremiah 31:31-34', psalm: 'Psalm 51:3-4, 12-15', second: 'Hebrews 5:7-9', gospel: 'John 12:20-33' },
      C: { first: 'Isaiah 43:16-21', psalm: 'Psalm 126:1-6', second: 'Philippians 3:8-14', gospel: 'John 8:1-11' },
    },
  },
  easter: {
    2: { // Divine Mercy (same gospel every year)
      A: { first: 'Acts 2:42-47', psalm: 'Psalm 118:2-4, 13-15, 22-24', second: '1 Peter 1:3-9', gospel: 'John 20:19-31' },
      B: { first: 'Acts 4:32-35', psalm: 'Psalm 118:2-4, 13-15, 22-24', second: '1 John 5:1-6', gospel: 'John 20:19-31' },
      C: { first: 'Acts 5:12-16', psalm: 'Psalm 118:2-4, 13-15, 22-24', second: 'Revelation 1:9-11a, 12-13, 17-19', gospel: 'John 20:19-31' },
    },
    3: {
      A: { first: 'Acts 2:14, 22-33', psalm: 'Psalm 16:1-2, 5, 7-11', second: '1 Peter 1:17-21', gospel: 'Luke 24:13-35' },
      B: { first: 'Acts 3:13-15, 17-19', psalm: 'Psalm 4:2, 4, 7-9', second: '1 John 2:1-5a', gospel: 'Luke 24:35-48' },
      C: { first: 'Acts 5:27b-32, 40b-41', psalm: 'Psalm 30:2, 4-6, 11-13', second: 'Revelation 5:11-14', gospel: 'John 21:1-19' },
    },
    4: {
      A: { first: 'Acts 2:14a, 36-41', psalm: 'Psalm 23:1-6', second: '1 Peter 2:20b-25', gospel: 'John 10:1-10' },
      B: { first: 'Acts 4:8-12', psalm: 'Psalm 118:1, 8-9, 21-23, 26, 28-29', second: '1 John 3:1-2', gospel: 'John 10:11-18' },
      C: { first: 'Acts 13:14, 43-52', psalm: 'Psalm 100:1-3, 5', second: 'Revelation 7:9, 14b-17', gospel: 'John 10:27-30' },
    },
    5: {
      A: { first: 'Acts 6:1-7', psalm: 'Psalm 33:1-2, 4-5, 18-19', second: '1 Peter 2:4-9', gospel: 'John 14:1-12' },
      B: { first: 'Acts 9:26-31', psalm: 'Psalm 22:26-28, 30-32', second: '1 John 3:18-24', gospel: 'John 15:1-8' },
      C: { first: 'Acts 14:21b-27', psalm: 'Psalm 145:8-13', second: 'Revelation 21:1-5a', gospel: 'John 13:31-33a, 34-35' },
    },
    6: {
      A: { first: 'Acts 8:5-8, 14-17', psalm: 'Psalm 66:1-7, 16, 20', second: '1 Peter 3:15-18', gospel: 'John 14:15-21' },
      B: { first: 'Acts 10:25-26, 34-35, 44-48', psalm: 'Psalm 98:1-4', second: '1 John 4:7-10', gospel: 'John 15:9-17' },
      C: { first: 'Acts 15:1-2, 22-29', psalm: 'Psalm 67:2-3, 5-6, 8', second: 'Revelation 21:10-14, 22-23', gospel: 'John 14:23-29' },
    },
    7: {
      A: { first: 'Acts 1:12-14', psalm: 'Psalm 27:1, 4, 7-8', second: '1 Peter 4:13-16', gospel: 'John 17:1-11a' },
      B: { first: 'Acts 1:15-17, 20a, 20c-26', psalm: 'Psalm 103:1-2, 11-12, 19-20ab', second: '1 John 4:11-16', gospel: 'John 17:11b-19' },
      C: { first: 'Acts 7:55-60', psalm: 'Psalm 97:1-2, 6-7, 9', second: 'Revelation 22:12-14, 16-17, 20', gospel: 'John 17:20-26' },
    },
  },
  ordinary: {
    2: {
      A: { first: 'Isaiah 49:3, 5-6', psalm: 'Psalm 40:2, 4, 7-10', second: '1 Corinthians 1:1-3', gospel: 'John 1:29-34' },
      B: { first: '1 Samuel 3:3b-10, 19', psalm: 'Psalm 40:2, 4, 7-10', second: '1 Corinthians 6:13c-15a, 17-20', gospel: 'John 1:35-42' },
      C: { first: 'Isaiah 62:1-5', psalm: 'Psalm 96:1-3, 7-10', second: '1 Corinthians 12:4-11', gospel: 'John 2:1-11' },
    },
    3: {
      A: { first: 'Isaiah 8:23 – 9:3', psalm: 'Psalm 27:1, 4, 13-14', second: '1 Corinthians 1:10-13, 17', gospel: 'Matthew 4:12-23' },
      B: { first: 'Jonah 3:1-5, 10', psalm: 'Psalm 25:4-9', second: '1 Corinthians 7:29-31', gospel: 'Mark 1:14-20' },
      C: { first: 'Nehemiah 8:2-4a, 5-6, 8-10', psalm: 'Psalm 19:8-10, 15', second: '1 Corinthians 12:12-30', gospel: 'Luke 1:1-4; 4:14-21' },
    },
    4: {
      A: { first: 'Zephaniah 2:3; 3:12-13', psalm: 'Psalm 146:6-10', second: '1 Corinthians 1:26-31', gospel: 'Matthew 5:1-12a' },
      B: { first: 'Deuteronomy 18:15-20', psalm: 'Psalm 95:1-2, 6-9', second: '1 Corinthians 7:32-35', gospel: 'Mark 1:21-28' },
      C: { first: 'Jeremiah 1:4-5, 17-19', psalm: 'Psalm 71:1-6, 15, 17', second: '1 Corinthians 12:31 – 13:13', gospel: 'Luke 4:21-30' },
    },
    5: {
      A: { first: 'Isaiah 58:7-10', psalm: 'Psalm 112:4-9', second: '1 Corinthians 2:1-5', gospel: 'Matthew 5:13-16' },
      B: { first: 'Job 7:1-4, 6-7', psalm: 'Psalm 147:1-6', second: '1 Corinthians 9:16-19, 22-23', gospel: 'Mark 1:29-39' },
      C: { first: 'Isaiah 6:1-2a, 3-8', psalm: 'Psalm 138:1-5, 7-8', second: '1 Corinthians 15:1-11', gospel: 'Luke 5:1-11' },
    },
    6: {
      A: { first: 'Sirach 15:15-20', psalm: 'Psalm 119:1-2, 4-5, 17-18, 33-34', second: '1 Corinthians 2:6-10', gospel: 'Matthew 5:17-37' },
      B: { first: 'Leviticus 13:1-2, 44-46', psalm: 'Psalm 32:1-2, 5, 11', second: '1 Corinthians 10:31 – 11:1', gospel: 'Mark 1:40-45' },
      C: { first: 'Jeremiah 17:5-8', psalm: 'Psalm 1:1-4, 6', second: '1 Corinthians 15:12, 16-20', gospel: 'Luke 6:17, 20-26' },
    },
    7: {
      A: { first: 'Leviticus 19:1-2, 17-18', psalm: 'Psalm 103:1-4, 8, 10, 12-13', second: '1 Corinthians 3:16-23', gospel: 'Matthew 5:38-48' },
      B: { first: 'Isaiah 43:18-19, 21-22, 24b-25', psalm: 'Psalm 41:2-5, 13-14', second: '2 Corinthians 1:18-22', gospel: 'Mark 2:1-12' },
      C: { first: '1 Samuel 26:2, 7-9, 12-13, 22-23', psalm: 'Psalm 103:1-4, 8, 10, 12-13', second: '1 Corinthians 15:45-49', gospel: 'Luke 6:27-38' },
    },
    8: {
      A: { first: 'Isaiah 49:14-15', psalm: 'Psalm 62:2-6, 8-9', second: '1 Corinthians 4:1-5', gospel: 'Matthew 6:24-34' },
      B: { first: 'Hosea 2:16b, 17b, 21-22', psalm: 'Psalm 103:1-4, 8, 10, 12-13', second: '2 Corinthians 3:1b-6', gospel: 'Mark 2:18-22' },
      C: { first: 'Sirach 27:4-7', psalm: 'Psalm 92:2-3, 13-16', second: '1 Corinthians 15:54-58', gospel: 'Luke 6:39-45' },
    },
    9: {
      A: { first: 'Deuteronomy 11:18, 26-28, 32', psalm: 'Psalm 31:2-4, 17, 25', second: 'Romans 3:21-25, 28', gospel: 'Matthew 7:21-27' },
      B: { first: 'Deuteronomy 5:12-15', psalm: 'Psalm 81:3-8, 10-11', second: '2 Corinthians 4:6-11', gospel: 'Mark 2:23 – 3:6' },
      C: { first: '1 Kings 8:41-43', psalm: 'Psalm 117:1-2', second: 'Galatians 1:1-2, 6-10', gospel: 'Luke 7:1-10' },
    },
    10: {
      A: { first: 'Hosea 6:3-6', psalm: 'Psalm 50:1, 8, 12-15', second: 'Romans 4:18-25', gospel: 'Matthew 9:9-13' },
      B: { first: 'Genesis 3:9-15', psalm: 'Psalm 130:1-8', second: '2 Corinthians 4:13 – 5:1', gospel: 'Mark 3:20-35' },
      C: { first: '1 Kings 17:17-24', psalm: 'Psalm 30:2, 4-6, 11-13', second: 'Galatians 1:11-19', gospel: 'Luke 7:11-17' },
    },
    11: {
      A: { first: 'Exodus 19:2-6a', psalm: 'Psalm 100:1-3, 5', second: 'Romans 5:6-11', gospel: 'Matthew 9:36 – 10:8' },
      B: { first: 'Ezekiel 17:22-24', psalm: 'Psalm 92:2-3, 13-16', second: '2 Corinthians 5:6-10', gospel: 'Mark 4:26-34' },
      C: { first: '2 Samuel 12:7-10, 13', psalm: 'Psalm 32:1-2, 5, 7, 11', second: 'Galatians 2:16, 19-21', gospel: 'Luke 7:36 – 8:3' },
    },
    12: {
      A: { first: 'Jeremiah 20:10-13', psalm: 'Psalm 69:8-10, 14, 17, 33-35', second: 'Romans 5:12-15', gospel: 'Matthew 10:26-33' },
      B: { first: 'Job 38:1, 8-11', psalm: 'Psalm 107:23-26, 28-31', second: '2 Corinthians 5:14-17', gospel: 'Mark 4:35-41' },
      C: { first: 'Zechariah 12:10-11; 13:1', psalm: 'Psalm 63:2-6, 8-9', second: 'Galatians 3:26-29', gospel: 'Luke 9:18-24' },
    },
    13: {
      A: { first: '2 Kings 4:8-11, 14-16a', psalm: 'Psalm 89:2-3, 16-19', second: 'Romans 6:3-4, 8-11', gospel: 'Matthew 10:37-42' },
      B: { first: 'Wisdom 1:13-15; 2:23-24', psalm: 'Psalm 30:2, 4-6, 11-13', second: '2 Corinthians 8:7, 9, 13-15', gospel: 'Mark 5:21-43' },
      C: { first: '1 Kings 19:16b, 19-21', psalm: 'Psalm 16:1-2, 5, 7-11', second: 'Galatians 5:1, 13-18', gospel: 'Luke 9:51-62' },
    },
    14: {
      A: { first: 'Zechariah 9:9-10', psalm: 'Psalm 145:1-2, 8-11, 13-14', second: 'Romans 8:9, 11-13', gospel: 'Matthew 11:25-30' },
      B: { first: 'Ezekiel 2:2-5', psalm: 'Psalm 123:1-4', second: '2 Corinthians 12:7-10', gospel: 'Mark 6:1-6' },
      C: { first: 'Isaiah 66:10-14c', psalm: 'Psalm 66:1-7, 16, 20', second: 'Galatians 6:14-18', gospel: 'Luke 10:1-12, 17-20' },
    },
    15: {
      A: { first: 'Isaiah 55:10-11', psalm: 'Psalm 65:10-14', second: 'Romans 8:18-23', gospel: 'Matthew 13:1-23' },
      B: { first: 'Amos 7:12-15', psalm: 'Psalm 85:9-14', second: 'Ephesians 1:3-14', gospel: 'Mark 6:7-13' },
      C: { first: 'Deuteronomy 30:10-14', psalm: 'Psalm 69:14, 17, 30-31, 33-34, 36-37', second: 'Colossians 1:15-20', gospel: 'Luke 10:25-37' },
    },
    16: {
      A: { first: 'Wisdom 12:13, 16-19', psalm: 'Psalm 86:5-6, 9-10, 15-16', second: 'Romans 8:26-27', gospel: 'Matthew 13:24-43' },
      B: { first: 'Jeremiah 23:1-6', psalm: 'Psalm 23:1-6', second: 'Ephesians 2:13-18', gospel: 'Mark 6:30-34' },
      C: { first: 'Genesis 18:1-10a', psalm: 'Psalm 15:2-5', second: 'Colossians 1:24-28', gospel: 'Luke 10:38-42' },
    },
    17: {
      A: { first: '1 Kings 3:5, 7-12', psalm: 'Psalm 119:57, 72, 76-77, 127-130', second: 'Romans 8:28-30', gospel: 'Matthew 13:44-52' },
      B: { first: '2 Kings 4:42-44', psalm: 'Psalm 145:10-11, 15-18', second: 'Ephesians 4:1-6', gospel: 'John 6:1-15' },
      C: { first: 'Genesis 18:20-32', psalm: 'Psalm 138:1-3, 6-8', second: 'Colossians 2:12-14', gospel: 'Luke 11:1-13' },
    },
    18: {
      A: { first: 'Isaiah 55:1-3', psalm: 'Psalm 145:8-9, 15-18', second: 'Romans 8:35, 37-39', gospel: 'Matthew 14:13-21' },
      B: { first: 'Exodus 16:2-4, 12-15', psalm: 'Psalm 78:3-4, 23-25, 54', second: 'Ephesians 4:17, 20-24', gospel: 'John 6:24-35' },
      C: { first: 'Ecclesiastes 1:2; 2:21-23', psalm: 'Psalm 90:3-6, 12-14, 17', second: 'Colossians 3:1-5, 9-11', gospel: 'Luke 12:13-21' },
    },
    19: {
      A: { first: '1 Kings 19:9a, 11-13a', psalm: 'Psalm 85:9-14', second: 'Romans 9:1-5', gospel: 'Matthew 14:22-33' },
      B: { first: '1 Kings 19:4-8', psalm: 'Psalm 34:2-9', second: 'Ephesians 4:30 – 5:2', gospel: 'John 6:41-51' },
      C: { first: 'Wisdom 18:6-9', psalm: 'Psalm 33:1, 12, 18-22', second: 'Hebrews 11:1-2, 8-19', gospel: 'Luke 12:32-48' },
    },
    20: {
      A: { first: 'Isaiah 56:1, 6-7', psalm: 'Psalm 67:2-3, 5-6, 8', second: 'Romans 11:13-15, 29-32', gospel: 'Matthew 15:21-28' },
      B: { first: 'Proverbs 9:1-6', psalm: 'Psalm 34:2-7', second: 'Ephesians 5:15-20', gospel: 'John 6:51-58' },
      C: { first: 'Jeremiah 38:4-6, 8-10', psalm: 'Psalm 40:2-4, 18', second: 'Hebrews 12:1-4', gospel: 'Luke 12:49-53' },
    },
    21: {
      A: { first: 'Isaiah 22:19-23', psalm: 'Psalm 138:1-3, 6, 8', second: 'Romans 11:33-36', gospel: 'Matthew 16:13-20' },
      B: { first: 'Joshua 24:1-2a, 15-17, 18b', psalm: 'Psalm 34:2-3, 16-21', second: 'Ephesians 5:21-32', gospel: 'John 6:60-69' },
      C: { first: 'Isaiah 66:18-21', psalm: 'Psalm 117:1-2', second: 'Hebrews 12:5-7, 11-13', gospel: 'Luke 13:22-30' },
    },
    22: {
      A: { first: 'Jeremiah 20:7-9', psalm: 'Psalm 63:2-6, 8-9', second: 'Romans 12:1-2', gospel: 'Matthew 16:21-27' },
      B: { first: 'Deuteronomy 4:1-2, 6-8', psalm: 'Psalm 15:2-5', second: 'James 1:17-18, 21b-22, 27', gospel: 'Mark 7:1-8, 14-15, 21-23' },
      C: { first: 'Sirach 3:17-18, 20, 28-29', psalm: 'Psalm 68:4-7, 10-11', second: 'Hebrews 12:18-19, 22-24a', gospel: 'Luke 14:1, 7-14' },
    },
    23: {
      A: { first: 'Ezekiel 33:7-9', psalm: 'Psalm 95:1-2, 6-9', second: 'Romans 13:8-10', gospel: 'Matthew 18:15-20' },
      B: { first: 'Isaiah 35:4-7a', psalm: 'Psalm 146:6-10', second: 'James 2:1-5', gospel: 'Mark 7:31-37' },
      C: { first: 'Wisdom 9:13-18b', psalm: 'Psalm 90:3-6, 12-14, 17', second: 'Philemon 9-10, 12-17', gospel: 'Luke 14:25-33' },
    },
    24: {
      A: { first: 'Sirach 27:30 – 28:7', psalm: 'Psalm 103:1-4, 9-12', second: 'Romans 14:7-9', gospel: 'Matthew 18:21-35' },
      B: { first: 'Isaiah 50:4-9a', psalm: 'Psalm 116:1-6, 8-9', second: 'James 2:14-18', gospel: 'Mark 8:27-35' },
      C: { first: 'Exodus 32:7-11, 13-14', psalm: 'Psalm 51:3-4, 12-13, 17, 19', second: '1 Timothy 1:12-17', gospel: 'Luke 15:1-32' },
    },
    25: {
      A: { first: 'Isaiah 55:6-9', psalm: 'Psalm 145:2-3, 8-9, 17-18', second: 'Philippians 1:20c-24, 27a', gospel: 'Matthew 20:1-16a' },
      B: { first: 'Wisdom 2:12, 17-20', psalm: 'Psalm 54:3-6, 8', second: 'James 3:16 – 4:3', gospel: 'Mark 9:30-37' },
      C: { first: 'Amos 8:4-7', psalm: 'Psalm 113:1-2, 4-8', second: '1 Timothy 2:1-8', gospel: 'Luke 16:1-13' },
    },
    26: {
      A: { first: 'Ezekiel 18:25-28', psalm: 'Psalm 25:4-9', second: 'Philippians 2:1-11', gospel: 'Matthew 21:28-32' },
      B: { first: 'Numbers 11:25-29', psalm: 'Psalm 19:8, 10, 12-14', second: 'James 5:1-6', gospel: 'Mark 9:38-43, 45, 47-48' },
      C: { first: 'Amos 6:1a, 4-7', psalm: 'Psalm 146:7-10', second: '1 Timothy 6:11-16', gospel: 'Luke 16:19-31' },
    },
    27: {
      A: { first: 'Isaiah 5:1-7', psalm: 'Psalm 80:9, 12-16, 19-20', second: 'Philippians 4:6-9', gospel: 'Matthew 21:33-43' },
      B: { first: 'Genesis 2:18-24', psalm: 'Psalm 128:1-6', second: 'Hebrews 2:9-11', gospel: 'Mark 10:2-16' },
      C: { first: 'Habakkuk 1:2-3; 2:2-4', psalm: 'Psalm 95:1-2, 6-9', second: '2 Timothy 1:6-8, 13-14', gospel: 'Luke 17:5-10' },
    },
    28: {
      A: { first: 'Isaiah 25:6-10a', psalm: 'Psalm 23:1-6', second: 'Philippians 4:12-14, 19-20', gospel: 'Matthew 22:1-14' },
      B: { first: 'Wisdom 7:7-11', psalm: 'Psalm 90:12-17', second: 'Hebrews 4:12-13', gospel: 'Mark 10:17-30' },
      C: { first: '2 Kings 5:14-17', psalm: 'Psalm 98:1-4', second: '2 Timothy 2:8-13', gospel: 'Luke 17:11-19' },
    },
    29: {
      A: { first: 'Isaiah 45:1, 4-6', psalm: 'Psalm 96:1, 3-5, 7-10', second: '1 Thessalonians 1:1-5b', gospel: 'Matthew 22:15-21' },
      B: { first: 'Isaiah 53:10-11', psalm: 'Psalm 33:4-5, 18-20, 22', second: 'Hebrews 4:14-16', gospel: 'Mark 10:35-45' },
      C: { first: 'Sirach 35:12-14, 16-18', psalm: 'Psalm 34:2-3, 17-19, 23', second: '2 Timothy 4:6-8, 16-18', gospel: 'Luke 18:1-8' },
    },
    30: {
      A: { first: 'Exodus 22:20-26', psalm: 'Psalm 18:2-4, 47, 51', second: '1 Thessalonians 1:5c-10', gospel: 'Matthew 22:34-40' },
      B: { first: 'Jeremiah 31:7-9', psalm: 'Psalm 126:1-6', second: 'Hebrews 5:1-6', gospel: 'Mark 10:46-52' },
      C: { first: 'Sirach 35:12-14, 16-18', psalm: 'Psalm 34:2-3, 17-19, 23', second: '2 Timothy 4:6-8, 16-18', gospel: 'Luke 18:9-14' },
    },
    31: {
      A: { first: 'Malachi 1:14b – 2:2b, 8-10', psalm: 'Psalm 131:1-3', second: '1 Thessalonians 2:7b-9, 13', gospel: 'Matthew 23:1-12' },
      B: { first: 'Deuteronomy 6:2-6', psalm: 'Psalm 18:2-4, 47, 51', second: 'Hebrews 7:23-28', gospel: 'Mark 12:28b-34' },
      C: { first: 'Wisdom 11:22 – 12:2', psalm: 'Psalm 145:1-2, 8-11, 13-14', second: '2 Thessalonians 1:11 – 2:2', gospel: 'Luke 19:1-10' },
    },
    32: {
      A: { first: 'Wisdom 6:12-16', psalm: 'Psalm 63:2-8', second: '1 Thessalonians 4:13-18', gospel: 'Matthew 25:1-13' },
      B: { first: '1 Kings 17:10-16', psalm: 'Psalm 146:7-10', second: 'Hebrews 9:24-28', gospel: 'Mark 12:38-44' },
      C: { first: '2 Maccabees 7:1-2, 9-14', psalm: 'Psalm 17:1, 5-6, 8, 15', second: '2 Thessalonians 2:16 – 3:5', gospel: 'Luke 20:27-38' },
    },
    33: {
      A: { first: 'Proverbs 31:10-13, 19-20, 30-31', psalm: 'Psalm 128:1-5', second: '1 Thessalonians 5:1-6', gospel: 'Matthew 25:14-30' },
      B: { first: 'Daniel 12:1-3', psalm: 'Psalm 16:5, 8-11', second: 'Hebrews 10:11-14, 18', gospel: 'Mark 13:24-32' },
      C: { first: 'Malachi 3:19-20a', psalm: 'Psalm 98:5-9', second: '2 Thessalonians 3:7-12', gospel: 'Luke 21:5-19' },
    },
    34: { // Christ the King
      A: { first: 'Ezekiel 34:11-12, 15-17', psalm: 'Psalm 23:1-6', second: '1 Corinthians 15:20-26, 28', gospel: 'Matthew 25:31-46' },
      B: { first: 'Daniel 7:13-14', psalm: 'Psalm 93:1-2, 5', second: 'Revelation 1:5-8', gospel: 'John 18:33b-37' },
      C: { first: '2 Samuel 5:1-3', psalm: 'Psalm 122:1-5', second: 'Colossians 1:12-20', gospel: 'Luke 23:35-43' },
    },
  },
}

// ─── CYCLE RESOLVER ───────────────────────────────────────────────────────────
// If a reference contains "(A) / (B) / (C)" alternatives, return only the
// portion for the given cycle. Strips cycle labels and "[or short form]" noise.
// E.g. "Matthew 26:14 – 27:66 (A) / Mark 14:1 – 15:47 (B)" + 'A' → "Matthew 26:14 – 27:66"
function resolveForCycle(reference, cycle) {
  if (!reference || !cycle) return reference
  if (!reference.includes(' / ') || !/\([ABC]\)/.test(reference)) return reference
  const parts = reference.split(' / ')
  for (const part of parts) {
    if (part.includes(`(${cycle})`)) {
      return part
        .replace(/\s*\([ABC]\)\s*/g, '')
        .replace(/\s*\[.*?\]\s*/g, '')
        .trim()
    }
  }
  // Fallback: return first option cleaned
  return parts[0].replace(/\s*\([ABC]\)\s*/g, '').replace(/\s*\[.*?\]\s*/g, '').trim()
}

// Apply cycle resolution across a full readings array
function resolveCycles(readings, cycle) {
  if (!cycle) return readings
  return readings.map(r => ({ ...r, reference: resolveForCycle(r.reference, cycle) }))
}

// ─── MOVEABLE FEAST NAME LOOKUP ───────────────────────────────────────────────
// Scan all moveable feast readings objects by name (without needing a specific date)
// Used when user selects a feast by name (e.g. "Ash Wednesday") without a matching date
function getMoveableFeastByName(cleanQuery, cycleTranslation, cycle) {
  // Inline a representative year to enumerate moveable feasts
  // (readings are the same every year, just the date shifts)
  const year = new Date().getFullYear()
  const easter = getEasterDate(year)
  // Generate candidates: check offsets from -60 to +80 days of Easter
  const day = 86400000
  for (let offset = -60; offset <= 80; offset++) {
    const candidate = new Date(easter.getTime() + offset * day)
    const feast = getMoveableFeastReadings(candidate, easter)
    if (feast) {
      const cleanFeast = feast.name.replace(/\s*\([^)]*\)\s*/g, '').toLowerCase()
      if (cleanFeast.includes(cleanQuery) || cleanQuery.includes(cleanFeast)) {
        const readings = resolveCycles(
          feast.readings.map(r => ({ ...r, translation: cycleTranslation })),
          cycle
        )
        return { pickerMode: 'standard', readings, translationDefault: cycleTranslation, feastName: feast.name }
      }
    }
  }
  return null
}

// ─── RESOLVER: getReadingsForOccasion ────────────────────────────────────────
// Main entry point called by Step2Readings
// Returns:
//   { pickerMode: 'wedding'|'funeral', translationDefault: 'NABRE' }
//   OR
//   { pickerMode: 'standard', readings: [], translationDefault: string, feastName: string|null }

// Occasions that map directly to a feast name lookup (beyond just Ash Wednesday)
const NAMED_FEAST_OCCASIONS = [
  'Ash Wednesday', 'Palm Sunday', 'Holy Thursday', 'Good Friday',
  'Holy Saturday', 'Easter Sunday', 'Easter Vigil', 'Divine Mercy Sunday',
  'Ascension', 'Pentecost', 'Trinity Sunday', 'Corpus Christi',
  'All Saints', 'All Souls',
]

export function getReadingsForOccasion({ date, occasion, tradition, liturgicalYear, liturgicalSeason, feastName }) {
  const cycleTranslation = (occasion === 'School Mass' || occasion === "Children's Mass") ? 'CEV' : 'NABRE'

  // Compute liturgical cycle early — needed for A/B/C resolution
  const cycle = liturgicalYear || (date ? getLiturgicalYear(date) : 'A')

  // 1. Wedding → picker mode
  if (occasion === 'Wedding') {
    return { pickerMode: 'wedding', translationDefault: 'NABRE' }
  }

  // 2. Funeral → picker mode
  if (occasion === 'Funeral Mass') {
    return { pickerMode: 'funeral', translationDefault: 'NABRE' }
  }

  // 3. Named feast from feastName state, OR from occasion dropdown for holy days
  const searchFeastName = feastName ||
    (NAMED_FEAST_OCCASIONS.includes(occasion) ? occasion : null)
  if (searchFeastName && searchFeastName.trim()) {
    // Strip parenthetical date hints like "(December 8)" before matching
    const cleanQuery = searchFeastName.trim().replace(/\s*\([^)]*\)\s*/g, '').toLowerCase()
    // Check fixed feasts by name match (both directions, using cleaned strings)
    for (const [mmdd, feast] of Object.entries(FIXED_FEAST_READINGS)) {
      const cleanFeast = feast.name.replace(/\s*\([^)]*\)\s*/g, '').toLowerCase()
      if (cleanFeast.includes(cleanQuery) || cleanQuery.includes(cleanFeast)) {
        const readings = resolveCycles(
          feast.readings.map(r => ({ ...r, translation: cycleTranslation })),
          cycle
        )
        return { pickerMode: 'standard', readings, translationDefault: cycleTranslation, feastName: feast.name }
      }
    }
    // Check moveable feasts by name (Ash Wednesday, Holy Thursday, Good Friday, etc.)
    const moveableByName = getMoveableFeastByName(cleanQuery, cycleTranslation, cycle)
    if (moveableByName) return moveableByName
  }

  if (!date) {
    return { pickerMode: 'standard', readings: STUB_READINGS.default.readings, translationDefault: cycleTranslation, feastName: null }
  }

  const d = new Date(date + 'T00:00:00')
  const year = d.getFullYear()
  const mmdd = String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')

  // 4. Fixed feast by date (MM-DD match)
  if (FIXED_FEAST_READINGS[mmdd]) {
    const feast = FIXED_FEAST_READINGS[mmdd]
    const readings = resolveCycles(
      feast.readings.map(r => ({ ...r, translation: cycleTranslation })),
      cycle
    )
    return { pickerMode: 'standard', readings, translationDefault: cycleTranslation, feastName: feast.name }
  }

  // 5. Moveable feasts — check date against Easter-relative offsets
  const easterDate = getEasterDate(year)
  const moveableFeast = getMoveableFeastReadings(d, easterDate)
  if (moveableFeast) {
    const readings = resolveCycles(
      moveableFeast.readings.map(r => ({ ...r, translation: cycleTranslation })),
      cycle
    )
    return { pickerMode: 'standard', readings, translationDefault: cycleTranslation, feastName: moveableFeast.name }
  }

  // 6. Sunday lectionary lookup by season + week
  const season = liturgicalSeason || getLiturgicalSeason(date)
  const seasonReadings = getSundayReadings(date, season, cycle, easterDate)

  if (seasonReadings) {
    const readings = buildReadingObjects(seasonReadings, cycleTranslation)
    return { pickerMode: 'standard', readings, translationDefault: cycleTranslation, feastName: null }
  }

  // Fallback: stub
  return { pickerMode: 'standard', readings: STUB_READINGS.default.readings, translationDefault: cycleTranslation, feastName: null }
}

// Determine which week of the season we're in and return the reference set
function getSundayReadings(date, season, cycle, easterDate) {
  const d = new Date(date + (typeof date === 'string' ? 'T00:00:00' : ''))
  const year = d.getFullYear()
  const doy = getDayOfYear(d)
  const easterDoy = getDayOfYear(easterDate)

  if (season === 'Advent') {
    const christmas = new Date(year, 11, 25)
    const firstAdventDoy = getDayOfYear(christmas) - 22
    const week = Math.min(Math.ceil((doy - firstAdventDoy) / 7) + 1, 4)
    return SUNDAY_LECTIONARY.advent[week]?.[cycle]
  }

  if (season === 'Lent') {
    const week = Math.min(Math.ceil((doy - (easterDoy - 46)) / 7), 5)
    return SUNDAY_LECTIONARY.lent[week]?.[cycle]
  }

  if (season === 'Easter') {
    const week = Math.min(Math.ceil((doy - easterDoy) / 7) + 1, 7)
    return SUNDAY_LECTIONARY.easter[week]?.[cycle]
  }

  if (season === 'Ordinary Time') {
    const pentecostDoy = easterDoy + 49
    let week
    if (doy > pentecostDoy) {
      // Post-Pentecost ordinary time: approximately week 10-34
      week = Math.min(Math.ceil((doy - pentecostDoy) / 7) + 9, 34)
    } else {
      // Early ordinary time: weeks 2-8 (between Epiphany and Lent)
      const epiphanyDoy = getDayOfYear(new Date(year, 0, 6))
      week = Math.min(Math.ceil((doy - epiphanyDoy) / 7) + 1, 8)
      if (week < 2) week = 2
    }
    return SUNDAY_LECTIONARY.ordinary[week]?.[cycle]
  }

  return null
}

function buildReadingObjects(refs, translation) {
  const readings = []
  if (refs.first) readings.push({ id: 'first', label: 'First Reading', reference: refs.first, translation, text: '', hasShortVersion: false })
  if (refs.psalm) readings.push({ id: 'psalm', label: 'Responsorial Psalm', reference: refs.psalm, translation, text: '', hasShortVersion: false })
  if (refs.second) readings.push({ id: 'second', label: 'Second Reading', reference: refs.second, translation, text: '', hasShortVersion: false })
  if (refs.gospel) readings.push({ id: 'gospel', label: 'Gospel', reference: refs.gospel, translation, text: '', hasShortVersion: false })
  return readings
}

// ─────────────────────────────────────────────────────────────────────────────

// Stub readings — in production these come from a lectionary API
// Keyed by "YYYY-MM-DD" for specific dates, or by season+cycle for lookup
export const STUB_READINGS = {
  default: {
    tradition: 'Catholic',
    occasion: 'Sunday Mass',
    readings: [
      {
        id: 'first',
        label: 'First Reading',
        reference: 'Isaiah 43:16–21',
        translation: 'NABRE',
        text: `Thus says the LORD,\nwho opens a way in the sea\nand a path in the mighty waters,\nwho leads out chariots and horsemen,\na powerful army,\ntill they lie prostrate together, never to rise,\nextinguished and quenched like a wick:\nRemember not the events of the past,\nthe things of long ago consider not;\nsee, I am doing something new!\nNow it springs forth, do you not perceive it?\nIn the desert I make a way,\nin the wasteland, rivers.\nWild beasts honor me,\njackals and ostriches,\nfor I put water in the desert\nand rivers in the wasteland\nfor my chosen people to drink,\nthe people whom I formed for myself,\nthat they might announce my praise.`,
        hasShortVersion: false,
      },
      {
        id: 'psalm',
        label: 'Responsorial Psalm',
        reference: 'Psalm 126',
        translation: 'NABRE',
        text: `R. The Lord has done great things for us; we are filled with joy.\n\nWhen the LORD restored the fortunes of Zion,\nwe thought we were dreaming.\nOur mouths were filled with laughter;\nour tongues sang for joy.\n\nR. The Lord has done great things for us; we are filled with joy.`,
        hasShortVersion: false,
      },
      {
        id: 'second',
        label: 'Second Reading',
        reference: 'Philippians 3:8–14',
        translation: 'NABRE',
        text: `Brothers and sisters:\nI consider everything as a loss\nbecause of the supreme good of knowing Christ Jesus my Lord.\nFor his sake I have accepted the loss of all things\nand I consider them so much rubbish,\nthat I may gain Christ and be found in him,\nnot having any righteousness of my own based on the law\nbut that which comes through faith in Christ,\nthe righteousness from God,\ndepending on faith to know him and the power of his resurrection\nand the sharing of his sufferings by being conformed to his death,\nif somehow I may attain the resurrection from the dead.\n\nIt is not that I have already taken hold of it\nor have already attained perfect maturity,\nbut I continue my pursuit in hope that I may possess it,\nsince I have indeed been taken possession of by Christ Jesus.\nBrothers and sisters, I for my part\ndo not consider myself to have taken possession.\nJust one thing: forgetting what lies behind\nbut straining forward to what lies ahead,\nI continue my pursuit toward the goal,\nthe prize of God's upward calling, in Christ Jesus.`,
        hasShortVersion: false,
      },
      {
        id: 'gospel',
        label: 'Gospel',
        reference: 'John 8:1–11',
        translation: 'NABRE',
        text: `Jesus went to the Mount of Olives.\nBut early in the morning he arrived again in the temple area,\nand all the people started coming to him,\nand he sat down and taught them.\nThen the scribes and the Pharisees brought a woman\nwho had been caught in adultery\nand made her stand in the middle.\nThey said to him,\n"Teacher, this woman was caught\nin the very act of committing adultery.\nNow in the law, Moses commanded us to stone such women.\nSo what do you say?"\nThey said this to test him,\nso that they could have some charge to bring against him.\nJesus bent down and began to write on the ground with his finger.\nBut when they continued asking him,\nhe straightened up and said to them,\n"Let the one among you who is without sin\nbe the first to throw a stone at her."\nAgain he bent down and wrote on the ground.\nAnd in response, they went away one by one,\nbeginning with the elders.\nSo he was left alone with the woman before him.\nThen Jesus straightened up and said to her,\n"Woman, where are they?\nHas no one condemned you?"\nShe replied, "No one, sir."\nThen Jesus said, "Neither do I condemn you.\nGo, and from now on do not sin any more."`,
        hasShortVersion: false,
      },
    ],
  },
}

export const LECTIO_PROMPTS = [
  {
    phase: 'Lectio',
    title: 'Read',
    instruction: 'Read the Gospel slowly, as if for the first time. Let the words wash over you without analysis.',
    prompts: [
      'What word or phrase catches your attention?',
      'Is there a line that surprises you, unsettles you, or feels especially alive?',
      'Read it once more — what do you notice on the second pass that you missed?',
    ],
  },
  {
    phase: 'Meditatio',
    title: 'Reflect',
    instruction: 'Sit with the passage. Let it interact with your life, your people, this moment in history.',
    prompts: [
      'Where do you see this Gospel playing out in the world right now?',
      'Which character in the story do you most identify with — and why?',
      'What is the hardest thing this passage asks of someone living today?',
    ],
  },
  {
    phase: 'Oratio',
    title: 'Respond',
    instruction: 'Move from reflection into conversation. What does this stir in you?',
    prompts: [
      'What do you feel as you sit with this text? Consolation, resistance, confusion, hope?',
      'What does this passage ask of you personally before you ask it of anyone else?',
      'What might God be saying through this reading to your specific congregation this week?',
    ],
  },
  {
    phase: 'Contemplatio',
    title: 'Rest',
    instruction: 'Let go of analysis. What is the single image, word, or feeling that remains?',
    prompts: [
      'If you had to distill this passage into a single image — not a concept, an image — what would it be?',
      'What do you want your congregation to feel when they walk out the door?',
      'What is the one thing you cannot not say this week?',
    ],
  },
  {
    phase: 'TheTurn',
    title: 'The Surprise',
    instruction: 'Every strong homily has a reversal — a place where the text does something you didn\'t expect. This is where you find yours. What did you assume before you sat with this text, and what do you think now?',
    prompts: [
      'What assumption did you bring to this text that got complicated or overturned?',
      'Is there something here you didn\'t expect — a detail, a silence, an unexpected character move?',
      'What would you have preached on this text before this week\'s preparation? How is that different from what you\'d preach now?',
    ],
  },
]

export const TONE_OPTIONS = [
  { id: 'inspirational', label: 'Inspirational', description: 'Lift people up, call out the best in them' },
  { id: 'challenging', label: 'Challenging', description: 'Invite discomfort, push for growth' },
  { id: 'reflective', label: 'Reflective', description: 'Quiet, contemplative, interior' },
  { id: 'prophetic', label: 'Prophetic', description: 'Speak truth to the moment, name what is real' },
  { id: 'pastoral', label: 'Pastoral', description: 'Warm, accompanying, meet people where they are' },
  { id: 'joyful', label: 'Joyful', description: 'Celebrate, find delight, let the good news be good' },
]

export const THEME_OPTIONS = [
  'Mercy & Forgiveness',
  'New Beginnings',
  'Called by Name',
  'Finding God in the Ordinary',
  'Justice & Solidarity',
  'Doubt & Faith',
  'The Cost of Discipleship',
  'Healing & Wholeness',
  'Community & Belonging',
  'Grief & Hope',
  'Conversion & Change',
  'Gratitude',
  'The Kingdom of God',
  'Love as Action',
  'Waiting & Longing',
]

export const AUDIENCE_OPTIONS = [
  { id: 'parish', label: 'Sunday Parish' },
  { id: 'school', label: 'School / Young People' },
  { id: 'funeral', label: 'Funeral Mass' },
  { id: 'wedding', label: 'Wedding' },
  { id: 'retreat', label: 'Retreat' },
  { id: 'small_group', label: 'Small Community' },
]
