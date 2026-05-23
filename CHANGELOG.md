# Changelog

All notable changes to BBG Hub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to incrementing service-worker cache versions on each release.

## [SW v21] — 2026-05-23

### Added
- Hub dashboard panel: greeting, level bar, "Play Next" recommendation, recent mastery list
- Variable-reward bonuses on daily challenge completion
- Pet now returns surprise coin drops after time away
- Ecosystem write paths: `lastPlayed`, `recentMastery`, `addGameXP` so the dashboard can react to per-game activity
- Structured error boundary and analytics hook for crash and event tracking

### Changed
- Profile-scoped storage for pet, shop, trophies, challenges, progress map, and report card
- Full ARIA pass on dashboard tiles and navigation
- Install-prompt logic extracted from inline `<script>` into `js/install-prompt.js` (SES / CSP hardening)
- `offline.html` retry handler extracted into `js/offline.js` (SES / CSP hardening)

### Fixed
- Cross-profile data leak where switching profiles inherited the previous profile's pet, coins, and trophies
