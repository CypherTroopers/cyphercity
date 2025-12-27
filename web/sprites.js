// web/sprites.js
//
// Goal:
// - Use a unified palette (SNES-ish / SimCity-like shading).
// - Buildings (House/Farm/Workshop/Park/Monument) are rendered as 2x2 tiles (4 tiles total) using a 32x32 sprite
//   split into 4 quadrants (each quadrant is 16x16).
// - Road stays 1 tile (16x16).
//
// IMPORTANT INTEGRATION NOTE (for your frontend):
// - To render true 2x2 buildings, the renderer must know the *world tile coordinate* (x,y) for each tile.
// - This file supports BOTH modes:
//   1) drawSpriteTile(ctx, px, py, tilePx, kind, level) -> legacy (no x/y). Buildings fall back to 1x1 (16x16).
//   2) drawSpriteTile(ctx, px, py, tilePx, kind, level, wx, wy) -> 2x2 mode when wx/wy are provided.
//
// In app.js, call with coordinates:
//   drawSpriteTile(ctx, px, py, tilePx, info.kind, info.level, worldX, worldY);
//
// WorldX/worldY are the absolute tile coordinates (0..255), e.g. worldX = view.x0 + dx, worldY = view.y0 + dy.

export const SPR = 16;         // single tile sprite resolution (16x16)
export const SPR_BUILD = 32;   // building sprite resolution (32x32 => 2x2 tiles)

// Unified palette (shared across all sprites)
const PAL = {
  ".": null,        // transparent
  "0": "#1B1B1B",   // outline / darkest

  // terrain
  "G": "#7FCB8A",   // grass
  "g": "#5EAF6B",   // dark grass
  "D": "#C9A26A",   // dirt
  "d": "#9B7B4C",   // dark dirt
  "P": "#E6DDBF",   // path (light)
  "p": "#C8B88F",   // path (dark)

  // stone / concrete
  "S": "#B9B9B9",   // stone
  "s": "#8F8F8F",   // dark stone
  "C": "#D7D7D7",   // concrete (light)
  "c": "#A9A9A9",   // concrete (dark)

  // building materials
  "W": "#E9E1D2",   // wall (light)
  "w": "#CFC4B2",   // wall (dark)
  "R": "#C15A52",   // roof (light)
  "r": "#8F3C37",   // roof (dark)
  "T": "#7A5A3A",   // wood (light)
  "t": "#5A422B",   // wood (dark)

  // glass / windows
  "B": "#6FB6FF",   // glass (light)
  "b": "#2D6FA7",   // glass (dark)
  "L": "#9ED7FF",   // glass highlight
  "l": "#3A88C7",   // glass shadow

  // accents / metal / gold
  "X": "#D9A441",   // accent (gold/metal light)
  "x": "#9D6F1E",   // accent (gold/metal dark)
  "M": "#7E8796",   // metal (light)
  "m": "#565E6B",   // metal (dark)

  // farm/crops
  "Y": "#E7D46D",   // wheat/crop (light)
  "y": "#C8AF3F",   // wheat/crop (dark)
  "F": "#9BCB5A",   // crop green (light)
  "f": "#6E9C3B",   // crop green (dark)

  // flowers / decoration
  "H": "#E77BB3",   // pink
  "h": "#B84D83",   // dark pink
};

// Caches
// - 16x16 canvases: cache16 (key => canvas)
// - 32x32 canvases: cache32 (key => canvas)
// - 16x16 quadrants: cacheQ (key => canvas)
const cache16 = new Map();
const cache32 = new Map();
const cacheQ = new Map();

export function clearSpriteCache() {
  cache16.clear();
  cache32.clear();
  cacheQ.clear();
}

// ---------- Grid helpers (for 16 or 32) ----------
function makeGrid(size, fill = ".") {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => fill));
}

function put(grid, x, y, ch) {
  const size = grid.length;
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  grid[y][x] = ch;
}

function hline(grid, x0, x1, y, ch) {
  for (let x = x0; x <= x1; x++) put(grid, x, y, ch);
}

function vline(grid, x, y0, y1, ch) {
  for (let y = y0; y <= y1; y++) put(grid, x, y, ch);
}

function rect(grid, x0, y0, w, h, ch) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) put(grid, x, y, ch);
}

