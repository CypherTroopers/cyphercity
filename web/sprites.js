// web/sprites.js
// 16x16 unified-palette pixel sprites with SimCity-like "richer as level increases" progression.
// kind: 0 empty, 1 residential, 2 farm, 3 industry, 4 park, 5 road, 6 monument

export const SPR = 16;

// Unified palette (shared across all sprites)
// Keep the original keys and add a few extra for richer shading/materials.
const PAL = {
  ".": null,        // transparent
  "0": "#1B1B1B",   // outline

  // terrain
  "G": "#7FCB8A",   // grass
  "g": "#5EAF6B",   // dark grass
  "D": "#C9A26A",   // dirt
  "d": "#9B7B4C",   // dark dirt

  // stone / concrete
  "S": "#B9B9B9",   // stone
  "s": "#8F8F8F",   // dark stone
  "C": "#CFCFD6",   // concrete light
  "c": "#9EA0A8",   // concrete dark

  // walls / roofs
  "W": "#E9E1D2",   // wall light
  "w": "#CFC4B2",   // wall dark
  "R": "#C15A52",   // roof light
  "r": "#8F3C37",   // roof dark

  // glass / windows / lights
  "B": "#6FB6FF",   // window light
  "b": "#2D6FA7",   // window dark
  "H": "#BFE6FF",   // glass highlight
  "L": "#FFE58A",   // warm light (windows/street)

  // wood / metal / accent
  "T": "#7A5A3A",   // wood light
  "t": "#5A422B",   // wood dark
  "X": "#D9A441",   // accent (gold/trim)
  "x": "#9D6F1E",   // dark accent

  // crops
  "Y": "#E7D46D",   // wheat light
  "y": "#C8AF3F",   // wheat dark

  // water (for fountains/park)
  "U": "#6FC9FF",
  "u": "#2F86C8",
};

// cache: kind:level -> canvas
const cache = new Map();

function clampLevel(level) {
  return Math.max(0, Math.min(5, Number(level || 0)));
}

function makeGrid(lines) {
  // 16x16 char grid
  const g = Array.from({ length: SPR }, (_, y) => {
    const row = (lines[y] || "").padEnd(SPR, ".").slice(0, SPR);
    return row.split("");
  });
  return g;
}

function toLines(grid) {
  return grid.map((r) => r.join(""));
}

function clearGrid(grid, ch = ".") {
  for (let y = 0; y < SPR; y++) for (let x = 0; x < SPR; x++) grid[y][x] = ch;
}

