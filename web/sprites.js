// web/sprites.js
export const SPR = 16;

// Unified palette (shared across all sprites)
const PAL = {
  ".": null,        // transparent
  "0": "#1B1B1B",   // outline
  "G": "#7FCB8A",   // grass
  "g": "#5EAF6B",   // dark grass
  "D": "#C9A26A",   // dirt
  "d": "#9B7B4C",   // dark dirt
  "S": "#B9B9B9",   // stone
  "s": "#8F8F8F",   // dark stone
  "W": "#E9E1D2",   // wall
  "w": "#CFC4B2",   // dark wall
  "R": "#C15A52",   // roof
  "r": "#8F3C37",   // dark roof
  "B": "#6FB6FF",   // window
  "b": "#2D6FA7",   // dark window
  "T": "#7A5A3A",   // wood
  "t": "#5A422B",   // dark wood
  "Y": "#E7D46D",   // wheat
  "y": "#C8AF3F",   // dark wheat
  "X": "#D9A441",   // accent (metal/trim)
  "x": "#9D6F1E",   // dark accent
};

// 2x2 building sprite size (in pixels)
const BIG = 32;

// cache keys:
// - "road:level" -> 16x16 canvas
// - "big:kind:level" -> 32x32 canvas
const cache = new Map();

function makeGridN(size, lines) {
  const g = Array.from({ length: size }, (_, y) => {
    const row = (lines[y] || "").padEnd(size, ".").slice(0, size);
    return row.split("");
  });
  return g;
}

function toLines(grid) {
  return grid.map((r) => r.join(""));
}

function put(grid, x, y, ch) {
  const h = grid.length;
  const w = grid[0]?.length || 0;
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  grid[y][x] = ch;
}

function rect(grid, x0, y0, w, h, ch) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) put(grid, x, y, ch);
}

function outlineBox(grid, x0, y0, w, h) {
  for (let x = x0; x < x0 + w; x++) {
    put(grid, x, y0, "0");
    put(grid, x, y0 + h - 1, "0");
  }
  for (let y = y0; y < y0 + h; y++) {
    put(grid, x0, y, "0");
    put(grid, x0 + w - 1, y, "0");
  }
}

function drawToCanvas(lines, size) {
  const off = document.createElement("canvas");
  off.width = size;
  off.height = size;
  const c = off.getContext("2d");
  c.imageSmoothingEnabled = false;

  for (let y = 0; y < size; y++) {
    const row = lines[y] || "";
    for (let x = 0; x < size; x++) {
      const ch = row[x] || ".";
      const col = PAL[ch] ?? null;
      if (!col) continue;
      c.fillStyle = col;
      c.fillRect(x, y, 1, 1);
    }
  }
  return off;
}

/**
 * 16x16 road sprite (stays 1 tile)
 */
function baseRoadSprite() {
  return [
    "SSsSSsSSsSSsSSsS",
    "sSSsSSsSSsSSsSSs",
    "SSsSSsSSsSSsSSsS",
    "sSSsSSsSSsSSsSSs",
    "SSsSSsSSsSSsSSsS",
    "sSSsSSsSSsSSsSSs",
    "SSsSSsSSsSSsSSsS",
    "sSSsSSsSSsSSsSSs",
    "SSsSSsSSsSSsSSsS",
    "sSSsSSsSSsSSsSSs",
    "SSsSSsSSsSSsSSsS",
    "sSSsSSsSSsSSsSSs",
    "SSsSSsSSsSSsSSsS",
    "sSSsSSsSSsSSsSSs",
    "SSsSSsSSsSSsSSsS",
    "sSSsSSsSSsSSsSSs",
  ];
}

function applyRoadLevel(level, grid) {
  const L = Math.max(0, Math.min(5, Number(level || 0)));
  if (L >= 2) for (let y = 0; y < SPR; y++) put(grid, 7, y, "s");
  if (L >= 3) for (let y = 0; y < SPR; y += 2) put(grid, 8, y, "X");
  if (L >= 4) for (let x = 0; x < SPR; x++) { put(grid, x, 0, "0"); put(grid, x, 15, "0"); }
  if (L >= 5) for (let x = 2; x <= 13; x += 2) { put(grid, x, 7, "W"); put(grid, x, 8, "W"); }
}