function outlineBox(grid, x0, y0, w, h, ch = "0") {
  hline(grid, x0, x0 + w - 1, y0, ch);
  hline(grid, x0, x0 + w - 1, y0 + h - 1, ch);
  vline(grid, x0, y0, y0 + h - 1, ch);
  vline(grid, x0 + w - 1, y0, y0 + h - 1, ch);
}

function checker(grid, x0, y0, w, h, a, b) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      put(grid, x, y, ((x + y) & 1) ? a : b);
    }
  }
}

function toCanvas(grid) {
  const size = grid.length;
  const off = document.createElement("canvas");
  off.width = size;
  off.height = size;
  const c = off.getContext("2d");
  c.imageSmoothingEnabled = false;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const ch = grid[y][x];
      const col = PAL[ch] ?? null;
      if (!col) continue;
      c.fillStyle = col;
      c.fillRect(x, y, 1, 1);
    }
  }
  return off;
}

// ---------- 16x16 single-tile sprites (empty + road + fallback mini-icons) ----------
function grass16() {
  const g = makeGrid(SPR, "G");
  // slight noise for texture
  for (let y = 0; y < SPR; y++) {
    for (let x = 0; x < SPR; x++) {
      if (((x * 13 + y * 7) % 17) === 0) put(g, x, y, "g");
    }
  }
  return g;
}

function road16(level) {
  // Road stays 1 tile. Level can add marking/curb, but you can also ignore level.
  const g = makeGrid(SPR, "S");
  // cobble pattern
  for (let y = 0; y < SPR; y++) {
    for (let x = 0; x < SPR; x++) {
      if (((x + y) & 1) === 0) put(g, x, y, "s");
    }
  }

  const L = Math.max(0, Math.min(5, Number(level || 0)));

  // subtle upgrades (optional)
  if (L >= 2) {
    // curb line
    hline(g, 0, 15, 0, "0");
    hline(g, 0, 15, 15, "0");
  }
  if (L >= 3) {
    // dashed center mark
    for (let y = 1; y < 15; y += 2) put(g, 8, y, "X");
  }
  if (L >= 4) {
    // slightly brighter sidewalk edges
    vline(g, 0, 0, 15, "c");
    vline(g, 15, 0, 15, "c");
  }
  if (L >= 5) {
    // crosswalk hint
    for (let x = 2; x <= 13; x += 2) {
      put(g, x, 7, "W");
      put(g, x, 8, "W");
    }
  }

  return g;
}

function miniBuilding16(kind, level) {
  // Fallback when no (wx,wy) is provided (legacy callers).
  // Draw a small "icon" that still looks more realistic than a flat tile.
  const g = makeGrid(SPR, ".");
  rect(g, 0, 0, 16, 16, "P"); // light ground
  // small shadow
  rect(g, 1, 12, 14, 3, "p");

  const L = Math.max(1, Math.min(5, Number(level || 1)));

  if (kind === 1) {
    // small house icon
    outlineBox(g, 3, 6, 10, 7);
    rect(g, 4, 7, 8, 5, "W");
    rect(g, 6, 9, 2, 3, "t");
    rect(g, 9, 8, 2, 2, "B");
    // roof
    hline(g, 4, 11, 6, "0");
    rect(g, 5, 4, 6, 2, L >= 4 ? "R" : "r");
    rect(g, 4, 5, 8, 1, "R");
  } else if (kind === 2) {
    // small farm icon
    rect(g, 3, 7, 10, 6, "D");
    for (let x = 4; x <= 12; x += 2) rect(g, x, 8, 1, 4, L >= 3 ? "Y" : "F");
    // barn
    outlineBox(g, 2, 3, 6, 4);
    rect(g, 3, 4, 4, 2, "W");
    rect(g, 4, 5, 2, 2, "t");
    rect(g, 3, 2, 4, 1, "R");
  } else if (kind === 3) {
    // small workshop icon
    outlineBox(g, 3, 5, 10, 8);
    rect(g, 4, 6, 8, 6, "c");
    rect(g, 6, 8, 2, 4, "m");
    rect(g, 9, 7, 2, 2, "B");
    // chimney
    if (L >= 3) rect(g, 11, 2, 2, 5, "s");
  } else if (kind === 4) {
    // small park icon
    rect(g, 0, 0, 16, 16, "G");
    // tree
    rect(g, 6, 4, 4, 4, "g");
    rect(g, 5, 5, 6, 3, "G");
    rect(g, 7, 8, 2, 4, "t");
    // flowers
    if (L >= 3) { put(g, 4, 12, "H"); put(g, 11, 12, "H"); }
  } else if (kind === 6) {
    // small monument icon
    outlineBox(g, 6, 4, 4, 9);
    rect(g, 7, 5, 2, 7, "s");
    rect(g, 5, 13, 6, 2, "S");
    if (L >= 4) { put(g, 7, 4, "X"); put(g, 8, 4, "X"); }
  } else {
    // unknown
    rect(g, 4, 4, 8, 8, "0");
  }

  return g;
}

