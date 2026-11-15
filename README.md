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

The as-built model in `src/house.js` is measured from the Matterport scan of the house (model `rfwtuskak8Q`, data from the `1346russelreno` repository):

- Wall positions come from the scan's wall graph and mesh, squared up (the scan is rotated 0.48° from the house axes). The house measures about 58.5 ft east to west.
- Ceilings are 8 ft, except the living room and office, which share a vaulted ceiling rising to 13 ft at an east–west ridge.
- The office floor is a 7 in step-up behind a low wall; the carport is about 1.9 ft below the house floor.
- Window sizes and sill heights come from the scan where it detected them, including the clerestory windows in the west gable.
- Finishes (wood panelling, parquet, carpet, kitchen counters, brick fireplace and oven column) match the scan's photos.

Door positions and the kitchen and bathroom fixture layout follow the listing floor plan, rescaled to the scan. The workshop's position on the lot is not in the scan and is a guess. The plan does not show which walls are load-bearing; confirm with a builder or engineer before removing any.
