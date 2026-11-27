# Handoff for the next thread (written Nov 27, 2026)

Paste this into the new thread as the first message. It was written from one long session. I did not read or change `HANDOFF.md`.

## The owner's rules (in their words, shortened)
- Be clear and short. No code talk, no step-by-step numbers. Say what you are doing and the goal.
- **Direct instruction that does not change the look: do it and put it live. No asking.**
- **Direct instruction that changes the look: build it, show it, owner approves, then live.**
- **Your own idea: say it, then wait.** Never build or push things the owner did not ask for.
- If something is unclear, ask. If something does not make sense or is not in the owner's interest, say so.
- When the owner comments, stop and read it first.
- Show the whole phone screen, never pieces. Not flat drawings. Not a quick doodle.
- Nothing may go live if any part is lower quality than what is live now. The goal is much better.
- Do not use a technique you have not mastered without permission. Read the directions first (`tools/README.md`). Maximum 2 tries, then report.
- The privacy page and terms must always match what is true.
- Nothing about readings should be saved on the server unless it has to be. Readings live in the person's browser.
- Do not add summary or highlight sentences to the AI prompt. Do not shorten or remove reading content. The owner does not want the same section headings for everyone.

## What is live (all on `main`)
1. A free reading that fails no longer uses up the day's free total.
2. Privacy page lists everything the server keeps and for how long. The 14-day saved day reading is gone. Copies saved before Nov 27 expire by Dec 11.
3. Every reading, full and day, is saved in the browser. "New Reading" (the button, formerly "Run Another Reading") files the old one instead of deleting it.
4. "Your readings" list at the top of the open reading card: 12px, no lines, three rows tall and scrolls, no cap, Delete with a confirm, opens a past reading as a whole page. Full readings only. Day readings are in their own list at the top of the Timeline (day reading) card, same style.

## Also live
5. The reading card's name is bold and centered with no "Reading" after it.
6. The button that starts another reading says "New Reading".
7. The pass day-reading limits were removed from the code (the owner never approved them). Pass holders have no cap on day readings. The privacy page matches.
8. The owner key's scrambled fingerprint is no longer in the code. It now has to be set as a Cloudflare secret (`OWNER_KEY_HASH`, and optionally `OWNER_KEY_EPOCH`) instead of sitting in the public repo. The owner's own actual key was never in the repo at any point -- only that fingerprint was, and that's what moved out.

## Not live, and the owner is leaving the frames as they are now
- Bigger bold headings and a new frame were mock-ups only, and the owner told me to delete them. The owner rejected the thin ornament frames (looked like shelving, then clip art).
- Reading layout: version B (numbers, boxes) is rejected for good. Version A is undecided. The owner does not want a bold first sentence.

## Frame direction the owner wants (if it is picked up again)
- Two metals twisting around each other, a very loose twist, solid and thick, "liquid metal", not wire, not rope, no gemstones, not toy-like. Color with depth, not flat, not only black and white.
- One family: the frame is shared by every opened card (Numerology, Astrology, Human Design, Reading, Timeline).
- A fixed frame that fits the phone screen with the reading scrolling inside it. Light, softly lit surface.
- The render script was deleted at the owner's request. Three renders failed on quality: the tube method makes wire and cannot make liquid metal. Options if it comes up again: research a sculpted-surface technique first, or have a 3D artist make it.

## Open items (nothing approved)
- The owner key (a private password for unlimited use and the `/owner` and `/usage` pages): its fingerprint is out of the public repo now (see item 8 above), but the OLD fingerprint still sits in this repo's git history forever, since removing it from the current file doesn't erase old commits. Until someone with Cloudflare access sets the `OWNER_KEY_HASH` secret, no new device can unlock with the key -- but the owner's own already-remembered device(s) are unaffected and need no action. The owner wants to keep using their current phone with zero changes, which this already allows. If the owner ever wants to add a new device that way, or wants the exposure in git history to stop mattering, the real fix is to pick a brand new, longer key (not reuse the old one), compute its hash, and set it as the Cloudflare secret, bumping `OWNER_KEY_EPOCH` too if old devices should be signed out. Do not put the plaintext key or its hash in any file in this repo again.
- Check what Cloudflare's logs hold, such as connection addresses, and make the privacy page say so.
- Someone can get a second free reading by cancelling the "find existing unlock" prompt and accepting "create". The owner declined lowering the per-connection limit. No recovery code (owner declined). No payment processor yet.
- Known bugs not fixed: on the live reading card the headings are tiny and the title runs off the frame. The Timeline day reading still says "Enter the email address of your pass". iPhone zooms into any typing field under 16px, unchecked on the site's form.
