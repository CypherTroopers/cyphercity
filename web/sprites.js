// web/sprites.js
// - Unified palette
// - “More realistic” pixel art (shading + material variation)
// - Buildings can be rendered as 2x2 (4 tiles) when selected
//   (Road remains 1 tile)
// - Backward compatible: existing call drawSpriteTile(ctx, px, py, tilePx, kind, level) still works

export const SPR = 16;

// Unified palette (shared across all buildings)
const PAL = {
  ".": null,        // transparent

  // Outline / shadow
  "0": "#151515",
  "1": "#2A2A2A",

  // Grass / ground
  "G": "#79C67D",
  "g": "#56A85C",
  "h": "#3D8B44",
  "D": "#C9A26A",
  "d": "#A8804F",
  "m": "#7A5A3A",

  // Stone / concrete / asphalt
  "S": "#C7C7C7",
  "s": "#9E9E9E",
  "k": "#6F6F6F",
  "A": "#3C3F45",

  // Walls / plaster / brick
  "W": "#EFE6D6",
  "w": "#D2C6B3",
  "P": "#D7D7E0",  // pale concrete
  "p": "#B8B8C2",
  "Q": "#B86A5C",  // brick
  "q": "#8D4E43",

  // Roof tiles
  "R": "#C65A52",
  "r": "#9A3E39",
  "t": "#6D2C28",

  // Windows / glass
  "B": "#7FC6FF",
  "b": "#2F74AA",
  "c": "#1C4F78",

  // Wood / doors / fences
  "T": "#7D5A3A",
  "t": "#5B402A",

  // Metal / accents
  "X": "#E0B04B",
  "x": "#A97822",
  "M": "#9AA5B1",  // metal light
  "n": "#66707A",  // metal dark

  // Vegetation / crops / flowers
  "Y": "#E8D56C",
  "y": "#C8B03C",
  "F": "#F06AA6",  // flower
  "f": "#D24E87",

  // Water
  "U": "#4BA6FF",
  "u": "#2A74C9",

  // Smoke / steam
  "Z": "#DADADA",
  "z": "#B0B0B0",
};

// Caches
const cache16 = new Map(); // icon 16x16 (per tile)
const cache32 = new Map(); // big 32x32 (2x2 selected building)

function makeGrid(size, lines) {
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
  const H = grid.length;
  const W = grid[0].length;
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  grid[y][x] = ch;
}

function rect(grid, x0, y0, w, h, ch) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) put(grid, x, y, ch);
}

function outlineBox(grid, x0, y0, w, h, ch = "0") {
  for (let x = x0; x < x0 + w; x++) {
    put(grid, x, y0, ch);
    put(grid, x, y0 + h - 1, ch);
  }
  for (let y = y0; y < y0 + h; y++) {
    put(grid, x0, y, ch);
    put(grid, x0 + w - 1, y, ch);
  }
}