function roadCanvas(level) {
  const k = `road:${level}`;
  const hit = cache.get(k);
  if (hit) return hit;

  const grid = makeGridN(SPR, baseRoadSprite());
  applyRoadLevel(level, grid);
  const cv = drawToCanvas(toLines(grid), SPR);
  cache.set(k, cv);
  return cv;
}

/**
 * 32x32 base sprites for 2x2 buildings (SimCity-like growth)
 * kind: 1 house, 2 farm, 3 workshop, 4 park, 6 monument
 */
function baseBigSprite(kind) {
  switch (kind) {
    case 1: // Residential base (Level 1 will be a small shack within the 2x2 lot)
      return [
        "GGgGGGGgGGGGgGGGGGgGGGGgGGGGgGGG",
        "gGGGGgGGGGgGGGGggGGGGgGGGGgGGGGg",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGgGGGGgGGGGgGGGGGgGGGGgGGGGgGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "gGGGGgGGGGgGGGGggGGGGgGGGGgGGGGg",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGgGGGGgGGGGgGGGGGgGGGGgGGGGgGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "gGGGGgGGGGgGGGGggGGGGgGGGGgGGGGg",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGgGGGGgGGGGgGGGGGgGGGGgGGGGgGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "gGGGGgGGGGgGGGGggGGGGgGGGGgGGGGg",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGgGGGGgGGGGgGGGGGgGGGGgGGGGgGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "gGGGGgGGGGgGGGGggGGGGgGGGGgGGGGg",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGgGGGGgGGGGgGGGGGgGGGGgGGGGgGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "gGGGGgGGGGgGGGGggGGGGgGGGGgGGGGg",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGgGGGGgGGGGgGGGGGgGGGGgGGGGgGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "gGGGGgGGGGgGGGGggGGGGgGGGGgGGGGg",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGgGGGGgGGGGgGGGGGgGGGGgGGGGgGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "gGGGGgGGGGgGGGGggGGGGgGGGGgGGGGg",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGgGGGGgGGGGgGGGGGgGGGGgGGGGgGGG",
      ];

    case 2: // Farm base lot (dirt)
      return [
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
      ];

    case 3: // Workshop base lot (stone foundation)
      return [
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGSSSSSSSSSSSSSSSSSSSSSSGGGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
      ];

    case 4: // Park base lot (grass)
      return [
        "GGgGGGGgGGGGgGGGGGgGGGGgGGGGgGGG",
        "gGGGGgGGGGgGGGGggGGGGgGGGGgGGGGg",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGgGGGGgGGGGgGGGGGgGGGGgGGGGgGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "gGGGGgGGGGgGGGGggGGGGgGGGGgGGGGg",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGgGGGGgGGGGgGGGGGgGGGGgGGGGgGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "gGGGGgGGGGgGGGGggGGGGgGGGGgGGGGg",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGgGGGGgGGGGgGGGGGgGGGGgGGGGgGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "gGGGGgGGGGgGGGGggGGGGgGGGGgGGGGg",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGgGGGGgGGGGgGGGGGgGGGGgGGGGgGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "gGGGGgGGGGgGGGGggGGGGgGGGGgGGGGg",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGgGGGGgGGGGgGGGGGgGGGGgGGGGgGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "gGGGGgGGGGgGGGGggGGGGgGGGGgGGGGg",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGgGGGGgGGGGgGGGGGgGGGGgGGGGgGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "gGGGGgGGGGgGGGGggGGGGgGGGGgGGGGg",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGgGGGGgGGGGgGGGGGgGGGGgGGGGgGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "gGGGGgGGGGgGGGGggGGGGgGGGGgGGGGg",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGgGGGGgGGGGgGGGGGgGGGGgGGGGgGGG",
      ];

    case 6: // Monument base lot (stone plaza)
      return [
        "SSsSSsSSsSSsSSsSSSsSSsSSsSSsSSsSS",
        "sSSsSSsSSsSSsSSsSSsSSsSSsSSsSSsSS",
        "SSsSSsSSsSSsSSsSSSsSSsSSsSSsSSsSS",
        "sSSsSSsSSsSSsSSsSSsSSsSSsSSsSSsSS",
        "SSsSSsSSsSSsSSsSSSsSSsSSsSSsSSsSS",
        "sSSsSSsSSsSSsSSsSSsSSsSSsSSsSSsSS",
        "SSsSSsSSsSSsSSsSSSsSSsSSsSSsSSsSS",
        "sSSsSSsSSsSSsSSsSSsSSsSSsSSsSSsSS",
        "SSsSSsSSsSSsSSsSSSsSSsSSsSSsSSsSS",
        "sSSsSSsSSsSSsSSsSSsSSsSSsSSsSSsSS",
        "SSsSSsSSsSSsSSsSSSsSSsSSsSSsSSsSS",
        "sSSsSSsSSsSSsSSsSSsSSsSSsSSsSSsSS",
        "SSsSSsSSsSSsSSsSSSsSSsSSsSSsSSsSS",
        "sSSsSSsSSsSSsSSsSSsSSsSSsSSsSSsSS",
        "SSsSSsSSsSSsSSsSSSsSSsSSsSSsSSsSS",
        "sSSsSSsSSsSSsSSsSSsSSsSSsSSsSSsSS",
        "SSsSSsSSsSSsSSsSSSsSSsSSsSSsSSsSS",
        "sSSsSSsSSsSSsSSsSSsSSsSSsSSsSSsSS",
        "SSsSSsSSsSSsSSsSSSsSSsSSsSSsSSsSS",
        "sSSsSSsSSsSSsSSsSSsSSsSSsSSsSSsSS",
        "SSsSSsSSsSSsSSsSSSsSSsSSsSSsSSsSS",
        "sSSsSSsSSsSSsSSsSSsSSsSSsSSsSSsSS",
        "SSsSSsSSsSSsSSsSSSsSSsSSsSSsSSsSS",
        "sSSsSSsSSsSSsSSsSSsSSsSSsSSsSSsSS",
        "SSsSSsSSsSSsSSsSSSsSSsSSsSSsSSsSS",
        "sSSsSSsSSsSSsSSsSSsSSsSSsSSsSSsSS",
        "SSsSSsSSsSSsSSsSSSsSSsSSsSSsSSsSS",
        "sSSsSSsSSsSSsSSsSSsSSsSSsSSsSSsSS",
        "SSsSSsSSsSSsSSsSSSsSSsSSsSSsSSsSS",
        "sSSsSSsSSsSSsSSsSSsSSsSSsSSsSSsSS",
        "SSsSSsSSsSSsSSsSSSsSSsSSsSSsSSsSS",
        "sSSsSSsSSsSSsSSsSSsSSsSSsSSsSSsSS",
      ];

    default:
      return Array.from({ length: BIG }, () => ".".repeat(BIG));
  }
}

