// web/sprites.js
export const SPR = 16;

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

// cache: kind:level -> canvas
const cache = new Map();

function makeGrid(lines) {
  // 16x16 char grid
  const g = Array.from({ length: SPR }, (_, y) => {
    const row = (lines[y] || "").padEnd(SPR, ".").slice(0, SPR);
    return row.split("");
  });
  return g;
}

function toLines(grid) {
  return grid.map(r => r.join(""));
}

function put(grid, x, y, ch) {
  if (x < 0 || y < 0 || x >= SPR || y >= SPR) return;
  grid[y][x] = ch;
}

function rect(grid, x0, y0, w, h, ch) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) put(grid, x, y, ch);
}

function outlineBox(grid, x0, y0, w, h) {
  for (let x = x0; x < x0 + w; x++) { put(grid, x, y0, "0"); put(grid, x, y0 + h - 1, "0"); }
  for (let y = y0; y < y0 + h; y++) { put(grid, x0, y, "0"); put(grid, x0 + w - 1, y, "0"); }
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
 * kind: 0 empty, 1 house, 2 farm, 3 workshop, 4 park, 5 road, 6 monument
 */
function baseSprite(kind) {
  switch (kind) {
    case 1: // House (cottage base)
      return [
        "................",
        "......0000......",
        ".....0RRR0......",
        "....0RRRRR0.....",
        "...0RRRRRRR0....",
        "...0WWWWWWW0....",
        "...0WWBWWWW0....",
        "...0WWWWBWW0....",
        "...0WWTTTTW0....",
        "...0WWTddTW0....",
        "...0WWTddTW0....",
        "...0WWTTTTW0....",
        "....0000000.....",
        "................",
        "................",
        "................",
      ];
    case 2: // Farm (field + barn)
      return [
        "................",
        "..GGGGGGGGGGGG..",
        ".GgGGgGGgGGgGGg.",
        ".GDDDDDDDDDDDDG.",
        ".GDYDYDYDYDYDYDG",
        ".GDDDDDDDDDDDDG.",
        ".GDYDYDYDYDYDYDG",
        ".GDDDDDDDDDDDDG.",
        ".GgGGgGGgGGgGGg.",
        "..GGGGGGGGGGGG..",
        "......0000......",
        ".....0RRR0......",
        ".....0WWW0......",
        ".....0WTd0......",
        "......0000......",
        "................",
      ];
    case 3: // Workshop (factory)
      return [
        "................",
        "....00000000....",
        "...0ssssssss0...",
        "..0ssSSSSSSss0..",
        "..0ssS0B0B0Ss0..",
        "..0ssSSSSSSss0..",
        "..0ssS0B0B0Ss0..",
        "..0ssSSSSSSss0..",
        "..0ssSSSSSSss0..",
        "..0ssSSXXSSss0..",
        "..0ssSSSSSSss0..",
        "...0ssssssss0...",
        "....00000000....",
        ".......00.......",
        ".......00.......",
        "................",
      ];
    case 4: // Park (tree + bench)
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
    case 5: // Road (cobble)
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
    case 6: // Monument (obelisk)
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
    default: // Empty grass
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
}

function applyLevel(kind, level, grid) {
  const L = Math.max(0, Math.min(5, Number(level || 0)));

  switch (kind) {
    case 1: { // House:
      if (L >= 2) { put(grid, 7, 6, "B"); put(grid, 8, 6, "b"); }          // window trim
      if (L >= 3) { put(grid, 10, 7, "B"); put(grid, 5, 7, "B"); }         // more windows
      if (L >= 4) { rect(grid, 11, 1, 1, 3, "s"); put(grid, 11, 0, "0"); } // chimney
      if (L >= 5) { // second-floor line
        for (let x = 4; x <= 10; x++) put(grid, x, 7, "w");
      }
      return;
    }
    case 2: { // Farm:
      if (L >= 2) { // more wheat
        for (let y = 4; y <= 7; y++) for (let x = 3; x <= 12; x += 2) put(grid, x, y, "Y");
      }
      if (L >= 3) { // fence
        for (let x = 2; x <= 13; x++) { put(grid, x, 2, "T"); put(grid, x, 9, "T"); }
        for (let y = 2; y <= 9; y++) { put(grid, 2, y, "T"); put(grid, 13, y, "T"); }
      }
      if (L >= 4) { // barn roof darker
        put(grid, 7, 11, "r"); put(grid, 8, 11, "r");
      }
      if (L >= 5) { // silo near barn
        outlineBox(grid, 1, 10, 3, 5);
        rect(grid, 2, 11, 1, 3, "s");
      }
      return;
    }
    case 3: { // Workshop:
      if (L >= 2) { rect(grid, 2, 2, 1, 9, "s"); rect(grid, 3, 2, 1, 9, "S"); } // side column
      if (L >= 3) { // smokestack
        outlineBox(grid, 12, 1, 3, 7);
        rect(grid, 13, 2, 1, 5, "s");
      }
      if (L >= 4) { // crane arm
        for (let x = 8; x <= 15; x++) put(grid, x, 1, "X");
        put(grid, 15, 2, "X");
      }
      if (L >= 5) { // extra windows
        put(grid, 6, 4, "B"); put(grid, 9, 4, "B");
        put(grid, 6, 6, "B"); put(grid, 9, 6, "B");
      }
      return;
    }
    case 4: { // Park:
      if (L >= 2) { put(grid, 4, 12, "Y"); put(grid, 11, 12, "Y"); }
      if (L >= 3) { // path
        for (let y = 5; y <= 13; y++) put(grid, 8, y, "D");
      }
      if (L >= 4) { // fountain
        outlineBox(grid, 6, 7, 5, 5);
        put(grid, 8, 9, "B");
      }
      if (L >= 5) { // more flowers
        put(grid, 3, 4, "Y"); put(grid, 12, 4, "Y");
        put(grid, 3, 10, "Y"); put(grid, 12, 10, "Y");
      }
      return;
    }
    case 5: { // Road:
      if (L >= 2) { for (let y = 0; y < SPR; y++) put(grid, 7, y, "s"); }
      if (L >= 3) { for (let y = 0; y < SPR; y += 2) put(grid, 8, y, "X"); } // dashed line
      if (L >= 4) { for (let x = 0; x < SPR; x++) { put(grid, x, 0, "0"); put(grid, x, 15, "0"); } } // curb
      if (L >= 5) { // crosswalk
        for (let x = 2; x <= 13; x += 2) { put(grid, x, 7, "W"); put(grid, x, 8, "W"); }
      }
      return;
    }
    case 6: { // Monument:
      if (L >= 2) { outlineBox(grid, 3, 13, 10, 3); rect(grid, 4, 14, 8, 1, "S"); }
      if (L >= 3) { put(grid, 7, 2, "X"); put(grid, 8, 2, "X"); } // gold band
      if (L >= 4) { put(grid, 7, 0, "X"); put(grid, 8, 0, "X"); } // top ornament
      if (L >= 5) { // wider base
        outlineBox(grid, 2, 12, 12, 4);
      }
      return;
    }
    default:
      return;
  }
}

function spriteCanvas(kind, level) {
  const k = `${kind}:${level}`;
  const hit = cache.get(k);
  if (hit) return hit;

  const grid = makeGrid(baseSprite(kind));
  applyLevel(kind, level, grid);
  const lines = toLines(grid);
  const cv = drawToCanvas(lines);
  cache.set(k, cv);
  return cv;
}

export function clearSpriteCache() {
  cache.clear();
}

/**
 */
export function drawSpriteTile(ctx, px, py, tilePx, kind, level) {
  ctx.fillStyle = (kind === 0) ? "#EAF6EA" : "#F4F1EA";
  ctx.fillRect(px, py, tilePx, tilePx);

  const spr = spriteCanvas(kind, level);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(spr, px, py, tilePx, tilePx);

  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, tilePx - 1, tilePx - 1);
}