function drawToCanvas(size, lines) {
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

function clampLevel(level) {
  return Math.max(0, Math.min(5, Number(level || 0)));
}

export function footprintTiles(kind) {
  // Buildings become 2x2 footprint when selected; road remains 1x1.
  // kind: 0 empty, 1 house, 2 farm, 3 workshop, 4 park, 5 road, 6 monument
  if (kind === 5 || kind === 0) return { w: 1, h: 1 };
  return { w: 2, h: 2 };
}

// ---------- 16x16 base ground (tile background) ----------

function baseGround16(kind) {
  // Subtle texture. Keep consistent across kinds.
  if (kind === 0) {
    return [
      "GGgGGGGgGGGGgGGG",
      "gGGGGgGGGGgGGGGg",
      "GGGGGGGGGGGGGGGG",
      "GGgGGGGgGGGGgGGG",
      "GGGGGGGGGGGGGGGG",
      "gGGGGgGGGGgGGGGg",
      "GGGGGGGGGGGGGGGG",
      "GGgGGGGgGGGGgGGG",
      "GGGGGGGGGGGGGGGG",
      "gGGGGgGGGGgGGGGg",
      "GGGGGGGGGGGGGGGG",
      "GGgGGGGgGGGGgGGG",
      "GGGGGGGGGGGGGGGG",
      "gGGGGgGGGGgGGGGg",
      "GGGGGGGGGGGGGGGG",
      "GGgGGGGgGGGGgGGG",
    ];
  }

  // Non-empty: light ground / paving hint
  return [
    "GgGGgGGgGGgGGgGG",
    "gGGgGGgGGgGGgGGg",
    "GGgGGgGGgGGgGGgG",
    "GgGGgGGgGGgGGgGG",
    "GGgGGgGGgGGgGGgG",
    "gGGgGGgGGgGGgGGg",
    "GGgGGgGGgGGgGGgG",
    "GgGGgGGgGGgGGgGG",
    "GGgGGgGGgGGgGGgG",
    "gGGgGGgGGgGGgGGg",
    "GGgGGgGGgGGgGGgG",
    "GgGGgGGgGGgGGgGG",
    "GGgGGgGGgGGgGGgG",
    "gGGgGGgGGgGGgGGg",
    "GGgGGgGGgGGgGGgG",
    "GgGGgGGgGGgGGgGG",
  ];
}

function road16(level) {
  const L = clampLevel(level);
  const grid = makeGrid(16, [
    "AAkAAkAAkAAkAAkA",
    "AkAAkAAkAAkAAkAA",
    "AAkAAkAAkAAkAAkA",
    "AkAAkAAkAAkAAkAA",
    "AAkAAkAAkAAkAAkA",
    "AkAAkAAkAAkAAkAA",
    "AAkAAkAAkAAkAAkA",
    "AkAAkAAkAAkAAkAA",
    "AAkAAkAAkAAkAAkA",
    "AkAAkAAkAAkAAkAA",
    "AAkAAkAAkAAkAAkA",
    "AkAAkAAkAAkAAkAA",
    "AAkAAkAAkAAkAAkA",
    "AkAAkAAkAAkAAkAA",
    "AAkAAkAAkAAkAAkA",
    "AkAAkAAkAAkAAkAA",
  ]);

  // Level adds markings / curb
  if (L >= 2) {
    for (let y = 0; y < 16; y++) put(grid, 7, y, "k");
    for (let y = 0; y < 16; y++) put(grid, 8, y, "k");
  }
  if (L >= 3) {
    for (let y = 1; y < 16; y += 3) put(grid, 7, y, "X");
  }
  if (L >= 4) {
    for (let x = 0; x < 16; x++) {
      put(grid, x, 0, "0");
      put(grid, x, 15, "0");
    }
  }
  if (L >= 5) {
    for (let x = 2; x <= 13; x += 2) {
      put(grid, x, 7, "S");
      put(grid, x, 8, "S");
    }
  }

  return toLines(grid);
}

// ---------- 32x32 “selected building” sprites (2x2 footprint) ----------

function base32(kind) {
  // Big sprites are more detailed and more “SimCity-like”.
  // These are intentionally designed with shading (0/1 outlines), materials, and depth hints.
  // Coordinates: 32x32
  switch (kind) {
    case 1: // House -> Apartment -> High-rise (level-based)
      return [
        "................................",
        ".............000000.............",
        "............0rrrrrr0............",
        "...........0rRRRRRRr0...........",
        "..........0rRRRRRRRRr0..........",
        ".........0rRRRRRRRRRRr0.........",
        "........0rRRRRRRRRRRRRr0........",
        "........0RRRRRRRRRRRRRR0........",
        ".......0WWWWWWWWWWWWWWWW0.......",
        ".......0WBBBBWBBBBWBBBBW0.......",
        ".......0WbbbbWbbbbWbbbbW0.......",
        ".......0WBBBBWBBBBWBBBBW0.......",
        ".......0WwwwwWwwwwWwwwwW0.......",
        ".......0WTTTTTTTTTTTTTTW0.......",
        ".......0WTddddTddddTdddTW0......",
        ".......0WTddddTddddTdddTW0......",
        ".......0WTTTTTTTTTTTTTTW0.......",
        ".......0WBBBBWBBBBWBBBBW0.......",
        ".......0WbbbbWbbbbWbbbbW0.......",
        ".......0WBBBBWBBBBWBBBBW0.......",
        ".......0WWWWWWWWWWWWWWWW0.......",
        "........0000000000000000........",
        "...........0........0...........",
        "...........0........0...........",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
      ];
    case 2: // Farm -> Barn -> Greenhouse -> Agro complex
      return [
        "................................",
        "....GGGGGGGGGGGGGGGGGGGGGGG.....",
        "...GggggggggggggggggggggggG.....",
        "..GDDDDDDDDDDDDDDDDDDDDDDDgG....",
        "..GDYDYDYDYDYDYDYDYDYDYDYDgG....",
        "..GDDDDDDDDDDDDDDDDDDDDDDDgG....",
        "..GDYDYDYDYDYDYDYDYDYDYDYDgG....",
        "..GDDDDDDDDDDDDDDDDDDDDDDDgG....",
        "..GDYDYDYDYDYDYDYDYDYDYDYDgG....",
        "..GDDDDDDDDDDDDDDDDDDDDDDDgG....",
        "...GggggggggggggggggggggggG.....",
        "....GGGGGGGGGGGGGGGGGGGGGG......",
        "...............0000000..........",
        "..............0rRRRRr0..........",
        ".............0rRRRRRRr0.........",
        "............0WWWWWWWWW0.........",
        "............0WBBBBBBBB0.........",
        "............0Wbbbbbbbb0.........",
        "............0WTTTTTTTW0.........",
        "............0WTddddddW0.........",
        "............0WTddddddW0.........",
        "............0WTTTTTTTW0.........",
        ".............000000000..........",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
      ];
    case 3: // Workshop -> Factory -> Plant
      return [
        "................................",
        "...........0000000000...........",
        "..........0ssssssssss0..........",
        ".........0sSSSSSSSSSSs0.........",
        "........0sSSSBBBBBBSSSs0........",
        "........0sSSSbbbbbbSSSs0........",
        "........0sSSSBBBBBBSSSs0........",
        "........0sSSSSSSSSSSSSs0........",
        "........0sSSS0SS0SS0SSs0........",
        "........0sSSSSSSSSSSSSs0........",
        "........0sSSS0SS0SS0SSs0........",
        "........0sSSSSSXXSSSSSs0........",
        "........0sSSSSSSSSSSSSs0........",
        "........0sSSSSSSSSSSSSs0........",
        "........0sSSSSSSSSSSSSs0........",
        ".........0ssssssssssss0.........",
        "..........000000000000..........",
        "...............00...............",
        "...............00...............",
        "...............00...............",
        "...............00...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
      ];
    case 4: // Park -> Plaza -> Fountain garden
      return [
        "................................",
        "....GGGGGGGGGGGGGGGGGGGGGGG.....",
        "...GggGGGGggGGGGggGGGGgggG......",
        "...Gg..GG....GG....GG..gG......",
        "...Gg.GGGG..GGGG..GGGG.gG......",
        "...GgGGGGGGGGGGGGGGGGGgG......",
        "...GgGGGGGGGGGGGGGGGGGgG......",
        "...Gg..GG....GG....GG..gG......",
        "...Gg..GG....GG....GG..gG......",
        "...Gg....DDDDDDDDDD....gG......",
        "...Gg....D......D......gG......",
        "...Gg....D..UU..D......gG......",
        "...Gg....D..UU..D......gG......",
        "...Gg....D......D......gG......",
        "...Gg....DDDDDDDD......gG......",
        "...Gg..TTTT..TTTT..TT..gG......",
        "...Gg..Tttt..Tttt..Tt..gG......",
        "...Gg..TTTT..TTTT..TT..gG......",
        "...GggGGGGggGGGGggGGGGggG......",
        "....GGGGGGGGGGGGGGGGGGGGG......",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
      ];
    case 6: // Monument -> Grand monument
      return [
        "................................",
        "...............00...............",
        "..............0ss0..............",
        "..............0ss0..............",
        "..............0ss0..............",
        "..............0ss0..............",
        "..............0ss0..............",
        "..............0ss0..............",
        ".............0ssss0.............",
        ".............0sSSs0.............",
        ".............0ssss0.............",
        "............0ssssss0............",
        "...........0ssssssss0...........",
        "...........0ssssssss0...........",
        "..........0ssssssssss0..........",
        "..........0ssssssssss0..........",
        ".........0ssssssssssss0.........",
        ".........0ssssXXsssssss0........",
        ".........0ssssssssssss0.........",
        "..........0ssssssssss0..........",
        "...........0000000000...........",
        "..........0SSSSSSSSSS0..........",
        "..........0SssssssssS0..........",
        "..........0SSSSSSSSSS0..........",
        "...........0000000000...........",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
      ];
    default:
      return Array.from({ length: 32 }, () => ".".repeat(32));
  }
}

function applyLevel32(kind, level, grid) {
  const L = clampLevel(level);

  // Make upgrades clearly “more luxurious” like SimCity:
  // L1: small/simple
  // L2: added trims/details
  // L3: larger mass / extra floors
  // L4: premium features
  // L5: landmark-like (high-rise / complex)
  switch (kind) {
    case 1: {
      // House -> Apartment -> High-rise
      if (L <= 1) {
        // shrink by adding more ground cover (simple)
        // (no-op: base already looks like mid)
      }
      if (L >= 2) {
        // Roof trim highlight
        for (let x = 13; x <= 18; x++) put(grid, x, 2, "X");
      }
      if (L >= 3) {
        // Add second “tower” on the right
        outlineBox(grid, 22, 8, 7, 13, "0");
        rect(grid, 23, 9, 5, 11, "P");
        for (let y = 10; y <= 19; y += 3) {
          put(grid, 24, y, "B");
          put(grid, 26, y, "B");
        }
        // Roof for tower
        rect(grid, 23, 8, 5, 1, "r");
      }
      if (L >= 4) {
        // Chimney + subtle shadow
        outlineBox(grid, 10, 1, 3, 6, "0");
        rect(grid, 11, 2, 1, 4, "s");
        for (let y = 6; y <= 8; y++) put(grid, 11, y, "z");
      }
      if (L >= 5) {
        // Make it “high-rise”: add a tall center block
        outlineBox(grid, 12, 6, 8, 18, "0");
        rect(grid, 13, 7, 6, 16, "P");
        for (let y = 8; y <= 22; y += 2) {
          put(grid, 14, y, "B");
          put(grid, 16, y, "B");
          put(grid, 18, y, "B");
        }
        // Entrance plaza
        rect(grid, 9, 24, 14, 2, "S");
        rect(grid, 11, 23, 10, 1, "s");
      }
      return;
    }
    case 2: {
      // Farm -> greenhouse / agro complex
      if (L >= 2) {
        // denser crops
        for (let y = 3; y <= 10; y++) for (let x = 3; x <= 26; x += 2) put(grid, x, y, "Y");
      }
      if (L >= 3) {
        // fence
        for (let x = 1; x <= 28; x++) { put(grid, x, 2, "T"); put(grid, x, 11, "T"); }
        for (let y = 2; y <= 11; y++) { put(grid, 1, y, "T"); put(grid, 28, y, "T"); }
      }
      if (L >= 4) {
        // greenhouse on left
        outlineBox(grid, 3, 14, 10, 9, "0");
        rect(grid, 4, 15, 8, 7, "P");
        for (let x = 5; x <= 10; x += 2) {
          put(grid, x, 16, "B");
          put(grid, x, 18, "B");
          put(grid, x, 20, "B");
        }
      }
      if (L >= 5) {
        // silo + processing shed
        outlineBox(grid, 26, 13, 5, 12, "0");
        rect(grid, 27, 14, 3, 10, "s");
        put(grid, 28, 13, "0");
        rect(grid, 18, 22, 10, 3, "S");
        outlineBox(grid, 18, 22, 10, 3, "0");
      }
      return;
    }
    case 3: {
      // Workshop -> plant
      if (L >= 2) {
        // side column + vents
        rect(grid, 8, 2, 2, 14, "s");
        for (let x = 12; x <= 19; x += 2) put(grid, x, 2, "n");
      }
      if (L >= 3) {
        // smokestack with smoke
        outlineBox(grid, 25, 2, 5, 14, "0");
        rect(grid, 26, 3, 3, 12, "k");
        for (let y = 1; y <= 5; y++) put(grid, 27, y, "z");
        put(grid, 27, 0, "Z");
      }
      if (L >= 4) {
        // crane arm / conveyor
        for (let x = 14; x <= 31; x++) put(grid, x, 1, "X");
        put(grid, 31, 2, "X");
        rect(grid, 10, 18, 16, 2, "M");
      }
      if (L >= 5) {
        // extra floor block
        outlineBox(grid, 6, 16, 20, 10, "0");
        rect(grid, 7, 17, 18, 8, "P");
        for (let y = 18; y <= 23; y += 2) {
          put(grid, 9, y, "B");
          put(grid, 13, y, "B");
          put(grid, 17, y, "B");
          put(grid, 21, y, "B");
        }
      }
      return;
    }
    case 4: {
      // Park -> plaza
      if (L >= 2) {
        // more flowers
        for (let x of [6, 10, 14, 18, 22, 26]) {
          put(grid, x, 6, "F");
          put(grid, x + 1, 6, "f");
        }
      }
      if (L >= 3) {
        // wider path
        rect(grid, 13, 8, 6, 12, "D");
        rect(grid, 14, 8, 4, 12, "d");
      }
      if (L >= 4) {
        // bigger fountain
        outlineBox(grid, 12, 10, 8, 8, "0");
        rect(grid, 13, 11, 6, 6, "U");
        rect(grid, 14, 12, 4, 4, "u");
      }
      if (L >= 5) {
        // plaza stones
        rect(grid, 9, 22, 14, 6, "S");
        for (let y = 23; y <= 26; y++) for (let x = 10; x <= 21; x += 2) put(grid, x, y, "s");
        outlineBox(grid, 9, 22, 14, 6, "0");
      }
      return;
    }
    case 6: {
      // Monument -> grand base + gold trims
      if (L >= 2) {
        // larger base
        outlineBox(grid, 6, 22, 20, 6, "0");
        rect(grid, 7, 23, 18, 4, "S");
        rect(grid, 8, 24, 16, 2, "s");
      }
      if (L >= 3) {
        // gold band
        for (let x = 14; x <= 17; x++) put(grid, x, 9, "X");
        for (let x = 14; x <= 17; x++) put(grid, x, 10, "x");
      }
      if (L >= 4) {
        // top ornament
        put(grid, 15, 1, "X");
        put(grid, 16, 1, "X");
        put(grid, 15, 0, "x");
        put(grid, 16, 0, "x");
      }
      if (L >= 5) {
        // side pillars
        outlineBox(grid, 5, 10, 4, 12, "0");
        rect(grid, 6, 11, 2, 10, "S");
        outlineBox(grid, 23, 10, 4, 12, "0");
        rect(grid, 24, 11, 2, 10, "S");
      }
      return;
    }
    default:
      return;
  }
}

function sprite32Canvas(kind, level) {
  const L = clampLevel(level);
  const key = `${kind}:${L}`;
  const hit = cache32.get(key);
  if (hit) return hit;

  const grid = makeGrid(32, base32(kind));
  applyLevel32(kind, L, grid);
  const cv = drawToCanvas(32, toLines(grid));
  cache32.set(key, cv);
  return cv;
}

// Build a 16x16 icon for the normal (non-selected) tile.
// For buildings: downscale the 32x32 sprite -> 16x16 (nearest) for consistent style.
function icon16Canvas(kind, level) {
  const L = clampLevel(level);
  const key = `${kind}:${L}`;
  const hit = cache16.get(key);
  if (hit) return hit;

  let cv16;

  if (kind === 5) {
    cv16 = drawToCanvas(16, road16(L));
  } else {
    // base ground + downscaled building (if any)
    const ground = drawToCanvas(16, baseGround16(kind));
    const off = document.createElement("canvas");
    off.width = 16;
    off.height = 16;
    const c = off.getContext("2d");
    c.imageSmoothingEnabled = false;

    // draw ground
    c.drawImage(ground, 0, 0, 16, 16);

    if (kind !== 0) {
      const big = sprite32Canvas(kind, L);
      // downscale 32->16
      c.drawImage(big, 0, 0, 32, 32, 0, 0, 16, 16);
      // subtle shadow
      c.fillStyle = "rgba(0,0,0,0.10)";
      c.fillRect(0, 15, 16, 1);
    }
    cv16 = off;
  }

  cache16.set(key, cv16);
  return cv16;
}

export function clearSpriteCache() {
  cache16.clear();
  cache32.clear();
}

/**
 * Draw a single tile (1x1) sprite.
 * Backward compatible signature:
 *   drawSpriteTile(ctx, px, py, tilePx, kind, level)
 *
 * Optional 7th arg:
 *   opts = {
 *     selected: boolean,      // if true, draws 2x2 building overlay anchored here (except road)
 *     selectionStyle: "soft" | "strong" // overlay highlight strength
 *   }
 */
export function drawSpriteTile(ctx, px, py, tilePx, kind, level, opts = {}) {
  const L = clampLevel(level);

  // Base tile icon (always 1x1)
  const icon = icon16Canvas(kind, L);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(icon, px, py, tilePx, tilePx);

  // Grid line (subtle)
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, tilePx - 1, tilePx - 1);

  // If selected and building footprint is 2x2, draw overlay here (anchor: this tile = top-left)
  if (opts && opts.selected && kind !== 0 && kind !== 5) {
    drawSelectedBuilding(ctx, px, py, tilePx, kind, L, { style: opts.selectionStyle || "soft" });
  }
}

