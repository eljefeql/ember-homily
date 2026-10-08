"""Build date -> [lesson page keys] from the Lectionary Page yearly calendars (test oracle for the date logic)."""
import re, glob, json, os, sys
D = sys.argv[1]
MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
out = {}
for f in sorted(glob.glob(os.path.join(D, 'cal', '*.html'))):
    s = open(f, encoding='utf-8', errors='ignore').read()
    heads = [(m.start(), MONTHS.index(m.group(1)) + 1, int(m.group(2)))
             for m in re.finditer(r'(?:>|&nbsp;)\s*(' + '|'.join(MONTHS) + r')\s+(\d{4})\s*<', s)]
    for m in re.finditer(r'<td valign="TOP"[^>]*>(.*?)</td>', s, re.S):
        cell = m.group(1)
        dm = re.search(r'<font[^>]*>\s*(\d{1,2})\s*(?:<br>)?\s*</font>', cell)
        if not dm: continue
        pos = m.start()
        hs = [h for h in heads if h[0] < pos]
        if not hs: continue
        _, mo, yr = hs[-1]
        links = re.findall(r'href="\.\./([^"#]+)"', cell)
        keys = [re.sub(r'\.html$', '', l).replace('/', '_') for l in links]
        label = re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',cell[dm.end():])).strip()
        out[f'{yr}-{mo:02d}-{int(dm.group(1)):02d}'] = {'keys': keys, 'label': label}
json.dump(out, open('truth.json', 'w'), indent=0)
print(len(out), 'dates;', sum(1 for v in out.values() if v['keys']), 'with links')
