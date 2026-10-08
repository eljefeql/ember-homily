"""Build src/data/episcopalLectionary.js from parsed_raw.json (references only).

Usage: python3 build.py <cache dir>   (needs the vigil pages in <cache dir>/pg)
Keys: '<Year>.<slug>' where Year is A | B | C | ABC.
"""
import json, re, os, sys, html
CACHE = sys.argv[1]
raw = json.load(open('parsed_raw.json'))
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'src', 'data', 'episcopalLectionary.js')

# ── reference cleanup ────────────────────────────────────────────────────────
def clean_ref(r):
    r = r.replace('–', '-').replace('—', '-').replace(' ', ' ')
    r = re.sub(r'\s+', ' ', r).strip()
    r = re.sub(r'\s*-\s*', '-', r)
    r = re.sub(r'^(Psalm \d+),\s*(\d)', r'\1:\2', r)           # "Psalm 105, 1-6" typo
    r = re.sub(r'(\d):\s+(?=[\d(\[])', r'\1:', r)             # "6: 9-22" -> "6:9-22"
    r = r.replace('Wisdom of Solomon', 'Wisdom').replace('Sirach (Ecclesiasticus)', 'Sirach')
    r = re.sub(r'\s+Page \d+, BCP$', '', r)                    # "Canticle 15 Page 91, BCP"
    r = re.sub(r'(\d)(\()', r'\1 \2', r)                       # "14(15-20)" -> "14 (15-20)"
    return r.strip()

def split_or(r):
    parts = [p.strip() for p in re.split(r'\s+or\s+', r)]
    if len(parts) == 1: return parts
    book = re.match(r'^(.*?)(?=\s*\d+(?::|$))', parts[0])
    out = [parts[0]]
    for p in parts[1:]:
        if re.match(r'^[\d(\[]', p) and book:                  # "Psalm 103 or 103:8-14"
            p = f"{book.group(1)} {p}".strip()
            if re.match(r'^Psalm \d+$', book.group(1) or ''): pass
        out.append(p)
    return out


# ── BCP Psalter vs. Bible verse numbering ────────────────────────────────────
# The Lectionary Page cites psalms by the BCP Psalter's verse numbers, which often differ from the
# Bible's (and the RCL's). Where a citation isn't also in Vanderbilt's RCL list, fetch the text of the
# closest-overlapping RCL range of the same psalm and keep the BCP citation for display.
def _verses(spec):
    out = set()
    for part in re.split(r'[,;]', spec):
        m = re.match(r'^\s*(\d+)(?:\s*-\s*(\d+))?', part)
        if m: out.update(range(int(m.group(1)), int(m.group(2) or m.group(1)) + 1))
    return out
def _norm(r):
    r = r.replace('Wisdom of Solomon', 'Wisdom').replace('\u2013', '-')
    return re.sub(r'(?<=\d)[a-c](?=[,;\-]|$)', '', re.sub(r'[\s()\[\]]', '', r)).lower()
VAND = json.load(open(os.path.join(CACHE, 'vand.json')))
VSET = {_norm(x) for x in VAND}
VPSALMS = {}
for x in VAND:
    m = re.match(r'^Psalm (\d+)(?::\s*(.*))?$', x.strip())
    if m: VPSALMS.setdefault(int(m.group(1)), []).append(x.strip().replace(': ', ':'))
def psalm_text_ref(ref):
    m = re.match(r'^Psalm (\d+)(?::(.*))?$', ref)
    if not m or _norm(ref) in VSET: return None
    n = int(m.group(1)); want = _verses(m.group(2) or '')
    best, score = None, 0
    for cand in VPSALMS.get(n, []):
        cm = re.match(r'^Psalm \d+(?::(.*))?$', cand)
        have = _verses(cm.group(1) or '')
        if not want or not have: continue
        j = len(want & have) / len(want | have)
        if j > score: best, score = cand, j
    return best if score >= 0.6 else None

# BCP canticles named in the psalm slot — text comes from the underlying scripture
CANTICLE_TEXT = {'Canticle 13': 'Song of the Three 3:52-56', 'Canticle 9': 'Isaiah 12:2-6', 'Canticle 15': 'Luke 1:46-55', 'Canticle 16': 'Luke 1:68-79'}

LABEL = {'first': 'First Reading', 'psalm': 'The Psalm', 'second': 'Second Reading', 'gospel': 'The Gospel'}
ORDER = ['first', 'psalm', 'second', 'gospel']