/**
 * Apply level upgrades on 2x2 lots (more "luxury" as level increases).
 * This produces SimCity-like growth within a 2x2 tile footprint.
 */
function applyBigLevel(kind, level, grid) {
  const L = Math.max(0, Math.min(5, Number(level || 0)));

  // helpers for 32x32
  const lotX0 = 4;
  const lotY0 = 4;
  const lotW = 24;
  const lotH = 24;

  // optional fence boundary
  function fence() {
    for (let x = lotX0; x < lotX0 + lotW; x++) {
      put(grid, x, lotY0, "T");
      put(grid, x, lotY0 + lotH - 1, "T");
    }
    for (let y = lotY0; y < lotY0 + lotH; y++) {
      put(grid, lotX0, y, "T");
      put(grid, lotX0 + lotW - 1, y, "T");
    }
  }

  switch (kind) {
    case 1: {
      // Residential progression:
      // L1: shack, L2: house, L3: townhouse, L4: mid-rise, L5: luxury tower
      if (L >= 1) {
        // small shack (centered)
        outlineBox(grid, 12, 18, 8, 7);
        rect(grid, 13, 19, 6, 2, "R");
        rect(grid, 13, 21, 6, 3, "W");
        put(grid, 15, 22, "d");
        put(grid, 14, 22, "T");
        put(grid, 16, 22, "T");
      }
      if (L >= 2) {
        // expand to a proper house occupying most of the lot
        outlineBox(grid, 8, 12, 16, 14);
        rect(grid, 9, 13, 14, 4, "R");
        rect(grid, 9, 17, 14, 8, "W");
        // windows
        put(grid, 11, 18, "B"); put(grid, 12, 18, "b");
        put(grid, 19, 18, "B"); put(grid, 20, 18, "b");
        // door
        rect(grid, 15, 22, 2, 3, "d");
        // porch trim
        rect(grid, 9, 25, 14, 1, "w");
      }
      if (L >= 3) {
        // townhouse: add side wing + more windows + fence
        fence();
        outlineBox(grid, 6, 10, 20, 16);
        rect(grid, 7, 11, 18, 5, "R");
        rect(grid, 7, 16, 18, 9, "W");
        for (let x of [9, 12, 15, 18, 21]) { put(grid, x, 18, "B"); }
        for (let x of [9, 12, 15, 18, 21]) { put(grid, x, 21, "B"); }
        rect(grid, 14, 22, 4, 3, "d");
        // roof trim
        rect(grid, 7, 16, 18, 1, "r");
      }
      if (L >= 4) {
        // mid-rise: 2nd floor line + darker roof + chimney
        outlineBox(grid, 7, 7, 18, 20);
        rect(grid, 8, 8, 16, 4, "r");
        rect(grid, 8, 12, 16, 14, "W");
        rect(grid, 8, 19, 16, 1, "w"); // floor line
        // window grid
        for (let y of [14, 16, 21, 23]) {
          for (let x of [10, 13, 16, 19, 22]) put(grid, x, y, "B");
        }
        // chimney
        outlineBox(grid, 22, 5, 3, 6);
        rect(grid, 23, 6, 1, 4, "s");
      }
      if (L >= 5) {
        // luxury tower: taller core + gold trims
        outlineBox(grid, 10, 4, 12, 24);
        rect(grid, 11, 5, 10, 3, "r");
        rect(grid, 11, 8, 10, 19, "W");
        // gold accents
        rect(grid, 10, 8, 12, 1, "X");
        rect(grid, 10, 20, 12, 1, "X");
        // many windows
        for (let y = 10; y <= 26; y += 2) {
          for (let x = 12; x <= 19; x += 2) put(grid, x, y, "B");
        }
        // entrance
        rect(grid, 14, 24, 4, 4, "d");
      }
      return;
    }

    case 2: {
      // Farm progression:
      // L1: small crops, L2: dense crops + hut, L3: barn, L4: silo + irrigation, L5: large barn complex
      if (L >= 1) {
        // crop rows
        for (let y = 8; y < 26; y += 3) {
          for (let x = 7; x < 25; x += 2) put(grid, x, y, "y");
        }
      }
      if (L >= 2) {
        // denser crops + small hut
        for (let y = 9; y < 26; y += 2) {
          for (let x = 8; x < 26; x += 2) put(grid, x, y, "Y");
        }
        outlineBox(grid, 22, 20, 6, 6);
        rect(grid, 23, 21, 4, 2, "R");
        rect(grid, 23, 23, 4, 2, "W");
        put(grid, 25, 24, "d");
      }
      if (L >= 3) {
        // barn
        outlineBox(grid, 8, 12, 14, 12);
        rect(grid, 9, 13, 12, 3, "R");
        rect(grid, 9, 16, 12, 7, "W");
        rect(grid, 13, 19, 4, 5, "d");
        // fence
        fence();
      }
      if (L >= 4) {
        // silo + irrigation ditch
        outlineBox(grid, 24, 9, 4, 10);
        rect(grid, 25, 10, 2, 8, "s");
        for (let y = 6; y < 28; y++) put(grid, 6, y, "B"); // water line
        for (let y = 6; y < 28; y++) put(grid, 7, y, "b");
      }
      if (L >= 5) {
        // bigger complex + extra silo
        outlineBox(grid, 6, 10, 18, 16);
        rect(grid, 7, 11, 16, 4, "r");
        rect(grid, 7, 15, 16, 10, "W");
        for (let x = 9; x <= 20; x += 3) put(grid, x, 17, "B");
        rect(grid, 12, 20, 6, 6, "d");
        outlineBox(grid, 26, 10, 4, 10);
        rect(grid, 27, 11, 2, 8, "s");
      }
      return;
    }

    case 3: {
      // Workshop/Industry progression:
      // L1: shed, L2: factory, L3: stacks, L4: crane/metal trims, L5: mega plant
      if (L >= 1) {
        outlineBox(grid, 12, 18, 10, 8);
        rect(grid, 13, 19, 8, 2, "s");
        rect(grid, 13, 21, 8, 4, "S");
        rect(grid, 16, 23, 2, 3, "d");
      }
      if (L >= 2) {
        outlineBox(grid, 8, 12, 18, 14);
        rect(grid, 9, 13, 16, 3, "s");
        rect(grid, 9, 16, 16, 9, "S");
        for (let x of [11, 14, 17, 20, 23]) put(grid, x, 18, "B");
        rect(grid, 16, 22, 4, 4, "d");
      }
      if (L >= 3) {
        // smokestacks
        outlineBox(grid, 22, 6, 4, 10);
        rect(grid, 23, 7, 2, 8, "s");
        outlineBox(grid, 18, 6, 4, 10);
        rect(grid, 19, 7, 2, 8, "s");
        // roof pipes
        rect(grid, 10, 12, 14, 1, "X");
      }
      if (L >= 4) {
        // crane arm + more metal trims
        rect(grid, 6, 7, 12, 1, "X");
        put(grid, 17, 8, "X");
        rect(grid, 8, 15, 18, 1, "x");
        // fence
        fence();
      }
      if (L >= 5) {
        // mega plant: expand footprint + more windows
        outlineBox(grid, 6, 10, 22, 18);
        rect(grid, 7, 11, 20, 3, "s");
        rect(grid, 7, 14, 20, 13, "S");
        for (let y = 16; y <= 24; y += 2) {
          for (let x = 10; x <= 24; x += 3) put(grid, x, y, "B");
        }
        rect(grid, 15, 23, 6, 5, "d");
        rect(grid, 6, 10, 22, 1, "X"); // top trim
      }
      return;
    }

    case 4: {
      // Park progression:
      // L1: small trees, L2: paths, L3: fountain, L4: statue, L5: grand plaza
      if (L >= 1) {
        // trees
        for (let i = 0; i < 6; i++) {
          const x = 8 + (i % 3) * 6;
          const y = 9 + Math.floor(i / 3) * 8;
          rect(grid, x + 1, y, 2, 3, "g");
          rect(grid, x, y + 2, 4, 3, "G");
          rect(grid, x + 1, y + 5, 2, 3, "T");
        }
      }
      if (L >= 2) {
        // paths
        for (let y = 6; y < 28; y++) put(grid, 16, y, "D");
        for (let x = 6; x < 28; x++) put(grid, x, 16, "D");
      }
      if (L >= 3) {
        // fountain
        outlineBox(grid, 12, 12, 9, 9);
        rect(grid, 13, 13, 7, 7, "S");
        put(grid, 16, 16, "B");
        put(grid, 16, 15, "b");
      }
      if (L >= 4) {
        // statue
        outlineBox(grid, 23, 20, 6, 8);
        rect(grid, 24, 21, 4, 2, "S");
        rect(grid, 25, 23, 2, 3, "s");
        put(grid, 26, 26, "X");
      }
      if (L >= 5) {
        // grand plaza border + flower beds
        outlineBox(grid, 5, 5, 22, 22);
        rect(grid, 6, 6, 20, 1, "S");
        rect(grid, 6, 26, 20, 1, "S");
        rect(grid, 6, 6, 1, 20, "S");
        rect(grid, 26, 6, 1, 20, "S");
        for (let x of [8, 24]) for (let y of [8, 24]) put(grid, x, y, "Y");
        for (let x of [10, 22]) for (let y of [10, 22]) put(grid, x, y, "y");
      }
      return;
    }

    case 6: {
      // Monument progression:
      // L1: obelisk, L2: plinth, L3: gold band, L4: taller + ornaments, L5: grand monument
      if (L >= 1) {
        outlineBox(grid, 14, 8, 4, 16);
        rect(grid, 15, 9, 2, 14, "s");
      }
      if (L >= 2) {
        outlineBox(grid, 10, 22, 12, 6);
        rect(grid, 11, 23, 10, 4, "S");
      }
      if (L >= 3) {
        rect(grid, 14, 12, 4, 1, "X");
        rect(grid, 14, 16, 4, 1, "X");
      }
      if (L >= 4) {
        outlineBox(grid, 13, 6, 6, 18);
        rect(grid, 14, 7, 4, 16, "s");
        put(grid, 15, 5, "X"); put(grid, 16, 5, "X");
      }
      if (L >= 5) {
        // grand base + columns
        outlineBox(grid, 7, 20, 18, 10);
        rect(grid, 8, 21, 16, 8, "S");
        for (let x of [9, 13, 19, 23]) {
          outlineBox(grid, x, 14, 2, 6);
          rect(grid, x, 15, 2, 4, "s");
          put(grid, x, 13, "X");
          put(grid, x + 1, 13, "X");
        }
        // extra gold trims
        rect(grid, 7, 20, 18, 1, "X");
        rect(grid, 7, 29, 18, 1, "X");
      }
      return;
    }

    default:
      return;
  }
}