/**
 * Draw selected building as 2x2 (4 tiles) overlay.
 * Anchor: (px,py) is top-left tile of the 2x2 footprint.
 *
 * This function should be called ONCE per frame (not per tile),
 * typically for the currently selected tile.
 *
 * Options:
 *   { style: "soft" | "strong" }
 */
export function drawSelectedBuilding(ctx, px, py, tilePx, kind, level, options = {}) {
  const L = clampLevel(level);
  const fp = footprintTiles(kind);
  if (fp.w === 1 && fp.h === 1) return; // road/empty

  const wPx = tilePx * fp.w;
  const hPx = tilePx * fp.h;

  // Selection glow / footprint highlight
  const style = options.style || "soft";
  ctx.save();
  ctx.globalCompositeOperation = "source-over";

  if (style === "strong") {
    ctx.fillStyle = "rgba(255, 230, 120, 0.22)";
    ctx.fillRect(px, py, wPx, hPx);
    ctx.strokeStyle = "rgba(255, 210, 70, 0.85)";
    ctx.lineWidth = 3;
    ctx.strokeRect(px + 1.5, py + 1.5, wPx - 3, hPx - 3);
  } else {
    ctx.fillStyle = "rgba(255, 255, 255, 0.10)";
    ctx.fillRect(px, py, wPx, hPx);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, wPx - 2, hPx - 2);
  }

  // Drop shadow behind the 2x2 building
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(px + Math.max(2, Math.floor(tilePx * 0.06)), py + hPx - Math.max(2, Math.floor(tilePx * 0.08)), wPx - 2, Math.max(2, Math.floor(tilePx * 0.08)));

  // Draw the 32x32 building scaled into 2x2 tiles
  const spr = sprite32Canvas(kind, L);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(spr, px, py, wPx, hPx);

  // Re-draw internal grid lines lightly (so 2x2 still reads as 4 tiles)
  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth = 1;
  // vertical divider
  ctx.beginPath();
  ctx.moveTo(px + tilePx + 0.5, py + 0.5);
  ctx.lineTo(px + tilePx + 0.5, py + hPx - 0.5);
  ctx.stroke();
  // horizontal divider
  ctx.beginPath();
  ctx.moveTo(px + 0.5, py + tilePx + 0.5);
  ctx.lineTo(px + wPx - 0.5, py + tilePx + 0.5);
  ctx.stroke();

  ctx.restore();
}