function sprite16Canvas(kind, level) {
  const key = `16:${kind}:${level}`;
  const hit = cache16.get(key);
  if (hit) return hit;

  let grid;
  if (kind === 0) grid = grass16();
  else if (kind === 5) grid = road16(level);
  else grid = miniBuilding16(kind, level);

  const cv = toCanvas(grid);
  cache16.set(key, cv);
  return cv;
}

// ---------- 32x32 building sprites (2x2 tiles) ----------
//
// SimCity-like idea: level increases add height, windows, materials, ornaments.
// We draw a single 32x32 sprite anchored at top-left of a 2x2 block.

function build32House(level) {
  // Levels:
  // 1: small cottage
  // 2: bigger house (more windows)
  // 3: mansion (balcony)
  // 4: apartment (3 floors)
  // 5: high-rise (glass)
  const L = Math.max(1, Math.min(5, Number(level || 1)));
  const g = makeGrid(SPR_BUILD, ".");

  // ground
  rect(g, 0, 0, 32, 32, "P");
  rect(g, 0, 24, 32, 8, "p");

  if (L <= 3) {
    // villa footprint
    outlineBox(g, 6, 12, 20, 14);
    rect(g, 7, 13, 18, 12, "W");

    // roof
    rect(g, 6, 9, 20, 4, "R");
    hline(g, 6, 25, 9, "0");
    hline(g, 6, 25, 12, "0");
    // roof shade
    rect(g, 6, 11, 20, 1, "r");

    // door
    outlineBox(g, 15, 18, 4, 8);
    rect(g, 16, 19, 2, 6, "t");

    // windows
    const win = (x, y) => { outlineBox(g, x, y, 4, 4); rect(g, x + 1, y + 1, 2, 2, "B"); };
    win(9, 16);
    win(21, 16);

    if (L >= 2) {
      win(9, 20);
      win(21, 20);
    }
    if (L >= 3) {
      // balcony + ornaments
      rect(g, 12, 14, 8, 2, "c");
      hline(g, 12, 19, 14, "0");
      // garden flowers
      put(g, 4, 26, "H"); put(g, 27, 26, "H");
      put(g, 5, 27, "H"); put(g, 26, 27, "H");
    }

    if (L >= 3) {
      // chimney
      outlineBox(g, 22, 6, 4, 6);
      rect(g, 23, 7, 2, 4, "s");
    }
  } else if (L === 4) {
    // apartment (3 floors)
    outlineBox(g, 7, 6, 18, 22);
    rect(g, 8, 7, 16, 20, "c");

    // roof equipment
    rect(g, 9, 5, 14, 2, "m");
    hline(g, 9, 22, 5, "0");

    // floors
    hline(g, 8, 23, 13, "0");
    hline(g, 8, 23, 20, "0");

    // windows grid
    for (let y = 9; y <= 22; y += 4) {
      for (let x = 10; x <= 20; x += 4) {
        outlineBox(g, x, y, 3, 3);
        rect(g, x + 1, y + 1, 1, 1, (y <= 13) ? "B" : "b");
      }
    }

    // entrance
    outlineBox(g, 14, 23, 4, 5);
    rect(g, 15, 24, 2, 3, "t");
    rect(g, 13, 27, 6, 1, "S");
  } else {
    // L === 5: high-rise glass tower
    outlineBox(g, 10, 3, 12, 26);
    rect(g, 11, 4, 10, 24, "M");

    // glass facade
    for (let y = 5; y < 27; y++) {
      for (let x = 12; x < 20; x++) {
        if (((x + y) % 3) === 0) put(g, x, y, "B");
        else if (((x * 7 + y) % 11) === 0) put(g, x, y, "L");
      }
    }

    // top ornament
    rect(g, 10, 2, 12, 2, "X");
    hline(g, 10, 21, 2, "0");

    // base plaza
    rect(g, 6, 27, 20, 3, "C");
    checker(g, 6, 27, 20, 3, "C", "c");

    // entrance
    outlineBox(g, 14, 24, 4, 5);
    rect(g, 15, 25, 2, 3, "l");
  }

  return g;
}