function put(grid, x, y, ch) {
  if (x < 0 || y < 0 || x >= SPR || y >= SPR) return;
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

function blitLines(grid, lines) {
  for (let y = 0; y < SPR; y++) {
    const row = (lines[y] || "").padEnd(SPR, ".").slice(0, SPR);
    for (let x = 0; x < SPR; x++) {
      const ch = row[x];
      if (ch === ".") continue; // keep underlying
      put(grid, x, y, ch);
    }
  }
}

function drawToCanvas(lines) {
  const off = document.createElement("canvas");
  off.width = SPR;
  off.height = SPR;

  const c = off.getContext("2d");
  c.imageSmoothingEnabled = false;

  for (let y = 0; y < SPR; y++) {
    const row = lines[y] || "";
    for (let x = 0; x < SPR; x++) {
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
 * Base terrain for each kind (grass base, cobble base, etc.)
 * Buildings are layered on top per level.
 */
function baseTerrain(kind) {
  if (kind === 5) {
    // road base: asphalt/concrete blend
    return [
      "cccccccccccccccc",
      "cccccccccccccccc",
      "cccccccccccccccc",
      "cccccccccccccccc",
      "cccccccccccccccc",
      "cccccccccccccccc",
      "cccccccccccccccc",
      "cccccccccccccccc",
      "cccccccccccccccc",
      "cccccccccccccccc",
      "cccccccccccccccc",
      "cccccccccccccccc",
      "cccccccccccccccc",
      "cccccccccccccccc",
      "cccccccccccccccc",
      "cccccccccccccccc",
    ];
  }

  // grass base with subtle variation (SimCity-ish)
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

/**
 * Building overlays by kind & level (1..5).
 * These are designed to feel like SNES SimCity progression:
 * small -> larger -> denser -> high-rise -> skyline landmark.
 *
 * NOTE: '.' means transparent (terrain shows through).
 */
function overlaySprite(kind, level) {
  const L = clampLevel(level);

  // empty: no overlay
  if (kind === 0 || L === 0) {
    return Array(16).fill("................");
  }

  // 1: Residential (house -> duplex -> apartment -> condo -> high-rise)
  if (kind === 1) {
    switch (L) {
      case 1:
        return [
          "................",
          "......0000......",
          ".....0RRR0......",
          "....0RRRRR0.....",
          "...0RRRRRRR0....",
          "...0WWWWWWW0....",
          "...0WBBWWWW0....",
          "...0WWWWBBWW0...",
          "...0WWTTTTW0....",
          "...0WWTddTW0....",
          "...0WWTddTW0....",
          "...0WWTTTTW0....",
          "....0000000.....",
          ".......TT.......",
          "......TttT......",
          "................",
        ];
      case 2:
        // two-story with porch and extra windows
        return [
          "................",
          ".....000000.....",
          "....0RRRRR0.....",
          "...0RRRRRRR0....",
          "...0WWWWWWW0....",
          "...0WBBWWBBW0...",
          "...0WWWWWWWW0...",
          "...0WWwwwwWW0...",
          "...0WWBWWWBW0...",
          "...0WWTTTTWW0...",
          "...0WWTddTWW0...",
          "...0WWTddTWW0...",
          "...0WWTTTTWW0...",
          "....00000000....",
          ".....TTTTTT.....",
          "................",
        ];
      case 3:
        // mid-rise apartment
        return [
          "................",
          "....00000000....",
          "...0CCCCCCCC0...",
          "...0CBBLBBBC0...",
          "...0CBBLBBBC0...",
          "...0CBBLBBBC0...",
          "...0CBBLBBBC0...",
          "...0CCCCCCCC0...",
          "...0CBBLBBBC0...",
          "...0CBBLBBBC0...",
          "...0CBBLBBBC0...",
          "...0CBBBBBBC0...",
          "...0CccddccC0...",
          "....00000000....",
          "......cccc......",
          "................",
        ];
      case 4:
        // condo with glass and trim
        return [
          ".....000000.....",
          "....0CCCCCC0....",
          "...0CHHHHHHC0...",
          "...0CHBBLBBHC0...",
          "...0CHBBLBBHC0...",
          "...0CHBBLBBHC0...",
          "...0CHHHHHHC0...",
          "...0CBBBBBBBC0...",
          "...0CBBLBBBBC0...",
          "...0CBBLBBBBC0...",
          "...0CBBBBBBBC0...",
          "...0CccXXXXcC0...",
          "...0CccddXXcC0...",
          "....0CCCCCC0....",
          ".....000000.....",
          "................",
        ];
      case 5:
        // high-rise tower (city skyline feel)
        return [
          ".....000000.....",
          "....0CCCCCC0....",
          "...0CHHHHHHC0...",
          "...0CHBLBLBHC0...",
          "...0CHBLBLBHC0...",
          "...0CHBLBLBHC0...",
          "...0CHBLBLBHC0...",
          "...0CHBLBLBHC0...",
          "...0CHBLBLBHC0...",
          "...0CHBLBLBHC0...",
          "...0CHBLBLBHC0...",
          "...0CHBLBLBHC0...",
          "...0CccXXXXcC0...",
          "...0CccddXXcC0...",
          "....0CCCCCC0....",
          ".....000000.....",
        ];
    }
  }

  // 2: Farm (small plot -> more crops -> fence -> silo/irrigation -> large farm complex)
  if (kind === 2) {
    switch (L) {
      case 1:
        return [
          "................",
          "..DDDDDDDDDDDD..",
          ".DdyDyDyDyDyDyd.",
          ".DDDDDDDDDDDDDD.",
          ".DyDyDyDyDyDyDy.",
          ".DDDDDDDDDDDDDD.",
          ".DyDyDyDyDyDyDy.",
          ".DDDDDDDDDDDDDD.",
          ".DdyDyDyDyDyDyd.",
          "..DDDDDDDDDDDD..",
          "......0000......",
          ".....0RRR0......",
          ".....0WWW0......",
          ".....0WTd0......",
          "......0000......",
          "................",
        ];
      case 2:
        return [
          "................",
          "..DDDDDDDDDDDD..",
          ".DYyDYyDYyDYyDY.",
          ".DDDDDDDDDDDDDD.",
          ".DYyDYyDYyDYyDY.",
          ".DDDDDDDDDDDDDD.",
          ".DYyDYyDYyDYyDY.",
          ".DDDDDDDDDDDDDD.",
          ".DYyDYyDYyDYyDY.",
          "..DDDDDDDDDDDD..",
          "......00000.....",
          ".....0RRRR0.....",
          ".....0WWWW0.....",
          ".....0WTdd0.....",
          "......00000.....",
          "................",
        ];
      case 3:
        // fenced with barn
        return [
          "..TTTTTTTTTTTT..",
          ".TDDDDDDDDDDDDT.",
          ".TDYyDYyDYyDYyT.",
          ".TDDDDDDDDDDDDT.",
          ".TDYyDYyDYyDYyT.",
          ".TDDDDDDDDDDDDT.",
          ".TDYyDYyDYyDYyT.",
          ".TDDDDDDDDDDDDT.",
          ".TDYyDYyDYyDYyT.",
          ".TDDDDDDDDDDDDT.",
          ".TTTTTTTTTTTTTT.",
          "......00000.....",
          ".....0RRRR0.....",
          ".....0WWWW0.....",
          ".....0WTdd0.....",
          "......00000.....",
        ];
      case 4:
        // add silo + irrigation line
        return [
          "..TTTTTTTTTTTT..",
          ".TDDDDDDDDDDDDT.",
          ".TDYyDYyDYyDYyT.",
          ".TDDDDDDDDDDDDT.",
          ".TDYyDYyDYyDYyT.",
          ".TDDDDDDDDDDDDT.",
          ".TDYyDYyDYyDYyT.",
          ".TDDDDDDDDDDDDT.",
          ".TDYyDYyDYyDYyT.",
          ".TDDDDDDDDDDDDT.",
          ".TTTTTTTTTTTTTT.",
          "....00000..00...",
          "...0RRRR0.0ss0..",
          "...0WWWW0.0ss0..",
          "...0WTdd0.0ss0..",
          "....00000..00...",
        ];
      case 5:
        // large farm: bigger barn + two silos + equipment
        return [
          "..TTTTTTTTTTTT..",
          ".TDDDDDDDDDDDDT.",
          ".TDYyDYyDYyDYyT.",
          ".TDDDDDDDDDDDDT.",
          ".TDYyDYyDYyDYyT.",
          ".TDDDDDDDDDDDDT.",
          ".TDYyDYyDYyDYyT.",
          ".TDDDDDDDDDDDDT.",
          ".TDYyDYyDYyDYyT.",
          ".TDDDDDDDDDDDDT.",
          ".TTTTTTTTTTTTTT.",
          "...0000000000...",
          "..0RRRRRRRRR0..0",
          "..0WWWWWWWWWW0s0",
          "..0WTddTTddTW0s0",
          "...0000000000..0",
        ];
    }
  }

  // 3: Workshop / Industry (shop -> factory -> smokestacks -> complex -> heavy industry)
  if (kind === 3) {
    switch (L) {
      case 1:
        return [
          "................",
          ".....000000.....",
          "....0ssssss0....",
          "...0sSSSSSSs0...",
          "...0sSBBLBBs0...",
          "...0sSSSSSSs0...",
          "...0sSBBLBBs0...",
          "...0sSSSSSSs0...",
          "...0sSSSSSSs0...",
          "...0sSSXXSSs0...",
          "...0sSSSSSSs0...",
          "....0ssssss0....",
          ".....000000.....",
          "......00........",
          "......00........",
          "................",
        ];
      case 2:
        return [
          "................",
          "....00000000....",
          "...0ssssssss0...",
          "..0sSSSSSSSSs0..",
          "..0sSBBLBBLBs0..",
          "..0sSSSSSSSSs0..",
          "..0sSBBLBBLBs0..",
          "..0sSSSSSSSSs0..",
          "..0sSSSSSSSSs0..",
          "..0sSSXXSSSSs0..",
          "..0sSSSSSSSSs0..",
          "...0ssssssss0...",
          "....00000000....",
          "......00..00....",
          "......00..00....",
          "................",
        ];
      case 3:
        // smokestack + hazard stripes
        return [
          ".....00.........",
          "....0ss0....00..",
          "...0ssss0..0ss0.",
          "..0sSSSSs0.0ss0.",
          "..0sSBBLs0.0ss0.",
          "..0sSSSSs0.0ss0.",
          "..0sSBBLs0.0ss0.",
          "..0sSSSSs0.0ss0.",
          "..0sSSSSs0.0ss0.",
          "..0sSSXXs0.0ss0.",
          "..0sSSSSs0.0ss0.",
          "...0ssss0..0ss0.",
          "....0000000000..",
          "....0XxXxXxXx0..",
          "....0000000000..",
          "................",
        ];
      case 4:
        // larger complex with more glass and second stack
        return [
          "....00.....00...",
          "...0ss0...0ss0..",
          "..0ssss0.0ssss0.",
          ".0sSSSSs0sSSSSs0",
          ".0sSHHHC0CHHHHs0",
          ".0sSBBLCCCCLBBs0",
          ".0sSSSSCCCCSSSs0",
          ".0sSBBLCCCCLBBs0",
          ".0sSSSSCCCCSSSs0",
          ".0sSSXXCCCCXXSs0",
          ".0sSSSSCCCCSSSs0",
          "..0ssss0.0ssss0.",
          "...0000...0000..",
          "..0XxX0..0XxX0..",
          "...000....000...",
          "................",
        ];
      case 5:
        // heavy industry: tall stacks + lit windows + metal trim
        return [
          "..00....00....00",
          ".0ss0..0ss0..0ss0",
          "0ssss00ssss00ssss",
          "0sSSSs0sSSSs0sSSS",
          "0sSHHHCCHHHHCCSHH",
          "0sSBLBLCLBLBLCBLB",
          "0sSCCCCCCCCCCCCCs",
          "0sSBLBLCLBLBLCBLB",
          "0sSCCCCCCCCCCCCCs",
          "0sSXXCCXXCCXXCCXX",
          "0sSCCCCCCCCCCCCCs",
          "0sSBLBLCLBLBLCBLB",
          "0sSCCCCCCCCCCCCCs",
          "0sSccXXXXXXccXXs0",
          ".0s0ccddLLccdd0s.",
          "..00000000000000.",
        ];
    }
  }

  // 4: Park (tree -> playground -> path -> fountain -> plaza/statue garden)
  if (kind === 4) {
    switch (L) {
      case 1:
        return [
          "................",
          "....GGGGGGGG....",
          "...GggGGGGggG...",
          "...Gg..gg..gG...",
          "...Gg.GGGG.gG...",
          "...GgGGGGGGgG...",
          "...GgGGGGGGgG...",
          "...Gg..GG..gG...",
          "...Gg..GG..gG...",
          "...Gg..TT..gG...",
          "...Gg..TT..gG...",
          "...GgTTTTTTgG...",
          "...GgTttttTgG...",
          "...GggGGGGggG...",
          "....GGGGGGGG....",
          "................",
        ];
      case 2:
        // add flowers and a small playground slide
        return [
          "................",
          "....GGGGGGGG....",
          "...GggGGGGggG...",
          "...Gg..gg..gG...",
          "...Gg.GGGG.gG...",
          "...GgGGGGGGgG...",
          "...Gg..UU..gG...",
          "...Gg..uU..gG...",
          "...Gg..TT..gG...",
          "...Gg..TT..gG...",
          "...GgTTTTTTgG...",
          "...GgTttttTgG...",
          "...Gg..Y..YgG...",
          "...GggGGGGggG...",
          "....GGGGGGGG....",
          "................",
        ];
      case 3:
        // path through the park
        return [
          "................",
          "....GGGGGGGG....",
          "...GggGGGGggG...",
          "...Gg..gg..gG...",
          "...Gg.GGGG.gG...",
          "...GgGGDDGGgG...",
          "...Gg..DD..gG...",
          "...Gg..DD..gG...",
          "...Gg..DD..gG...",
          "...Gg..TT..gG...",
          "...Gg..TT..gG...",
          "...GgTTTTTTgG...",
          "...GgTttttTgG...",
          "...Gg..Y..YgG...",
          "....GGGGGGGG....",
          "................",
        ];
      case 4:
        // fountain center + stone edging
        return [
          "....SSSSSSSS....",
          "...SGGGGGGGGS...",
          "..SGggGGGGggGS..",
          "..SGg..DD..gGS..",
          "..SGg.GGDD.gGS..",
          "..SGgDDUU DDgS..",
          "..SGgDDuU DDgS..",
          "..SGgDDUU DDgS..",
          "..SGg..DD..gGS..",
          "..SGg..DD..gGS..",
          "..SGgTTTTTTgGS..",
          "..SGgTttttTgGS..",
          "..SGg..Y..YgGS..",
          "..SGggGGGGggGS..",
          "...SGGGGGGGGS...",
          "....SSSSSSSS....",
        ];
      case 5:
        // plaza + statue (monument-like) in the park
        return [
          "....SSSSSSSS....",
          "...SCCCCCCCCS...",
          "..SCCHHHHHHCCS..",
          "..SCCHDDDDHCCS..",
          "..SCCHDssDHCCS..",
          "..SCCHDssDHCCS..",
          "..SCCHDssDHCCS..",
          "..SCCHDssDHCCS..",
          "..SCCHDDDDHCCS..",
          "..SCCCHHHHHCCS..",
          "..SCCCCXXXXCCS..",
          "..SCCCCXssXCCS..",
          "..SCCCCXXXXCCS..",
          "..SCCCCCCCCCCS..",
          "...SCCCCCCCCS...",
          "....SSSSSSSS....",
        ];
    }
  }

  // 5: Road (dirt path -> paved -> dashed -> lights -> crosswalk/intersection feel)
  if (kind === 5) {
    switch (L) {
      case 1:
        // compacted dirt path
        return [
          "dddddddddddddddd",
          "dddddddddddddddd",
          "dddddddddddddddd",
          "dddddddddddddddd",
          "dddddddddddddddd",
          "dddddddddddddddd",
          "dddddddddddddddd",
          "dddddddddddddddd",
          "dddddddddddddddd",
          "dddddddddddddddd",
          "dddddddddddddddd",
          "dddddddddddddddd",
          "dddddddddddddddd",
          "dddddddddddddddd",
          "dddddddddddddddd",
          "dddddddddddddddd",
        ];
      case 2:
        // paved road center stripe (dark)
        return [
          "cccccccccccccccc",
          "cccccccccccccccc",
          "cccccccccccccccc",
          "cccccccccccccccc",
          "cccccccccccccccc",
          "cccccccssccccccc",
          "cccccccssccccccc",
          "cccccccssccccccc",
          "cccccccssccccccc",
          "cccccccssccccccc",
          "cccccccssccccccc",
          "cccccccccccccccc",
          "cccccccccccccccc",
          "cccccccccccccccc",
          "cccccccccccccccc",
          "cccccccccccccccc",
        ];
      case 3:
        // dashed yellow-ish line
        return [
          "cccccccccccccccc",
          "cccccccccccccccc",
          "cccccccccccccccc",
          "cccccccccccccccc",
          "cccccccccccccccc",
          "cccccccsXccccccc",
          "cccccccscccccccc",
          "cccccccsXccccccc",
          "cccccccscccccccc",
          "cccccccsXccccccc",
          "cccccccscccccccc",
          "cccccccccccccccc",
          "cccccccccccccccc",
          "cccccccccccccccc",
          "cccccccccccccccc",
          "cccccccccccccccc",
        ];
      case 4:
        // curb outline + streetlights
        return [
          "0000000000000000",
          "0cccccccccccccc0",
          "0cccccccccccccc0",
          "0cccccccccccccc0",
          "0cccccccccccccc0",
          "0ccccccsXcccccc0",
          "0cLccccsccccLcc0",
          "0ccccccsXcccccc0",
          "0cLccccsccccLcc0",
          "0ccccccsXcccccc0",
          "0ccccccsccccccc0",
          "0cccccccccccccc0",
          "0cccccccccccccc0",
          "0cccccccccccccc0",
          "0cccccccccccccc0",
          "0000000000000000",
        ];
      case 5:
        // crosswalk blocks + lights
        return [
          "0000000000000000",
          "0cccccccccccccc0",
          "0cccccccccccccc0",
          "0cccccccccccccc0",
          "0cccccccccccccc0",
          "0ccccccsXcccccc0",
          "0cLccccsccccLcc0",
          "0cWWcWWcWWcWWcc0",
          "0cWWcWWcWWcWWcc0",
          "0cLccccsccccLcc0",
          "0ccccccsXcccccc0",
          "0cccccccccccccc0",
          "0cccccccccccccc0",
          "0cccccccccccccc0",
          "0cccccccccccccc0",
          "0000000000000000",
        ];
    }
  }

  // 6: Monument (obelisk -> statue -> temple -> castle-ish -> wonder)
  if (kind === 6) {
    switch (L) {
      case 1:
        return [
          "................",
          ".......00.......",
          "......0ss0......",
          "......0ss0......",
          "......0ss0......",
          "......0ss0......",
          "......0ss0......",
          "......0ss0......",
          ".....0ssss0.....",
          ".....0sSSs0.....",
          ".....0ssss0.....",
          "....0ssssss0....",
          "...0ssssssss0...",
          "...0ssssssss0...",
          "....00000000....",
          "................",
        ];
      case 2:
        // statue with pedestal
        return [
          "................",
          ".......00.......",
          "......0SS0......",
          "......0SS0......",
          "......0SS0......",
          "......0SS0......",
          ".....0SSSS0.....",
          ".....0SXXS0.....",
          ".....0SSSS0.....",
          "....0ssssss0....",
          "...0ssssssss0...",
          "...0sSSSSSSs0...",
          "...0sSccccSs0...",
          "...0ssssssss0...",
          "....00000000....",
          "................",
        ];
      case 3:
        // small temple with gold band
        return [
          ".....000000.....",
          "....0SSSSSS0....",
          "...0SXXXXXXS0...",
          "...0SssssssS0...",
          "...0SssSSssS0...",
          "...0SssSSssS0...",
          "...0SssSSssS0...",
          "...0SssssssS0...",
          "...0SXXXXXXS0...",
          "...0SssssssS0...",
          "...0SssddssS0...",
          "...0SssddssS0...",
          "....0ssssss0....",
          ".....0ssss0.....",
          "......0000......",
          "................",
        ];
      case 4:
        // castle-like monument
        return [
          "....00....00....",
          "...0SS0..0SS0...",
          "..0SSSS00SSSS0..",
          "..0SXXXXXXXS0..",
          "..0SssssssssS0..",
          "..0SssSSSSssS0..",
          "..0SssSBBssS0..",
          "..0SssSSSSssS0..",
          "..0SssssssssS0..",
          "..0SXXXXXXXS0..",
          "..0SssddddssS0..",
          "..0SssddddssS0..",
          "...0SssssssS0...",
          "....0ssssss0....",
          ".....000000.....",
          "................",
        ];
      case 5:
        // wonder: taller + lit + more gold
        return [
          "....00....00....",
          "...0SS0..0SS0...",
          "..0SSSS00SSSS0..",
          "..0SXXXXXXXS0...",
          "..0SHHHLHLHHS0..",
          "..0SBBLBBLBB S0..".replace(/ /g, ""), // ensure 16 chars
          "..0SCCCCCCCCS0..",
          "..0SBBLBBLBB S0..".replace(/ /g, ""),
          "..0SCCCCCCCCS0..",
          "..0SXXCXXCXXS0..",
          "..0SCCddLLCCS0..",
          "..0SCCddLLCCS0..",
          "...0SXXXXXXS0...",
          "....0ssssss0....",
          ".....000000.....",
          "................",
        ];
    }
  }

  // fallback (should not happen)
  return Array(16).fill("................");
}

/**
 * Build final sprite lines for (kind, level):
 * - Terrain base (grass/asphalt)
 * - Overlay building for that kind+level
 * - Optional micro-shadows for depth
 */
function spriteLines(kind, level) {
  const L = clampLevel(level);

  // base
  const base = baseTerrain(kind);
  const grid = makeGrid(base);

  // overlay
  const over = overlaySprite(kind, L);
  blitLines(grid, over);

  // subtle shadow pass for buildings (adds depth without changing palette)
  // Apply only to non-road, non-empty.
  if (kind !== 0 && kind !== 5 && L > 0) {
    // shadow under bottom edge of structures: put 'g' / 'd' selectively
    // (very conservative so it doesn't ruin sprites)
    for (let x = 0; x < SPR; x++) {
      // if there is a solid pixel at y=11/12, darken just below at y=13 where grass exists
      const a = grid[11][x];
      const b = grid[12][x];
      if (a !== "." || b !== ".") {
        if (grid[13][x] === "G") grid[13][x] = "g";
        if (grid[13][x] === "D") grid[13][x] = "d";
      }
    }
  }

  return toLines(grid);
}

function spriteCanvas(kind, level) {
  const L = clampLevel(level);
  const k = `${kind}:${L}`;
  const hit = cache.get(k);
  if (hit) return hit;

  const lines = spriteLines(kind, L);
  const cv = drawToCanvas(lines);
  cache.set(k, cv);
  return cv;
}

export function clearSpriteCache() {
  cache.clear();
}

/**
 * Draw one tile using sprite.
 */
export function drawSpriteTile(ctx, px, py, tilePx, kind, level) {
  // background (slightly different for empty vs occupied)
  ctx.fillStyle = kind === 0 ? "#EAF6EA" : "#F4F1EA";
  ctx.fillRect(px, py, tilePx, tilePx);

  const spr = spriteCanvas(kind, level);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(spr, px, py, tilePx, tilePx);

  // subtle grid line
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, tilePx - 1, tilePx - 1);
}
