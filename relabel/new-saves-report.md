# New saves sweep — 2026-10-23

Additions prepared in `relabel/new-saves.json` (not merged, not deployed).

## Counts

- **Current total saves on the account:** Instagram claims **2,455** (was 2,441 at the Oct 21 build). The global saved-posts feed returned **1,527** posts before Instagram ended pagination on its own — the same claimed-vs-returned gap seen at build time (deleted/private/unavailable posts drop out). The per-collection fetches below are the authoritative source, same as the build.
- **Library before this sweep:** 1,456 videos, of which 248 came from his saved collections.
- **Soccer-collection membership re-fetched:** 20 collections (15 from the build + 5 new), 266 membership posts returned; **252 already in the library**.
- **NEW to the library: 14 unique videos** (15 membership instances — one video sits in both new "Midfielder drills" collections).

## Where the 14 new videos came from

New saves filed into existing collections (10):

| Collection | New |
|---|---|
| Finishing | 3 |
| Attacking drills | 3 |
| Dribbling | 2 |
| Warmups/tech | 1 |
| Passing | 1 |

## New collections he made since the Oct 21 build

5 collection IDs, 3 distinct names (he created duplicates of two names — easy to do in Instagram's UI):

| Collection | Posts | New to library |
|---|---|---|
| Midfielder drills (2398726367619680) | 1 | 1 |
| Midfielder drills (1989861288321568) | 1 | 1 — the same video as the one above |
| Technique drills (29080750751518631) | 2 | 2 |
| Defending drills (29139203969037909) | 0 | 0 (empty) |
| Defending drills (1521275056464325) | 1 | 1 |

Unique new videos from the new collections: **4**. No build-time collection has disappeared.

## Categorization of the 14

Named from title/caption evidence only; categories follow the video's content (same convention as the build — his collection filing doesn't dictate the category; e.g. a back-four session filed under "Finishing" is categorized as Getting into shapes).

- Categorized (7): Passing patterns ×2, Passing patterns to finish ×2, Finishing ×1, Warm up games ×1, Getting into shapes ×1
- Unsorted (7): the dribbling / 1v1 / receiving technique clips — none of the 15 categories honestly fits them, so per his standing rule they stay Unsorted rather than getting a forced label.
- All 14 got a plain-English name; none had to be left "unclear". The two @coach_ikhlef saves have hashtag-only captions, so their names/categories come from Instagram's stored video descriptions (aerial tactical patterns ending in a striker finish → Passing patterns to finish).

## Fetch notes

- **No HTTP 429 was hit.** One early stop was a false alarm in my own checker (the string "429" inside a collection ID), verified and re-run cleanly: all 44 collections and all 20 soccer-collection memberships fetched complete.
- One "new" item (@prolific.soccer partner passing/dribbling circuit, in his Passing collection) is a 2021 post — most likely an older save the build's fetch missed (Instagram returned only 251 of ~263 claimed saves then), not a fresh save. It's a collection member missing from the library, so it's included. Its original caption couldn't be retrieved, so its `title` is empty; name/category come from Instagram's stored video description.
- Scope note: saves that aren't filed in any collection were **not** added (the library has always been built from his collections). One recent uncollectioned save is a soccer training post (@kumw_soccer "INSIDE TRAINING") in case he wants it filed and added later.
