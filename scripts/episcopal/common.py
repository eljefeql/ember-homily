"""Shared helpers for the Episcopal data builders: citation cleanup, alternates, BCP-psalm text mapping."""
import json, os, re

def load_vanderbilt(cache):
    global VSET, VPSALMS
    VAND = json.load(open(os.path.join(cache, 'vand.json')))
    VSET = {_norm(x) for x in VAND}
    VPSALMS = {}
    for x in VAND:
        m = re.match(r'^Psalm (\d+)(?::\s*(.*))?$', x.strip())
        if m: VPSALMS.setdefault(int(m.group(1)), []).append(x.strip().replace(': ', ':'))

# ── reference cleanup ────────────────────────────────────────────────────────
def clean_ref(r):
    r = r.replace('–', '-').replace('—', '-').replace(' ', ' ')
    r = re.sub(r'\s+', ' ', r).strip()
    r = re.sub(r'\s*-\s*', '-', r)
    r = re.sub(r'^(Psalm \d+),\s*(\d)', r'\1:\2', r)           # "Psalm 105, 1-6" typo
    r = re.sub(r'(\d):\s+(?=[\d(\[])', r'\1:', r)             # "6: 9-22" -> "6:9-22"
    r = r.replace('Wisdom of Solomon', 'Wisdom').replace('Sirach (Ecclesiasticus)', 'Sirach').replace('Ecclesiasticus', 'Sirach')
    r = re.sub(r'-{2,}', '-', r)                               # "4:16--5:9"
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
    spec = re.sub(r'[()\[\]]', '', spec)
    out = set()
    for part in re.split(r'[,;]', spec):
        m = re.match(r'^\s*(\d+)(?:\s*-\s*(\d+))?', part)
        if m: out.update(range(int(m.group(1)), int(m.group(2) or m.group(1)) + 1))
    return out
def _norm(r):
    r = r.replace('Wisdom of Solomon', 'Wisdom').replace('\u2013', '-')
    return re.sub(r'(?<=\d)[a-c](?=[,;\-]|$)', '', re.sub(r'[\s()\[\]]', '', r)).lower()
def psalm_text_ref(ref):
    m = re.match(r'^Psalm (\d+)(?::(.*))?$', ref)
    if not m or _norm(ref) in VSET: return None
    n = int(m.group(1)); want = _verses(m.group(2) or '')
    best, score = None, 0
    for cand in VPSALMS.get(n, []):
        cm = re.match(r'^Psalm \d+(?::(.*))?$', cand)
        have = _verses(cm.group(1) or '')
        if not want or not have: continue
        # A contiguous BCP range only maps to a contiguous Bible range (don't graft on extra verses)
        if max(want) - min(want) + 1 == len(want) and max(have) - min(have) + 1 != len(have): continue
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