function build32Farm(level) {
  // Levels:
  // 1: small field + hut
  // 2: bigger field + farmhouse
  // 3: barn + fenced field
  // 4: industrial farm (silo + machinery)
  // 5: greenhouse / advanced agriculture
  const L = Math.max(1, Math.min(5, Number(level || 1)));
  const g = makeGrid(SPR_BUILD, ".");

  // grass
  rect(g, 0, 0, 32, 32, "G");
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (((x * 9 + y * 5) % 19) === 0) put(g, x, y, "g");

  // field area
  rect(g, 3, 10, 26, 18, "D");
  for (let y = 12; y <= 26; y += 2) {
    for (let x = 5; x <= 27; x += 2) {
      put(g, x, y, (L >= 3) ? "Y" : "F");
    }
  }
  // furrows
  for (let y = 11; y <= 27; y += 3) hline(g, 3, 28, y, "d");

  // farmhouse/barn zone
  if (L === 1) {
    outlineBox(g, 5, 4, 8, 6);
    rect(g, 6, 5, 6, 4, "W");
    rect(g, 6, 3, 6, 2, "R");
    rect(g, 8, 7, 2, 3, "t");
  } else if (L === 2) {
    outlineBox(g, 4, 3, 10, 8);
    rect(g, 5, 4, 8, 6, "W");
    rect(g, 4, 2, 10, 2, "R");
    // windows
    outlineBox(g, 6, 6, 3, 3);
    rect(g, 7, 7, 1, 1, "B");
    outlineBox(g, 10, 6, 3, 3);
    rect(g, 11, 7, 1, 1, "B");
    // door
    outlineBox(g, 8, 8, 3, 4);
    rect(g, 9, 9, 1, 2, "t");
  } else {
    // barn
    outlineBox(g, 3, 3, 12, 10);
    rect(g, 4, 4, 10, 8, "w");
    rect(g, 3, 2, 12, 2, "R");
    rect(g, 6, 6, 2, 6, "t"); // big door
    rect(g, 10, 6, 2, 6, "t");

    // fence (L>=3)
    outlineBox(g, 2, 9, 28, 21, "T");

    if (L >= 4) {
      // silo + machinery
      outlineBox(g, 18, 2, 7, 14);
      rect(g, 19, 3, 5, 12, "s");
      rect(g, 20, 4, 3, 10, "S");
      rect(g, 25, 12, 5, 4, "m");
      rect(g, 26, 11, 3, 2, "M");
    }
    if (L >= 5) {
      // greenhouse strips
      outlineBox(g, 6, 14, 20, 12, "0");
      rect(g, 7, 15, 18, 10, "L");
      // glass shading
      for (let y = 15; y < 25; y++) for (let x = 7; x < 25; x++) if (((x + y) % 5) === 0) put(g, x, y, "b");
      // white frame
      vline(g, 13, 15, 24, "W");
      vline(g, 19, 15, 24, "W");
      hline(g, 7, 24, 19, "W");
    }
  }

  return g;
}