def build_set(items, track):
    sel = [i for i in items if i['track'] in (0, track)]
    out = []
    for role in ORDER:
        refs = []
        for i in sel:
            if i['role'] == role:
                for p in split_or(clean_ref(i['ref'])):
                    if p not in refs: refs.append(p)
        if not refs: continue
        rd = {'id': role, 'label': LABEL[role], 'reference': refs[0]}
        if len(refs) > 1: rd['alternates'] = refs[1:]
        for ref in refs:
            if role == 'psalm':
                alt = psalm_text_ref(ref)
                if alt: rd.setdefault('textRefs', {})[ref] = alt
            base = re.match(r'^(Canticle \d+)', ref)
            if base and base.group(1) in CANTICLE_TEXT:
                rd.setdefault('textRefs', {})[ref] = CANTICLE_TEXT[base.group(1)]
        out.append(rd)
    return out

def entry(page, name=None, sub=None):
    v = raw[page]
    items = v['items']
    e = {'name': name or v['title']}
    if sub: e['sub'] = sub
    e['readings'] = build_set(items, 1)
    if any(i['track'] == 2 for i in items):
        e['track2'] = build_set(items, 2)
    return e

lect = {}
pages = {}   # key -> source page (for tests)
def add(key, page, **kw):
    if page not in raw:
        print('MISSING page', page); return
    lect[key] = entry(page, **kw); pages[key] = page

ORD = ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth']
for Y in 'ABC':
    for n in range(1, 5):
        add(f'{Y}.adv{n}', f'Year{Y}_RCL_Advent_{Y}Adv{n}_RCL', name=f'{ORD[n]} Sunday of Advent')
    for n in range(1, 9):
        nm = 'The Baptism of Our Lord · First Sunday after the Epiphany' if n == 1 else f'{ORD[n]} Sunday after the Epiphany'
        add(f'{Y}.epi{n}', f'Year{Y}_RCL_Epiphany_{Y}Epi{n}_RCL', name=nm)
    add(f'{Y}.epiLast', f'Year{Y}_RCL_Epiphany_{Y}EpiLast_RCL', name='Last Sunday after the Epiphany · Transfiguration Sunday')
    for n in range(1, 6):
        add(f'{Y}.lent{n}', f'Year{Y}_RCL_Lent_{Y}Lent{n}_RCL', name=f'{ORD[n]} Sunday in Lent')
    for n in range(2, 8):
        add(f'{Y}.easter{n}', f'Year{Y}_RCL_Easter_{Y}Easter{n}_RCL', name=f'{ORD[n]} Sunday of Easter')
    add(f'{Y}.easterDay', f'Year{Y}_RCL_Easter_{Y}EasterPrin_RCL', name='Easter Day')
    add(f'{Y}.ascension', f'Year{Y}_RCL_Easter_{Y}Ascension_RCL', name='Ascension Day')
    add(f'{Y}.pentecost', f'Year{Y}_RCL_Pentecost_{Y}PentDay_RCL', name='The Day of Pentecost')
    add(f'{Y}.trinity', f'Year{Y}_RCL_Pentecost_{Y}Trinity_RCL', name='Trinity Sunday')
    for n in range(1, 30):
        page = next((p for p in raw if re.fullmatch(f'Year{Y}_RCL_Pentecost_{Y}[Pp]rop{n}_RCL', p)), None)
        if page:
            add(f'{Y}.prop{n}', page, name=f'Proper {n}' if n < 29 else 'Proper 29 · Christ the King', sub=raw[page]['title'])
        else: print('no page', Y, 'Proper', n)

# Palm Sunday — Liturgy of the Palms + Passion, hand-assembled from the parsed items
for Y, page in (('A', 'YearA_RCL_HolyWk_APalmSun_RCL'), ('B', 'YearB_RCL_HolyWeek_BPalmSun_RCL'), ('C', 'YearC_RCL_HolyDays_CPalmSun_RCL')):
    items = raw[page]['items']
    first_idx = next(n for n, i in enumerate(items) if i['role'] == 'first')
    second_idx = next(n for n, i in enumerate(items) if i['role'] == 'second')
    palms = [clean_ref(i['ref']) for n, i in enumerate(items) if i['role'] == 'gospel' and n < first_idx]
    passion = [clean_ref(i['ref']) for n, i in enumerate(items) if i['role'] == 'gospel' and n > second_idx]
    pal = [clean_ref(i['ref']) for n, i in enumerate(items) if i['role'] == 'psalm' and n > first_idx]
    first = clean_ref(items[first_idx]['ref'])
    second = clean_ref(items[second_idx]['ref'])
    rd = [{'id': 'palms', 'label': 'Liturgy of the Palms · Gospel', 'reference': palms[0]},
          {'id': 'first', 'label': 'First Reading', 'reference': first},
          {'id': 'psalm', 'label': 'The Psalm', 'reference': pal[0]},
          {'id': 'second', 'label': 'Second Reading', 'reference': second},
          {'id': 'gospel', 'label': 'The Passion Gospel', 'reference': passion[0]}]
    if len(palms) > 1: rd[0]['alternates'] = palms[1:]
    if len(passion) > 1: rd[-1]['alternates'] = passion[1:]
    lect[f'{Y}.palmSunday'] = {'name': 'Sunday of the Passion: Palm Sunday', 'readings': rd}; pages[f'{Y}.palmSunday'] = page