function bigCanvas(kind, level) {
  const k = `big:${kind}:${level}`;
  const hit = cache.get(k);
  if (hit) return hit;

  const grid = makeGridN(BIG, baseBigSprite(kind));
  applyBigLevel(kind, level, grid);
  const cv = drawToCanvas(toLines(grid), BIG);
  cache.set(k, cv);
  return cv;
}

export function clearSpriteCache() {
  cache.clear();
}

/**
 * Draw a tile sprite.
 *
 * Roads (kind=5) are always 1x1 (single tile).
 * Other kinds support 2x2 (4-tile) buildings IF you provide tile coordinates via the optional `opts`.
 *
 * Signature (backward compatible):
 *   drawSpriteTile(ctx, px, py, tilePx, kind, level, opts?)
 *
 * opts (optional):
 *   {
 *     x: number,   // tile x coordinate
 *     y: number    // tile y coordinate
 *   }
 *
 * If opts is not provided, it falls back to 1x1 rendering (safe default).
 */
export function drawSpriteTile(ctx, px, py, tilePx, kind, level, opts = null) {
  // background
  ctx.fillStyle = kind === 0 ? "#EAF6EA" : "#F4F1EA";
  ctx.fillRect(px, py, tilePx, tilePx);

  ctx.imageSmoothingEnabled = false;

  // 1-tile road
  if (kind === 5) {
    const spr = roadCanvas(level);
    ctx.drawImage(spr, px, py, tilePx, tilePx);
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, tilePx - 1, tilePx - 1);
    return;
  }

  // empty
  if (!kind || kind === 0) {
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, tilePx - 1, tilePx - 1);
    return;
  }

  // 2x2 rendering requires tile coordinates; otherwise fallback to 1x1 using the top-left quadrant.
  let qx = 0;
  let qy = 0;

  if (opts && Number.isFinite(opts.x) && Number.isFinite(opts.y)) {
    // group by 2x2 lots: (x%2,y%2) chooses quadrant
    qx = opts.x & 1;
    qy = opts.y & 1;
  }

  const big = bigCanvas(kind, level);

  // crop quadrant (16x16) from 32x32 sprite
  const sx = qx * SPR;
  const sy = qy * SPR;

  ctx.drawImage(big, sx, sy, SPR, SPR, px, py, tilePx, tilePx);

  // subtle grid line
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, tilePx - 1, tilePx - 1);
}
