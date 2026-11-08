# RIFTBOUND

**Version 0.1.0 — First Contact**

A 2D browser exploration game about a research outpost fractured between two realities.

## Play

The game is built with Phaser 3 and Vite and is deployed to GitHub Pages.

- Move: WASD / Arrow keys (mobile: on-screen D-pad)
- Switch reality: Space (mobile: RIFT)
- Interact / collect: E (mobile: E)
- Save: Save button in the game HUD
- Escape: Return to menu

## Version 0.1

- Playable single-player prototype
- Two reality states with phase-specific obstacles
- Three energy fragments hidden in the Rift reality
- Extraction gate and win condition
- Local browser save
- Responsive mobile touch controls
- Supabase project connection scaffold and isolated player-save table (cloud saves require account flow, planned for 0.2)

## Development

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Backend

Supabase project: `eopvkwhcgznvubesaszv` (KDS-AI-v1 / KDS AI).

The browser uses only the project's publishable key. Never add a Supabase secret or service-role key to frontend code.

Player save data is prepared in `public.riftbound_player_saves`. Row Level Security restricts each save to its owner. Version 0.1 stores progress locally; cloud save synchronization will be added with the account flow.

## Deployment

GitHub Actions builds the Vite app and deploys `dist/` to GitHub Pages on every push to `main`.
