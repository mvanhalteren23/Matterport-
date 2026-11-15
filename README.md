# 1346 Russell Road renovation model

An interactive 3D model of the house at 1346 Russell Road, for planning renovations and understanding the space.

- **Views:** dollhouse (orbit), plan (top-down) and walk inside.
- **Edit by clicking:** floors (flooring, paint), walls (add doors and windows, remove), openings (type, size, position; drag along the wall) and fixtures (move, rotate, resize, remove).
- **Edit by prompt:** describe a change in the box at the bottom. When the page is opened as a Claude artifact, Claude plans the change and edits the model, so requests like a bathroom remodel or kitchen redesign work. Opened as a plain web page, a small built-in interpreter handles simple requests (flooring, paint, adding doors and windows, removing a wall between two rooms).
- **Undo, redo, change log** and a reset to the as-built layout. Changes are saved in the browser.

## Running it

Open `index.html` in a browser. It needs an internet connection to load three.js from a CDN.

## Layout

| File | What it holds |
| --- | --- |
| `src/house.js` | The as-built model: walls, openings, rooms and fixtures, in feet |
| `src/app.js` | Renderer, editor, change operations and prompt handling |
| `src/style.css`, `src/body.html` | Page styling and markup |
| `build.mjs` | Bundles `src/` into `index.html` (`node build.mjs`) |

## Accuracy

The layout is traced from the listing floor plan, so dimensions are approximate. Ceilings are drawn flat at 8 ft (the living room is vaulted in reality), existing finishes are placeholders, and the workshop's position on the lot is a guess. The plan does not show which walls are load-bearing; confirm with a builder or engineer before removing any.
