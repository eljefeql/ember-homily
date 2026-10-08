"""Parse Lectionary Page HTML (downloaded by fetch.sh) into reading-reference JSON.
References only — no scripture text is stored from that source."""
import re, glob, html, json, os, sys
SRC = sys.argv[1]
def txt(x): return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',x))).strip()
ROLE = [('second reading','second'),('second lesson','second'),('old testament','first'),('canticle','canticle'),('response','psalm'),('psalm','psalm'),
        ('epistle','second'),('new testament','second'),('gospel','gospel'),('lesson','first'),('reading','first')]
def role_of(h):
    h=h.lower()
    for k,r in ROLE:
        if k in h: return r
    return None
res={}
for f in sorted(glob.glob(os.path.join(SRC,'*.html'))):
    s=open(f,encoding='utf-8',errors='ignore').read()
    key=os.path.basename(f)[:-5]
    title=re.search(r'<h1[^>]*>(.*?)</h1>',s,re.S)
    more=re.search(r'<h4 class="moreInfo">(.*?)</h4>',s,re.S)
    items=[]; head=None
    for m in re.finditer(r'<h2 class="lessonHeading"([^>]*)>(.*?)</h2>|<h3 class="lessonCitation"([^>]*)>(.*?)</h3>',s,re.S):
        if m.group(2) is not None:
            idm=re.search(r'id="([^"]+)"',m.group(1)); head=(txt(m.group(2)), idm.group(1) if idm else None)
        elif head and head[0].lower()!='the collect':
            cid=re.search(r'id="([^"]+)"',m.group(3) or '')
            items.append({'role':role_of(head[0]),'heading':head[0],'id':(head[1] or (cid.group(1) if cid else None) or '').lower(),'ref':txt(m.group(4))})
    ids={i['id'] for i in items}
    twotrack = bool(ids & {'ot2','ps2'}) and bool(re.search(r'Pentecost_[ABC][Pp]rop', key))   # Tracks exist only for the Propers
    for i in items:
        i['track'] = (2 if i['id'] in ('ot2','ps2') else 1 if i['id'] in ('ot1','ps1') else 0) if twotrack else 0
    res[key]={'title':txt(title.group(1)) if title else None,
              'info':txt(re.sub(r'<br\s*/?>',' | ',more.group(1))) if more else None,
              'items':items}
json.dump(res,open(sys.argv[2] if len(sys.argv) > 2 else 'parsed_raw.json','w'),indent=1)
bad=[k for k,v in res.items() if not v['items']]
print(len(res),'pages; no readings parsed:',bad)
