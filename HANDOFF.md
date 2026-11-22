# Handoff: Know Your Energy (read this first, 3 minutes)

Updated 22 Nov 2026. The owner's time is the cost. Be fast, do exactly what is said, show ONE picture, and when told "push", push to `main` that minute.

## 1. What is live (on `main`; a push deploys the site and the Worker in about 40 seconds)
- **Login:** phone unlock (passkey). No email anywhere. One free reading per phone. Visitors who unlocked before the switch unlock once.
- **Padlock (important, owner's reason):** the form is locked until the phone is unlocked, and every field shows a padlock. A visitor gets ONE free reading; nobody should type into fields they cannot use ("I am not in favor of wasting people's time"). Keep the padlock on every field.
- **Private pages**, on `https://know-your-energy.kwdoanchor.workers.dev`: `/owner` (enter the key once; the device is remembered forever; "Open the site" unlocks that device with unlimited use) and `/usage` (costs, people, visits). One key for the owner and both daughters, once per device. No Cloudflare login. The key exists only as a hash in `worker.js` (`OWNER_KEY_HASH`); the key itself is NOT in the repo. To sign every device out: new hash + raise `OWNER_KEY_EPOCH`. The old public `/usage`, `/admin/users` and `admin.html` are gone.
- **Privacy and Terms** match phone unlock: no email, nothing offered for deletion (the only record kept is whether a phone's free reading was used / a pass is active). There is no "Forget my details".
- **Front page:** original look; two short bullets; button "Unlock & begin"; link "Already unlocked on this phone?"; headline "First reading is" over a big Didone FREE!.
- **The form screens:** Jost for all text; labels 22px; text typed in the boxes 16px (the least an iPhone allows without zooming; do not make it bigger, the labels must stay the larger text); "Date of Birth" spelled out; the "Choose either individual or relational" heading removed (the toggle says it); "Person 1" / "Person 2" in the cursive; fields are lit wells (translucent wine-rose, never black, grey or white, no outline box).

## 2. The owner's rules (do not make them repeat these)
- Nothing may get smaller than it is. Never thin, faded, grey-looking or darker/smeared text. Pure white at full strength; contrast is the rule.
- No black fields. No locked features, ever. No email.
- LEAVE ALONE unless told: the silver buttons (including "Parent · Child" with its dot), Person 1 / Person 2 (cursive), the wordmark, FREE!, the solar system's position.
- Do not widen a request. Do not offer option sets. Show one picture. Do not re-measure what was measured. Say what rule you are applying so the owner can correct it.
- "Classy, elegant, sleek, powerful, bold" is the brief for the look. Typography alone cannot reach it; it needs real lit surfaces (see Open items).

## 3. Open items (none of these is live)
- Classy first-screen layout (centred Didone headline, silver diamond bullets) was shown; the owner did not approve it as a whole.
- Fields: the owner wants something "opposite of average": real lighting (SVG lighting filter, light from the sun's direction), a lit state on tap, a frosted-glass locked state. Not built.
- Solar system: owner says it does not look like silver, looks broken, and is not worth ~530 KB of load. Not changed.
- Not touched: the "Please wait" screen, the results page, the expanded cards.
- Old unlimited-family email hashes still sit unused in `worker.js`. A test device (unlimited) was created during a live test; rotating the key signs it out. The key was shown in chat once; rotate it if the chat leaks.
- Privacy wording is not legal advice; the "we do not erase it" position may need a legal check. Cloudflare keeps request logs; Privacy does not mention them.

## 4. Technical landmarks (saves an hour)
- Files: `index.html` (markup + inline CSS), `red-look.css` (the front-page look; changes are appended at the end; bump `?v=` on its link in `index.html` after every change), `worker.js` (server), `FEEDBACK-LOG.md` (rules; see the guide below).
- **The inline CSS is inside `@layer base`: a layered `!important` rule beats an unlayered `!important` rule.** If a size or colour in `red-look.css` does not apply, look for an inline `!important` rule (this cost an hour once).
- Verify on the real page with a headless browser (computed styles at 320, 360 and 390 px), not by eye. The test scripts were in a scratch folder and are not saved.
- Claude Code's Auto mode sometimes blocks commits and pushes; a plain "yes" from the owner lets them through.

## 5. What is worth reading, and what is a waste of time
- **Read:** this file. `FEEDBACK-LOG.md`: "RULE 1" and "Owner's standing instructions" at the top, and the last entries (the "STATE OF THE SITE" ones).
- **Skip:** the long middle of `FEEDBACK-LOG.md` (Oct 17 to 25) about the results page: fan layout, timeline, colour placements. It is a history of dead ends; read it only if you work on the results page. Skip `DESIGN-CONCEPTS.md`, `HANDOFF-NOT-LIVE.md` (older), the 100+ old branches on GitHub, and `vendor/`, `hdri/`, `data/`.
- **Mistakes not to repeat:** reading an instruction too literally; building options nobody asked for; showing a comparison made from a stale copy; stating a measurement you have not taken.

## 6. Keeping private files off the public site (do this EVERY time)
- **How it works:** the website (GitHub Pages) publishes every file in the repo unless `_config.yml` lists it under `exclude:`. Hidden now: `FEEDBACK-LOG.md`, `HANDOFF.md`, `HANDOFF-NOT-LIVE.md`, `DESIGN-CONCEPTS.md`, `README.md`, `worker.js`, `wrangler.toml`, `package.json`, `package-lock.json`, `build-cities.mjs`.
- **Any NEW file** that is notes, a test, a script, or holds costs, keys, names or business numbers: add its filename to `exclude:` in `_config.yml` in the same commit. After the push (about 40 seconds) CLAUDE runs the check itself and reports the result: the owner never types addresses and never searches the thread for them. Run this, which checks every file on the hide list (404 or a 503 error page is fine; 200 means it is still public):
  `grep '^  - ' _config.yml | sed 's/^  - //' | while read f; do printf "%s -> " "$f"; curl -s -o /dev/null -w "%{http_code}\n" "https://know-your-energy.com/$f"; done`
  Then confirm the site itself still loads: `/`, `/privacy.html`, `/red-look.css` (and any file the page needs) must answer 200.
- **Never write into any repo file:** per-reading costs, token counts, keys, passwords, the owner key, or the owner's personal data. Costs live only on the private `/usage` page.
- **The GitHub project itself is PUBLIC.** Hiding a file from the website does NOT hide it on github.com, and old versions (history and about 144 branches) still hold older text, including the old cost figures and, per `DESIGN-CONCEPTS.md`, the owner's own birth details on the `design-concepts` branch. Cleaning that is destructive. The owner was offered "wipe it" (back everything up to one file first, delete the old branches, rewrite history) and has NOT said yes. Ask before doing it; some old branches hold unmerged work listed in `HANDOFF-NOT-LIVE.md`.
- `worker.js` must stay in the repo for the Worker to deploy, so its daily free-reading cap and the key's hash are visible on github.com while the repo is public. Making the repo private would probably take the GitHub-hosted pages down (it likely needs a paid plan; unchecked). Do not do it without a plan.

## 7. What this thread completed, and how long it took (22 Nov 2026, times in UTC)
**Time:** the first work file was made at 08:01 and the last commit was at 11:18: about **3 hours 20 minutes of elapsed time**, plus a few minutes of reading before the first file. That is wall-clock time, including waiting on the owner, interruptions and permission blocks; active working time was not measured. The first change to the live site was at 09:58.

**Completed and live (on `main`):**
- 09:14 Phone unlock restored; the public "Family access" link removed.
- 09:29 to 09:31 Private `/owner` and `/usage` pages with the remembered-device key; the public cost and count leaks closed; the public `admin.html` removed. (25 server checks and a browser test passed.)
- 09:41 to 09:43 Privacy and Terms rewritten for phone unlock (no email, nothing offered for deletion); "Forget my details" removed.
- 09:58 Front page: the six long bullets replaced by two short ones; decisions recorded in `FEEDBACK-LOG.md`.
- 10:02 to 10:13 Headline: big Didone FREE! with an upright lead line; Person 1 / Person 2 in the cursive.
- 10:34 to 10:39 Jost text font in a size scale where nothing is smaller (fields were briefly 17px; corrected to 16px at 11:02).
- 11:02 to 11:11 Form: labels 22px, "Date of Birth" spelled out, the "Choose either..." heading removed, fields no longer black (lit wells), padlock kept on every field, "(optional)" labels 22px.
- 11:09 to 11:18 Notes, handoff and server code hidden from the public site; cost figures removed from the notes; this handoff file written.

**Shown as previews only, never shipped:** the classy centred layout with silver diamond bullets; tilted and silver FREE!; dark carved fields; about nine typeface and alignment options.

**Not done:** fields with real lighting; the solar system; the "Please wait" and results screens; wiping old versions and branches (waiting on the owner's "wipe it").

**Where the time went (qualitative, not measured):** most of it on the front-page look, about ten rounds of previews the owner rejected before the simple headline shipped; then on my own mistakes (too-literal readings, a stale comparison copy, unmeasured claims); then on permission blocks that held up saves.
