#!/bin/sh
# Download Lectionary Page calendars + lesson pages into a working dir (default ./_cache). Polite: 0.3s between requests.
# Usage: ./fetch.sh [dir]   — then: python3 parse.py <dir>/pg && python3 build.py <dir>
D=${1:-_cache}; mkdir -p "$D/pg" "$D/cal"
for y in 2013 2014 2015 2016 2017 2018 2019 2020 2021 2022 2023 2024 2025 2026 2027; do
  [ -s "$D/cal/$y.html" ] || { curl -sL "https://lectionarypage.net/CalndrsIndexes/Calendar$y.html" -o "$D/cal/$y.html"; sleep 0.3; }
done
cat "$D"/cal/2020.html "$D"/cal/202[1-7].html | grep -oE 'href="\.\./(Year[A-Za-z_]+|Various)/[^"#]+"' | sed -E 's#href="\.\./##; s#"$##' | grep -E "_RCL|YearABC/" | sort -u > "$D/pages.txt"
for Y in A B C; do
  for n in 1 2 3 4 5 6 7 8; do echo "Year${Y}_RCL/Epiphany/${Y}Epi${n}_RCL.html"; done
  for n in 1 2 3 4; do echo "Year${Y}_RCL/Pentecost/${Y}Prop${n}_RCL.html"; done
done >> "$D/pages.txt"
sort -u "$D/pages.txt" -o "$D/pages.txt"
while read p; do
  f="$D/pg/$(echo "$p" | tr '/' '_')"; f="${f%.html}.html"
  [ -s "$f" ] || { curl -sL "https://lectionarypage.net/$p" -o "$f"; sleep 0.3; }
done < "$D/pages.txt"
# Vanderbilt's RCL citation list (used to map BCP Psalter verse numbers to Bible verse numbers)
[ -s "$D/vand.json" ] || curl -sL "https://lectionary.library.vanderbilt.edu/texts/?y=18921&z=p&d=79" | python3 -c "
import sys,re,json
m=re.search(r'var OBJECT = (\{.*\});',sys.stdin.read())
json.dump(json.loads(m.group(1))['lections'],open('$D/vand.json','w'))"
# drop soft-404s (the site returns 200 with a "404 Error" page)
grep -l "<title>404 Error" "$D"/pg/*.html | xargs rm -f
ls "$D/pg" | wc -l
