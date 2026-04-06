# OTB Games Hub

## What It Does
Launcher/portal for the OTB Games product line. Shows Oliver's games, recent achievements, learning progress, and cross-game stats. Links to each game.

## Tech Stack
- Vanilla HTML/CSS/JS (no frameworks, no build step)
- PWA with manifest.json
- Reads from `otb_shared_profile` localStorage (shared via ecosystem.js)
- Reads game-specific save data from each game's localStorage keys

## Dev Server
- Port: 8082
- Command: `npx serve -l 8082 -s .`

## Key Files
- `index.html` - Single page hub
- `css/hub.css` - Hub-specific styles
- `css/shared/design-system.css` - OTB shared design system
- `js/hub.js` - Hub controller (loads profile, achievements)
- `js/ecosystem.js` - Shared cross-game profile library

## Game URLs (Development)
- ThinkFast: http://localhost:8080
- Word Mine: http://localhost:8081
- Hub: http://localhost:8082

## DO NOT Change
- Port 8082
- Shared design system CSS (edit source in D:\Claude\OTB-Games-Shared\ and copy)