function build32Workshop(level) {
  // Levels:
  // 1: small workshop
  // 2: expanded workshop + vents
  // 3: factory + smokestack
  // 4: large factory + crane + pipes
  // 5: high-tech plant (glass + metal)
  const L = Math.max(1, Math.min(5, Number(level || 1)));
  const g = makeGrid(SPR_BUILD, ".");

  // ground concrete
  rect(g, 0, 0, 32, 32, "C");
  checker(g, 0, 0, 32, 32, "C", "c");

  if (L <= 2) {
    // workshop shed
    outlineBox(g, 6, 10, 20, 16);
    rect(g, 7, 11, 18, 14, "c");

    // roof
    rect(g, 6, 7, 20, 4, "m");
    rect(g, 6, 10, 20, 1, "0");
    rect(g, 6, 9, 20, 1, "M");

    // door
    outlineBox(g, 14, 16, 6, 10);
    rect(g, 15, 17, 4, 8, "t");

    // windows
    for (let x = 9; x <= 22; x += 5) {
      outlineBox(g, x, 13, 3, 3);
      rect(g, x + 1, 14, 1, 1, "B");
    }

    if (L >= 2) {
      // vents
      rect(g, 8, 6, 4, 2, "S");
      rect(g, 20, 6, 4, 2, "S");
      // side crates
      rect(g, 3, 22, 3, 3, "T");
      rect(g, 26, 22, 3, 3, "T");
    }
  } else if (L === 3 || L === 4) {
    // factory main block
    outlineBox(g, 5, 8, 22, 20);
    rect(g, 6, 9, 20, 18, "m");

    // roof machinery
    rect(g, 7, 6, 18, 3, "M");
    hline(g, 7, 24, 6, "0");

    // window rows
    for (let y = 12; y <= 22; y += 4) {
      for (let x = 8; x <= 22; x += 4) {
        outlineBox(g, x, y, 3, 3);
        rect(g, x + 1, y + 1, 1, 1, "B");
      }
    }

    // loading bay
    outlineBox(g, 12, 22, 8, 6);
    rect(g, 13, 23, 6, 4, "c");

    // smokestack
    outlineBox(g, 25, 2, 6, 16);
    rect(g, 26, 3, 4, 14, "s");
    rect(g, 26, 2, 4, 1, "0");

    if (L >= 4) {
      // crane arm
      rect(g, 2, 5, 10, 2, "X");
      rect(g, 11, 4, 2, 6, "X");
      // pipes
      rect(g, 1, 26, 12, 2, "S");
      rect(g, 13, 25, 2, 3, "S");
    }
  } else {
    // L === 5: high-tech plant
    outlineBox(g, 6, 6, 20, 22);
    rect(g, 7, 7, 18, 20, "M");

    // glass panels
    rect(g, 9, 9, 14, 12, "L");
    for (let y = 9; y < 21; y++) for (let x = 9; x < 23; x++) if (((x + y) % 4) === 0) put(g, x, y, "b");

    // metal frame
    outlineBox(g, 9, 9, 14, 12, "0");
    vline(g, 16, 9, 20, "0");
    hline(g, 9, 22, 15, "0");

    // entrance
    outlineBox(g, 14, 22, 4, 6);
    rect(g, 15, 23, 2, 4, "l");

    // antenna / logo
    rect(g, 24, 3, 2, 8, "X");
    rect(g, 23, 2, 4, 2, "X");
  }

  return g;
}

function build32Park(level) {
  // Levels:
  // 1: small green with tree
  // 2: nicer park with path
  // 3: fountain
  // 4: plaza + flowers
  // 5: large garden (symmetric)
  const L = Math.max(1, Math.min(5, Number(level || 1)));
  const g = makeGrid(SPR_BUILD, "G");

  // texture
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (((x * 11 + y * 3) % 23) === 0) put(g, x, y, "g");

  // base path shape
  if (L >= 2) {
    rect(g, 12, 0, 8, 32, "P");
    rect(g, 0, 14, 32, 4, "P");
    // shade
    rect(g, 12, 0, 1, 32, "p");
    rect(g, 20, 0, 1, 32, "p");
    rect(g, 0, 14, 32, 1, "p");
    rect(g, 0, 17, 32, 1, "p");
  }

  // central feature
  if (L <= 2) {
    // big tree
    rect(g, 13, 8, 6, 6, "g");
    rect(g, 11, 10, 10, 6, "G");
    rect(g, 14, 16, 4, 10, "t");
  } else if (L === 3) {
    // fountain
    outlineBox(g, 9, 9, 14, 14);
    rect(g, 10, 10, 12, 12, "C");
    rect(g, 12, 12, 8, 8, "B");
    put(g, 16, 10, "L"); put(g, 16, 11, "L"); // water sparkle
  } else if (L === 4) {
    // plaza + fountain + benches
    outlineBox(g, 8, 8, 16, 16);
    rect(g, 9, 9, 14, 14, "C");
    rect(g, 12, 12, 8, 8, "B");
    rect(g, 10, 23, 4, 2, "T");
    rect(g, 18, 23, 4, 2, "T");
    // flowers
    for (let x = 6; x <= 26; x += 4) { put(g, x, 6, "H"); put(g, x, 26, "H"); }
  } else {
    // L === 5: symmetric garden
    outlineBox(g, 6, 6, 20, 20);
    rect(g, 7, 7, 18, 18, "P");
    rect(g, 8, 8, 16, 16, "p");
    // inner lawn
    rect(g, 10, 10, 12, 12, "G");
    // small fountain
    outlineBox(g, 13, 13, 6, 6);
    rect(g, 14, 14, 4, 4, "B");
    // flower corners
    put(g, 8, 8, "H"); put(g, 23, 8, "H"); put(g, 8, 23, "H"); put(g, 23, 23, "H");
  }

  return g;
}

