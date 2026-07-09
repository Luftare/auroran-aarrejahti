# 01 — Overview

## Vision

A small, warm, local game that makes the daily walk feel like a treasure hunt. Aurora — the game's unseen spirit — hides treasure chests around Järvenperä every night. In the morning, players find them scattered across the neighbourhood: by the pond, at the edge of the forest path, near the old bus stop. Walking to a chest and popping it open gives a small dopamine hit; the streak counter and leaderboard give a reason to come back tomorrow.

## Goals

1. **Encourage a daily outdoor walk.** The core loop must be completable on foot in under an hour, every day, in all seasons.
2. **Vary the routes.** Because chests spawn at different points each day, players are steered toward streets and paths they would not normally take.
3. **Light social pressure, not competition anxiety.** The leaderboard shows who has opened the most chests overall. Since looting is per-player, nobody can "steal" your chests — everyone can loot everything, so the leaderboard measures consistency, not speed.
4. **Zero-friction start.** The game is playable immediately without signing up (ghost account). Registration is a later, optional commitment.
5. **High-quality Finnish.** All player-facing text is written in careful, idiomatic Finnish. No anglicisms, no Finnish–English mixing. (See the copy glossary in [03-ui-ux.md](03-ui-ux.md).)

## Non-goals (MVP)

- No native app store distribution — PWA only.
- No item drops, trading, crafting, or shops beyond streak restore.
- No friend lists, chat, or direct messaging.
- No support for areas other than Järvenperä (though nothing in the design hard-codes the area; spawn points are data, not code).
- No anti-cheat beyond basic server-side distance validation. The audience is ~20 known local players; GPS spoofing is out of scope.
- No landscape layout — the app asks the player to rotate to portrait.

## Audience and scale

- Roughly **20 players**, all local to Järvenperä (Espoo, Finland), playing on their own mobile phones.
- Mixed ages and technical skill; the UI must be understandable without a tutorial.
- Traffic is tiny: tens of sessions per day, a few hundred API requests per day. All capacity planning in [09-deployment.md](09-deployment.md) assumes this scale.

## Core loop

1. Open the app (home screen icon → PWA).
2. See the circular map with today's remaining chests and your own position.
3. The action area shows the distance to the nearest chest: *"Lähin aarre on 200 metrin päässä — kävele lähemmäs!"*
4. Walk. When within **15 m** of a chest, the map area switches to the chest view.
5. Tap the chest once per coin inside it (3–10 taps). Each tap shakes a coin out. When the last coin drops, the chest opens, the coins land in your pouch, and the loot counts toward the leaderboard and today's streak.
6. Repeat for other chests, or come back tomorrow.