# Easter Vigil — vigil lessons + the Eucharist set
def vigil(Y):
    s = open(os.path.join(CACHE, 'pg', f'Year{Y}_RCL_Easter_{Y}EasVigil_RCL.html'), encoding='utf-8', errors='ignore').read()
    t = html.unescape(re.sub(r'<[^>]+>', '\n', s)); lines = [re.sub(r'\s+', ' ', l).strip() for l in t.split('\n')]; lines = [l for l in lines if l]
    i = lines.index('At The Liturgy of the Word'); j = lines.index('At The Eucharist')
    blob = ' '.join(lines[i + 2: j])
    blob = re.sub(r'\[[^\]]*\]', '', blob)                                  # drop [descriptions] and the BCP-variant note
    starts = [m.start() for m in re.finditer(r'(?:(?<=\s)|^)(?:\d )?(?:Genesis|Exodus|Isaiah|Baruch|Proverbs|Ezekiel|Zephaniah|Job|Jonah|Deuteronomy|Daniel) \d', blob)]
    lessons = []
    for a, b2 in zip(starts, starts[1:] + [len(blob)]):
        piece = blob[a:b2].strip()
        m2 = re.match(r'^(?:\d )?[A-Z][a-z]+ \d+:\d+[\d\-:,;\s]*[ab]?(?:-[\d:]+)?[ab]?', piece)
        piece = (m2.group(0) if m2 else piece).strip(' ,;')
        if piece: lessons.append(piece)
    return lessons, lines[j + 1: j + 4]
for Y in 'ABC':
    lessons, euch = vigil(Y)
    lessons = [clean_ref(x) for x in lessons]
    # Exodus 14 is always read; list it as the primary Vigil lesson, others as alternates
    prim = next((x for x in lessons if x.startswith('Exodus 14')), lessons[0])
    alts = [x for x in lessons if x != prim]
    epistle, psalm, gospel = [clean_ref(x) for x in euch]
    lect[f'{Y}.easterVigil'] = {'name': 'The Great Vigil of Easter', 'readings': [
        {'id': 'first', 'label': 'Vigil Lesson (Exodus always read)', 'reference': prim, 'alternates': alts},
        {'id': 'psalm', 'label': 'The Psalm', 'reference': psalm},
        {'id': 'second', 'label': 'Second Reading', 'reference': epistle},
        {'id': 'gospel', 'label': 'The Gospel', 'reference': gospel}]}
    pages[f'{Y}.easterVigil'] = f'Year{Y}_RCL_Easter_{Y}EasVigil_RCL'
    # Year-specific feasts
add_extra = [('allSaints', {'A': 'YearA_RCL_HolyDays_AAllSaints_RCL', 'B': 'YearB_RCL_HolyDays_AllSaints_B_RCL', 'C': 'YearC_RCL_HolyDays_AllSaintsC_RCL'}, "All Saints' Day"),
             ('thanksgiving', {'A': 'YearA_RCL_HolyDays_Thanks_A_RCL', 'B': 'YearB_RCL_HolyDays_Thanks_B_RCL', 'C': 'YearC_RCL_HolyDays_Thanks_C_RCL'}, 'Thanksgiving Day')]
for slug, byyear, nm in add_extra:
    for Y, page in byyear.items(): add(f'{Y}.{slug}', page, name=nm)