function build32Monument(level) {
  // Levels:
  // 1: small statue
  // 2: larger statue + base
  // 3: obelisk + gold band
  // 4: grand monument + stairs
  // 5: palace-like monument
  const L = Math.max(1, Math.min(5, Number(level || 1)));
  const g = makeGrid(SPR_BUILD, ".");

  // plaza
  rect(g, 0, 0, 32, 32, "C");
  checker(g, 0, 0, 32, 32, "C", "c");

  if (L === 1) {
    outlineBox(g, 14, 10, 4, 12);
    rect(g, 15, 11, 2, 10, "s");
    rect(g, 12, 22, 8, 3, "S");
  } else if (L === 2) {
    outlineBox(g, 13, 8, 6, 16);
    rect(g, 14, 9, 4, 14, "s");
    outlineBox(g, 10, 24, 12, 4);
    rect(g, 11, 25, 10, 2, "S");
  } else if (L === 3) {
    // obelisk
    outlineBox(g, 14, 5, 4, 20);
    rect(g, 15, 6, 2, 18, "s");
    // gold band
    rect(g, 14, 12, 4, 2, "X");
    // base
    outlineBox(g, 10, 25, 12, 4);
    rect(g, 11, 26, 10, 2, "S");
  } else if (L === 4) {
    // grand monument
    outlineBox(g, 12, 6, 8, 20);
    rect(g, 13, 7, 6, 18, "S");
    rect(g, 12, 11, 8, 2, "X");
    // stairs
    for (let i = 0; i < 4; i++) rect(g, 8 + i, 26 + i, 16 - i * 2, 1, "s");
  } else {
    // L === 5: palace-like monument
    outlineBox(g, 8, 8, 16, 18);
    rect(g, 9, 9, 14, 16, "W");
    // columns
    for (let x = 10; x <= 22; x += 3) {
      rect(g, x, 10, 1, 14, "w");
      rect(g, x, 10, 1, 1, "0");
      rect(g, x, 23, 1, 1, "0");
    }
    // roof + gold trim
    rect(g, 8, 6, 16, 3, "R");
    rect(g, 8, 6, 16, 1, "0");
    rect(g, 8, 8, 16, 1, "X");
    // door
    outlineBox(g, 15, 18, 2, 8);
    rect(g, 15, 19, 2, 6, "t");
    // stairs
    for (let i = 0; i < 4; i++) rect(g, 10 + i, 26 + i, 12 - i * 2, 1, "s");
  }

  return g;
}

function sprite32Canvas(kind, level) {
  const key = `32:${kind}:${level}`;
  const hit = cache32.get(key);
  if (hit) return hit;

  let grid;
  switch (kind) {
    case 1: grid = build32House(level); break;
    case 2: grid = build32Farm(level); break;
    case 3: grid = build32Workshop(level); break;
    case 4: grid = build32Park(level); break;
    case 6: grid = build32Monument(level); break;
    default:
      // For road/empty/unknown we don't use 32x32
      grid = makeGrid(SPR_BUILD, ".");
      break;
  }

  const cv = toCanvas(grid);
  cache32.set(key, cv);
  return cv;
}

