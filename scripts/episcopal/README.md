# Episcopal lectionary data pipeline

Generates `src/data/episcopalLectionary.js` (lesson **citations** only — scripture text is fetched at runtime in the
public-domain World English Bible by `src/lib/webScripture.js`).

Sources
- Citations: The Lectionary Page — RCL as adapted for the Episcopal Church (lectionarypage.net).
- Cross-check: Vanderbilt Divinity Library RCL (lectionary.library.vanderbilt.edu). Also used to map BCP Psalter verse
  numbers to Bible verse numbers when fetching psalm text.

Regenerate (only needed when the lectionary changes — e.g. a new General Convention revision):

```sh
cd scripts/episcopal
./fetch.sh _cache            # polite download of calendars + lesson pages
python3 parse.py _cache/pg   # -> parsed_raw.json
python3 build.py _cache      # -> built.json + src/data/episcopalLectionary.js
python3 parse.py _cache/lffpg _cache/lff_raw.json   # Lesser Feasts pages
python3 build_extra.py _cache   # -> src/data/episcopalLesserFeasts.js + episcopalSpecial.js (marriage/burial)
python3 truth.py _cache      # -> truth.json (calendar oracle)
```

Tests (from repo root)

```sh
node scripts/episcopal/verify-calendar.mjs 2017 2027   # date logic vs. published calendars
node scripts/episcopal/test-refs.mjs --network         # every citation parses and returns WEB text
node scripts/episcopal/probe.mjs 2026-10-11 [track]     # what the app resolves for a date
node scripts/episcopal/show.mjs "Psalm 23"              # WEB text for a citation
```

`verify-calendar` reports ~33 intentional differences from the Lectionary Page calendars: Christmas Eve lessons,
All Saints offered on the following Sunday, and the Sunday's own lessons offered when a Feast of Our Lord (Holy Name,
Presentation, Transfiguration) displaces it.

Lesser Feasts dates come from the Lectionary Page's by-date index (the published calendars don't link them), so they have no
independent date oracle. Not yet indexed: weekday lessons (Daily Office / Eucharist), other special services.