# Same every year (ABC)
ABC = {
 'christmas1': ('YearABC_Christmas_Christmas1', 'First Sunday after Christmas Day'),
 'christmas2': ('YearABC_Christmas_Christmas2', 'Second Sunday after Christmas Day'),
 'christmasDay1': ('YearABC_RCL_Christmas_ChrsDay1_RCL', 'Christmas Day I · The Nativity (Christmas Eve)'),
 'christmasDay2': ('YearABC_RCL_Christmas_ChrsDay2_RCL', 'Christmas Day II · The Nativity (Dawn)'),
 'christmasDay3': ('YearABC_RCL_Christmas_ChrsDay3_RCL', 'Christmas Day III · The Nativity (Day)'),
 'holyName': ('YearABC_RCL_Christmas_HolyName_RCL', 'The Holy Name of Our Lord Jesus Christ'),
 'epiphany': ('YearABC_RCL_Epiphany_Epiph_RCL', 'The Epiphany'),
 'ashWednesday': ('YearABC_Lent_AshWed', 'Ash Wednesday'),
 'holyMon': ('YearABC_RCL_HolyWk_HolyMon_RCL', 'Monday in Holy Week'),
 'holyTue': ('YearABC_RCL_HolyWk_HolyTue_RCL', 'Tuesday in Holy Week'),
 'holyWed': ('YearABC_RCL_HolyWk_HolyWed_RCL', 'Wednesday in Holy Week'),
 'maundyThursday': ('YearABC_RCL_HolyWk_MaundyTh_RCL', 'Maundy Thursday'),
 'goodFriday': ('YearABC_RCL_HolyWk_GoodFri_RCL', 'Good Friday'),
 'holySaturday': ('YearABC_RCL_HolyWk_HolySat_RCL', 'Holy Saturday'),
 'presentation': ('YearABC_RCL_HolyDays_Present_RCL', 'The Presentation of Our Lord'),
 'annunciation': ('YearABC_RCL_HolyDays_Annunc_RCL', 'The Annunciation'),
 'visitation': ('YearABC_RCL_HolyDays_Visit_RCL', 'The Visitation'),
 'holyCross': ('YearABC_RCL_HolyDays_HolyCros_RCL', 'Holy Cross Day'),
 'transfiguration': ('YearABC_HolyDays_Transfig', 'The Transfiguration'),
 'andrew': ('YearABC_HolyDays_Andrew', 'Saint Andrew the Apostle'),
 'barnabas': ('YearABC_HolyDays_Barnabas', 'Saint Barnabas the Apostle'),
 'bartholomew': ('YearABC_HolyDays_Barth', 'Saint Bartholomew the Apostle'),
 'confessionPeter': ('YearABC_HolyDays_ConfPetr', 'The Confession of Saint Peter the Apostle'),
 'conversionPaul': ('YearABC_HolyDays_ConvPaul', 'The Conversion of Saint Paul the Apostle'),
 'holyInnocents': ('YearABC_HolyDays_HolyInno', 'The Holy Innocents'),
 'independenceDay': ('YearABC_HolyDays_Indepen', 'Independence Day'),
 'james': ('YearABC_HolyDays_James', 'Saint James the Apostle'),
 'jamesJerusalem': ('YearABC_HolyDays_JamesJer', 'Saint James of Jerusalem'),
 'john': ('YearABC_HolyDays_John', 'Saint John, Apostle and Evangelist'),
 'joseph': ('YearABC_HolyDays_Joseph', 'Saint Joseph'),
 'luke': ('YearABC_HolyDays_Luke', 'Saint Luke the Evangelist'),
 'mark': ('YearABC_HolyDays_Mark', 'Saint Mark the Evangelist'),
 'maryMagdalene': ('YearABC_HolyDays_MaryMag', 'Saint Mary Magdalene'),
 'maryVirgin': ('YearABC_HolyDays_MaryVirg', 'Saint Mary the Virgin'),
 'matthew': ('YearABC_HolyDays_Matthew', 'Saint Matthew, Apostle and Evangelist'),
 'matthias': ('YearABC_HolyDays_Matthias', 'Saint Matthias the Apostle'),
 'michael': ('YearABC_HolyDays_Michael', 'Saint Michael and All Angels'),
 'nativityJohnBaptist': ('YearABC_HolyDays_NatJohn', 'The Nativity of Saint John the Baptist'),
 'peterPaul': ('YearABC_HolyDays_PetPaul', 'Saint Peter and Saint Paul, Apostles'),
 'philipJames': ('YearABC_HolyDays_PhilJames', 'Saint Philip and Saint James, Apostles'),
 'simonJude': ('YearABC_HolyDays_SimnJude', 'Saint Simon and Saint Jude, Apostles'),
 'stephen': ('YearABC_HolyDays_Stephen', 'Saint Stephen, Deacon and Martyr'),
 'thomas': ('YearABC_HolyDays_Thomas', 'Saint Thomas the Apostle'),
}
for slug, (page, nm) in ABC.items(): add(f'ABC.{slug}', page, name=nm)

# Dups seen in oracle: older non-RCL Year pages are intentionally ignored.
json.dump({'lectionary': lect, 'pages': pages}, open('built.json', 'w'), indent=1)

# ── write JS module ──────────────────────────────────────────────────────────
js = ['// GENERATED by scripts/episcopal/build.py — do not edit by hand.',
      '// Episcopal / Anglican (RCL as adapted for the Episcopal Church) lesson REFERENCES only.',
      '// Source for the citations: The Lectionary Page (lectionarypage.net). Scripture text is fetched',
      '// separately in WEB (World English Bible, public domain) — see src/lib/bibleApi.js.',
      '// readings = Track 1 (or the only set); track2 = Track 2 where the Season after Pentecost offers one.',
      '', 'export const EPISCOPAL_LECTIONARY = ' + json.dumps(lect, indent=1, ensure_ascii=False) + '\n']
open(OUT, 'w').write('\n'.join(js))
print('entries:', len(lect), '→', os.path.relpath(OUT))
