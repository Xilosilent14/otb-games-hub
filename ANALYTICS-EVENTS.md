# BBG Analytics Event Taxonomy

Canonical schema for `[bbg.ev]` and `[bbg.err]` console events emitted by every game in the Blake Boys Gaming ecosystem. Today these are local-only (no network egress). When Plausible (or another analytics service) is wired in, this doc becomes the wire contract.

Status: **local-only**. All events stay in the browser console. Zero PII leaves the device.

## Why a taxonomy

Six games + the Hub all emit events. Without a shared schema, dashboards would be a mess of typos (`game_start` vs `gameStart` vs `start_game`). This doc locks the shape so any future analytics adapter can ingest events from every game with one parser.

## Conventions

- All event and property names use **snake_case**, lowercase.
- Timestamps in **milliseconds since epoch** (`Date.now()`).
- No PII. No player names, no email, no IP, no precise device IDs.
- `profile_id` is an opaque local-only UUID minted by `ecosystem.js`. Safe to send.
- Booleans are real booleans, not `"yes"`/`"no"`.
- Counts are integers. Durations are integers in milliseconds unless suffixed `_s` (seconds).

## Envelopes

### Event envelope (`[bbg.ev]`)
```js
{
  t: 1716000000000,        // ms since epoch
  game: "thinkfast",       // one of: hub | thinkfast | wordmine | rhythmblast | creaturecards | spidey | potionlab
  name: "answer.correct",  // dotted, snake_case (see catalog below)
  profile_id: "abc123",    // opaque per-device id from ecosystem.js
  session_id: "xyz789",    // resets each page load
  // ...event-specific props (snake_case)
}
```

### Error envelope (`[bbg.err]`)
```js
{
  t: 1716000000000,
  game: "wordmine",
  source: "window.onerror" | "promise.unhandled" | "manual",
  message: "Cannot read property 'foo' of undefined",
  stack: "at fn (/wordmine/js/main.js:42:10)...",  // first 1000 chars max
  lineno: 42,
  colno: 10,
  url: "/wordmine/js/main.js",
  user_agent_hint: "silk" | "chrome" | "firefox" | "safari" | "other"
}
```

## Standard event catalog

### Session lifecycle
| Event | Props | When |
|---|---|---|
| `session.start` | `entry_path`, `is_first_ever` (bool), `is_first_today` (bool) | Page load |
| `session.end` | `duration_ms`, `screens_viewed` (int) | `pagehide` / `beforeunload` |
| `session.background` | — | `visibilitychange` → hidden |
| `session.foreground` | `away_ms` | `visibilitychange` → visible |

### Navigation
| Event | Props | When |
|---|---|---|
| `nav.screen` | `from`, `to` | Major screen change inside a game |
| `nav.hub` | `from_game` | User taps BBG logo to go to Hub |
| `nav.game.open` | `game` | Hub launches a game tile |

### Game lifecycle
| Event | Props | When |
|---|---|---|
| `game.start` | `mode`, `topic`, `difficulty` (1–5) | Player starts a round / level |
| `game.pause` | `duration_so_far_ms` | Pause overlay opened |
| `game.resume` | `paused_ms` | Pause overlay closed |
| `game.end` | `mode`, `duration_ms`, `outcome` ("win"\|"lose"\|"quit"), `score`, `accuracy_pct` | Round finishes |
| `round.start` | `round_index`, `topic` | New round inside a session |
| `round.end` | `round_index`, `correct`, `wrong`, `accuracy_pct`, `duration_ms` | Round finishes |

### Answer / learning signals
| Event | Props | When |
|---|---|---|
| `answer.correct` | `topic`, `item_id`, `latency_ms`, `streak` | Right answer |
| `answer.wrong` | `topic`, `item_id`, `latency_ms`, `attempt_n` | Wrong answer |
| `hint.used` | `topic`, `item_id`, `hint_level` | Player taps a hint / Sally hint, etc |
| `mastery.earned` | `topic`, `level` (1–5), `items_total` | Topic level-up via Leitner / EWMA |
| `level.up` | `topic`, `from`, `to` | Difficulty bumped |

### Economy
| Event | Props | When |
|---|---|---|
| `coin.earned` | `amount`, `source` ("round"\|"streak"\|"daily"\|"trophy"\|"quest") | Coins awarded |
| `coin.spent` | `amount`, `item_id`, `category` ("pack"\|"shop"\|"upgrade") | Coins debited |
| `pack.opened` | `pack_id`, `rarity_dist` ({common,rare,epic,legendary}) | Card pack opened (Creature Cards) |
| `shop.purchase` | `item_id`, `price`, `category` | Shop purchase |
| `trophy.earned` | `trophy_id`, `tier` ("bronze"\|"silver"\|"gold") | Trophy unlocked |
| `streak.milestone` | `days`, `kind` ("daily"\|"weekly") | Streak threshold hit |

### Creature Cards specific
| Event | Props | When |
|---|---|---|
| `creature.captured` | `creature_id`, `type` | New creature added to deck |
| `creature.evolved` | `creature_id`, `from_form`, `to_form` | Evolution |
| `battle.start` | `zone_id`, `deck_power` | Battle starts |
| `battle.end` | `zone_id`, `outcome`, `turns`, `duration_ms` | Battle ends |

### Rhythm Blast specific
| Event | Props | When |
|---|---|---|
| `song.start` | `song_id`, `difficulty` | Song picked |
| `song.end` | `song_id`, `score`, `combo_max`, `perfect`, `good`, `miss`, `outcome` | Song finishes |
| `note.miss` | `song_id`, `note_t_ms` | Missed note (debug only, throttle 1/sec) |

### Potion Lab / Spidey specific
| Event | Props | When |
|---|---|---|
| `potion.completed` | `potion_id`, `room_id` | Potion finished |
| `room.unlocked` | `room_id` | New room available |
| `sticker.earned` | `sticker_id`, `book_id` | Sticker book entry |

### Profile / ecosystem
| Event | Props | When |
|---|---|---|
| `profile.created` | `profile_count` | New profile |
| `profile.switched` | `from_id`, `to_id` | Profile changed |
| `settings.changed` | `key`, `value` (sanitized) | Settings toggle |

### Audio
| Event | Props | When |
|---|---|---|
| `audio.muted` | `muted` (bool), `track` ("sfx"\|"music"\|"voice") | Mute toggle |
| `tts.play` | `cache_hit` (bool), `voice_id`, `text_len` | Voice line played |
| `tts.error` | `code`, `message` | TTS failure |

## Privacy guardrails

- **Never log free-text the user typed.** If a typed answer matters, log `item_id` + correctness, not the raw text.
- **Never log file paths from the user's machine.** Error stack traces are server-relative or `/path/to/file.js`-style only.
- **Profile IDs are opaque.** They cannot be reversed to a name or device.
- **No analytics network calls today.** All `[bbg.ev]` writes are `console.log` only. When we wire Plausible, traffic is opt-in via Parent Dashboard.

## Validation helper (suggested)

When games dispatch events, they should funnel through a single `bbg.ev(name, props)` helper that:
1. Stamps `t`, `game`, `profile_id`, `session_id`.
2. Asserts `name` is in the catalog above (dev mode only; production logs and continues).
3. Calls `console.log('[bbg.ev]', envelope)`.

Same pattern for `bbg.err(payload)`.

## Versioning

This taxonomy is **v1**. Additive changes (new events, new props) do not bump the version. Removals or renames bump to v2 and the schema_version prop ships on every envelope from that point.
