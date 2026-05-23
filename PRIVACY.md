# Blake Boys Gaming — Privacy Policy

**Last updated:** 2026-05-23
**Operator:** Unrated Investments dba Unrated Games
**Contact:** acblake14@gmail.com

Blake Boys Gaming (BBG) is a small collection of educational games for kids, run by a parent for his kids. This page describes exactly what the apps do with information.

## TL;DR (the truthful version)

- **We collect nothing that leaves your device.** Today, zero analytics, zero ad tracking, zero accounts on a server. Everything a player does stays in their browser's local storage.
- **No ads.** Period.
- **No third-party trackers.** We do not embed Google Analytics, Facebook Pixel, Hotjar, Mixpanel, or anything similar.
- **No login required.** Profiles are stored locally; they are not synced anywhere.

## What information the apps store on your device

When a child plays one of the BBG games, the app saves the following to **browser localStorage on the device only**:

| Data | Why | Example |
|---|---|---|
| A nickname you typed in | To greet the player and label progress | `"Oliver"` |
| An opaque profile ID | To tie progress to one player across games | random string, no real-world meaning |
| Game progress | So levels, coins, creatures, trophies persist | XP, unlocked items, mastery scores |
| Settings preferences | So music/SFX toggles, difficulty stick | `{ music: true, sfx: true }` |
| Diagnostic console events | Visible only if you open your browser's dev console | event logs prefixed `[bbg.ev]` |

This data **never leaves the device**. Clearing browser data on the device erases it. Switching browsers erases it. We have no copy.

## What information the apps send over the network

The apps need a network connection to load assets and, for some games, to read text aloud. The network requests we make:

| Request | What it does | What is sent |
|---|---|---|
| Loading the app | Downloads HTML/CSS/JS/images from `bbgaming.shutterbuzzent.com` | Standard browser request headers (IP, user agent). Logged briefly by our CDN (Cloudflare). |
| Cloud TTS (text-to-speech) | Generates audio for prompts in some games | The text to speak (e.g. `"Find the letter A"`). No names, no profile IDs, no user-typed text. |
| Version check | Polls `/version.json` to detect a new release | Nothing other than the standard request. |

We do **not** send player names, profile IDs, game scores, or any progress data over the network.

## Cookies and similar tech

- We do **not** set any tracking cookies.
- We use `localStorage` and a Service Worker cache for offline play. Both can be cleared via your browser's site-data controls.
- A Cloudflare-managed cookie may be set briefly for DDoS protection. It does not identify the player.

## Children

BBG is built for children, by their parent. We have no accounts, no login, no chat, no comments, no user-generated content, no social features, no friend lists, no leaderboards visible to anyone outside the device. Nothing the child does is observable to other players or to us.

Because the apps collect no personally identifying information and transmit nothing identifying about a child, they are designed to comply with COPPA's safe-harbor framing for educational software. If you believe we have made a mistake, contact `acblake14@gmail.com` and we will fix it immediately.

## Permissions

The apps may request the following browser permissions. They are **optional** and the apps work without them:

- **Audio output** (always) — to play music, SFX, and voice prompts.
- **Service Worker / Offline cache** (automatic) — so games work without internet after first load.
- **Install as PWA** (you click "Add to Home Screen") — so the icon goes on the device home screen.

We do **not** request microphone, camera, geolocation, contacts, or device sensors. The Permissions-Policy HTTP header on our site explicitly forbids those.

## Future analytics (when/if we add them)

If we ever add usage analytics to understand what kids enjoy, the implementation will:

- Use a privacy-friendly platform (e.g. Plausible) that does **not** profile individuals.
- Be opt-in via the Parent Dashboard.
- Send only the event taxonomy documented in `ANALYTICS-EVENTS.md`, never PII or typed text.
- Be disclosed here before going live.

## Data retention / deletion

We hold no server-side data about players. To delete everything on your device:

1. Open the device browser.
2. Visit `bbgaming.shutterbuzzent.com`.
3. Open site settings → Clear data / Reset.
4. Uninstall any PWA installs from the home screen.

## Changes

If this policy materially changes, we will update the "Last updated" date and post a banner on the homepage for at least 14 days.

## Contact

acblake14@gmail.com