function quadrantCanvas(kind, level, qx, qy) {
  // qx,qy are 0 or 1 (which tile inside the 2x2 building block)
  const key = `q:${kind}:${level}:${qx}:${qy}`;
  const hit = cacheQ.get(key);
  if (hit) return hit;

  const big = sprite32Canvas(kind, level);
  const off = document.createElement("canvas");
  off.width = SPR;
  off.height = SPR;

  const c = off.getContext("2d");
  c.imageSmoothingEnabled = false;

  // Copy quadrant (16x16) from the 32x32 sprite:
  // - qx=0,qy=0 => top-left
  // - qx=1,qy=0 => top-right
  // - qx=0,qy=1 => bottom-left
  // - qx=1,qy=1 => bottom-right
  c.drawImage(big, qx * SPR, qy * SPR, SPR, SPR, 0, 0, SPR, SPR);

  cacheQ.set(key, off);
  return off;
}

// ---------- Drawing entrypoint ----------
//
// drawSpriteTile(ctx, px, py, tilePx, kind, level, wx?, wy?)
// - If kind is road(5) or empty(0): always 1-tile sprite
// - If wx/wy are provided and kind is a building: render as 2x2 using (wx,wy) parity
//   Anchor = (wx & ~1, wy & ~1)
//   Quadrant = (wx - anchorX, wy - anchorY) => 0/1
//
// Note: This uses a simple rule to group tiles into 2x2 blocks: based on coordinate parity.
// That means the 2x2 footprint visually aligns to even coordinates.
// To enforce "must occupy 4 tiles" in gameplay, you still need contract-side logic.
// This file focuses on rendering only.

export function drawSpriteTile(ctx, px, py, tilePx, kind, level, wx = null, wy = null) {
  // Background: lighter for empty, slightly warm for built tiles (matches SNES-ish look)
  ctx.fillStyle = (kind === 0) ? "#EAF6EA" : "#F4F1EA";
  ctx.fillRect(px, py, tilePx, tilePx);

  // Road and Empty always 1 tile (16x16)
  if (kind === 0 || kind === 5) {
    const spr = sprite16Canvas(kind, level);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(spr, px, py, tilePx, tilePx);

    // grid line
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, tilePx - 1, tilePx - 1);
    return;
  }

  // Buildings:
  // If no world coords are given, fall back to a single-tile mini icon (still nicer than a flat color)
  if (!Number.isFinite(wx) || !Number.isFinite(wy)) {
    const spr = sprite16Canvas(kind, level);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(spr, px, py, tilePx, tilePx);

    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, tilePx - 1, tilePx - 1);
    return;
  }

  // True 2x2 rendering
  const ax = (wx & ~1);
  const ay = (wy & ~1);
  const qx = wx - ax; // 0 or 1
  const qy = wy - ay; // 0 or 1

  const quad = quadrantCanvas(kind, level, qx, qy);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(quad, px, py, tilePx, tilePx);

  // grid line (very light)
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, tilePx - 1, tilePx - 1);

  // Optional: emphasize 2x2 building border subtly (only at outer edges)
  // This helps the player see the 4-tile footprint.
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = 1;

  // outer border only when the tile lies on the building outer edge
  if (qx === 0) {
    ctx.beginPath();
    ctx.moveTo(px + 0.5, py + 0.5);
    ctx.lineTo(px + 0.5, py + tilePx - 0.5);
    ctx.stroke();
  }
  if (qx === 1) {
    ctx.beginPath();
    ctx.moveTo(px + tilePx - 0.5, py + 0.5);
    ctx.lineTo(px + tilePx - 0.5, py + tilePx - 0.5);
    ctx.stroke();
  }
  if (qy === 0) {
    ctx.beginPath();
    ctx.moveTo(px + 0.5, py + 0.5);
    ctx.lineTo(px + tilePx - 0.5, py + 0.5);
    ctx.stroke();
  }
  if (qy === 1) {
    ctx.beginPath();
    ctx.moveTo(px + 0.5, py + tilePx - 0.5);
    ctx.lineTo(px + tilePx - 0.5, py + tilePx - 0.5);
    ctx.stroke();
  }

  ctx.restore();
}
