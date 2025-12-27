// web/sprites.js

// 1x1 sprite size (Road uses this)
export const SPR = 16;

// unified palette
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
  "X": "#D9A441",   // accent
  "x": "#9D6F1E",   // dark accent

  // extra colors for new kinds
  "C": "#D0D3D6",   // concrete
  "c": "#A9ADB2",   // dark concrete
  "K": "#2A2F35",   // asphalt / dark
  "P": "#4FC3F7",   // pool water
  "p": "#1E88C8",   // deep pool
  "M": "#E85D9E",   // amusement accent (pink)
  "m": "#B83E77",   // dark amusement
  "L": "#BFE9FF",   // light glass
  "l": "#7DB9D6",   // dark glass
};

// separate caches (16x16 and 32x32)
const cache16 = new Map(); // key: kind:level
const cache32 = new Map(); // key: kind:level

function makeGrid(lines, size) {
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
  const w = grid[0]?.length ?? 0;
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  grid[y][x] = ch;
}

function rect(grid, x0, y0, w, h, ch) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) put(grid, x, y, ch);
  }
}

function hline(grid, x0, x1, y, ch) {
  for (let x = x0; x <= x1; x++) put(grid, x, y, ch);
}

function vline(grid, x, y0, y1, ch) {
  for (let y = y0; y <= y1; y++) put(grid, x, y, ch);
}

function outlineBox(grid, x0, y0, w, h) {
  hline(grid, x0, x0 + w - 1, y0, "0");
  hline(grid, x0, x0 + w - 1, y0 + h - 1, "0");
  vline(grid, x0, y0, y0 + h - 1, "0");
  vline(grid, x0 + w - 1, y0, y0 + h - 1, "0");
}

function shadeBox(grid, x0, y0, w, h, fill, shadow) {
  rect(grid, x0, y0, w, h, fill);
  // simple right/bottom shadow for depth
  for (let y = y0; y < y0 + h; y++) put(grid, x0 + w - 1, y, shadow);
  for (let x = x0; x < x0 + w; x++) put(grid, x, y0 + h - 1, shadow);
}

function drawToCanvas(lines) {
  const size = lines.length;
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

/* ----------------------------
 * 16x16 (Road / optional)
 * ---------------------------- */

function baseSprite16(kind) {
  switch (kind) {
    case 5: // Road (cobble)
      return [
        "SsSsSsSsSsSsSsSs",
        "sSsSsSsSsSsSsSsS",
        "SsSsSsSsSsSsSsSs",
        "sSsSsSsSsSsSsSsS",
        "SsSsSsSsSsSsSsSs",
        "sSsSsSsSsSsSsSsS",
        "SsSsSsSsSsSsSsSs",
        "sSsSsSsSsSsSsSsS",
        "SsSsSsSsSsSsSsSs",
        "sSsSsSsSsSsSsSsS",
        "SsSsSsSsSsSsSsSs",
        "sSsSsSsSsSsSsSsS",
        "SsSsSsSsSsSsSsSs",
        "sSsSsSsSsSsSsSsS",
        "SsSsSsSsSsSsSsSs",
        "sSsSsSsSsSsSsSsS",
      ];
    default:
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

function applyLevel16(kind, level, grid) {
  const L = Math.max(0, Math.min(5, Number(level || 0)));
  if (kind !== 5) return;

  if (L >= 2) vline(grid, 8, 0, 15, "s");
  if (L >= 3) for (let y = 0; y < 16; y += 2) put(grid, 7, y, "S");
  if (L >= 4) {
    hline(grid, 0, 15, 0, "0");
    hline(grid, 0, 15, 15, "0");
  }
  if (L >= 5) {
    for (let x = 2; x <= 13; x += 3) {
      rect(grid, x, 7, 2, 2, "W");
    }
  }
}

function spriteCanvas16(kind, level) {
  const k = `${kind}:${level}`;
  const hit = cache16.get(k);
  if (hit) return hit;

  const grid = makeGrid(baseSprite16(kind), 16);
  applyLevel16(kind, level, grid);
  const cv = drawToCanvas(toLines(grid));
  cache16.set(k, cv);
  return cv;
}

/* ----------------------------
 * 32x32 (2x2 buildings)
 * ---------------------------- */

function baseSprite32(kind) {
  switch (kind) {
    case 1: // House
      return [
        "................................",
        "..................0000..........",
        ".................0RRRR0.........",
        "................0RRRRRR0........",
        "...............0RRRRRRRR0.......",
        "..............0RRRRRRRRRR0......",
        ".............0RRRRRRRRRRRR0.....",
        "............0RRRRRRRRRRRRRR0....",
        "...........0RRRRRRRRRRRRRRRR0...",
        "..........0RRRRRRRRRRRRRRRRRR0..",
        ".........0RRRRRRRRRRRRRRRRRRRR0.",
        "........0RRRRRRRRRRRRRRRRRRRRRR0",
        ".......0RRRRRRRRRRRRRRRRRRRRRRRR0",
        "......0RRRRRRRRRRRRRRRRRRRRRRRRR0",
        ".....0RRRRRRRRRRRRRRRRRRRRRRRRRR0",
        "....0RRRRRRRRRRRRRRRRRRRRRRRRRRR0",
        "...0RRRRRRRRRRRRRRRRRRRRRRRRRRRR0",
        "....000000000000000000000000000.",
        ".....0WWWWWWWWWWWWWWWWWWWWWWW0..",
        "......0WWWWWWWWWWWWWWWWWWWWWW0..",
        ".......0WWBBWWWWWBBWWWWWBBWW0...",
        "........0WWBBWWWWWBBWWWWWBBW0...",
        ".........0WWWWWWWWWWWWWWWWWW0...",
        "..........0WWTTTTTTTTTTTTWW0....",
        "...........0WWTddTddTddTWW0.....",
        "............0WWTTTTTTTTWW0......",
        ".............000000000000.......",
        "..............DDDDDDDDDD........",
        ".............DdddddddddddD......",
        "..............DddddddddD........",
        "...............DDDDDDDD.........",
        "................................",
      ];

    case 2: // Farm
      return [
        "................................",
        "....tttttttttttttttttttttttt....",
        "....tTTTTTTTTTTTTTTTTTTTTTTt....",
        "...tTGGGGGGGGGGGGGGGGGGGGGGTt...",
        "...TGGGgGGgGGgGGgGGgGGgGGGGGGT..",
        "...TGYYYDYYYDYYYDYYYDYYYDYYYGT..",
        "...TGYDYDYDYDYDYDYDYDYDYDYYYGT..",
        "...TGYYYDYYYDYYYDYYYDYYYDYYYGT..",
        "...TGYDYDYDYDYDYDYDYDYDYDYYYGT..",
        "...TGYYYDYYYDYYYDYYYDYYYDYYYGT..",
        "...TGYDYDYDYDYDYDYDYDYDYDYYYGT..",
        "...TGYYYDYYYDYYYDYYYDYYYDYYYGT..",
        "...TGGGgGGgGGgGGgGGgGGgGGGGGGT..",
        "...tTGGGGGGGGGGGGGGGGGGGGGGTt...",
        "....tTTTTTTTTTTTTTTTTTTTTTTt....",
        "....tttttttttttttttttttttttt....",
        "...............00000000.........",
        "..............0RRRRRRRr0........",
        ".............0RRRRRRRRrr0.......",
        "............0RRRRRRRRRRrr0......",
        "...........0RRR000000RRRr0......",
        "...........0RR0WWWWWWW0Rr0......",
        "...........0R0WWBBWWBB0r0.......",
        "...........0R0WWWWWWWW0r0.......",
        "...........0R0WWTTTTWW0r0.......",
        "...........0R0WWTddTWW0r0.......",
        "...........0R0WWTddTWW0r0.......",
        "...........0R0WWTTTTWW0r0.......",
        "...........0RR0WWWWWWW0Rr0......",
        "............0RR000000RRr0.......",
        ".............0000000000........",
        "................................",
      ];

    case 3: // Workshop
      return [
        "................................",
        "...............000000...........",
        "..............0ssssss0..........",
        "..............0sSSSSs0..........",
        "..............0sS00Ss0..........",
        "..............0sS00Ss0..........",
        "..............0sSSSSs0..........",
        ".............0ssssssss0.........",
        "............0ssSSSSSSss0........",
        "...........0ssS0BB0BB0Ss0.......",
        "...........0ssSSSSSSSSss0.......",
        "...........0ssS0BB0BB0Ss0.......",
        "...........0ssSSSSSSSSss0.......",
        "...........0ssSSXXXXXXss0.......",
        "...........0ssSSSSSSSSss0.......",
        "............0ssSSSSSSss0........",
        ".............0ssssssss0.........",
        "..............00000000..........",
        ".............00......00.........",
        "............00........00........",
        "...........00....XX....00.......",
        "..........00.....XX.....00......",
        ".........00..............00.....",
        "........00....00000000....00....",
        ".......00....0ssssssss0....00...",
        "......00.....0sSSSSSSs0.....00..",
        ".....00......0sS0BB0Ss0......00.",
        ".....00......0sSSSSSSs0......00.",
        ".....00......0ssssssss0......00.",
        "......00......00000000......00..",
        ".......00..................00...",
        "................................",
      ];

    case 4: // Park
      return [
        "................................",
        "..........GGGGGGGGGGGGGG........",
        "........GGgGGGGGGGGGGGgGG.......",
        ".......GgGGGGGGGGGGGGGGgG.......",
        "......GgGGGGGGGGGGGGGGGGgG......",
        ".....GgGGGGGGGGGGGGGGGGGGgG.....",
        "....GgGGGGGGGGGGGGGGGGGGGGgG....",
        "....GgGGGGGGGGGGGGGGGGGGGGgG....",
        "....GgGGGGGGGGGGGGGGGGGGGGgG....",
        ".....GgGGGGGGGGGGGGGGGGGGgG.....",
        "......GgGGGGGGGGGGGGGGGGgG......",
        ".......GgGGGGGGGGGGGGGGgG.......",
        "........GGgGGGGGGGGGGGgGG.......",
        "..........GGGGGGGGGGGGGG........",
        "................................",
        "............DDDDDDDDDD..........",
        "...........DdddddddddddD........",
        "..........DddddBBBBBBdddD.......",
        ".........DdddBbbbbbbbbBddD......",
        ".........DddBbbbbbbbbbbBddD.....",
        ".........DddBbbbbbbbbbbBddD.....",
        ".........DdddBbbbbbbbbBddD......",
        "..........DddddBBBBBBdddD.......",
        "...........DdddddddddddD........",
        "............DDDDDDDDDD..........",
        "................................",
        ".......GGGG......DDDD......GGGG.",
        "......GgGGgG....DddddddD...GgGGgG",
        "......GGTTGG....DDDDDDD....GGTTGG",
        ".......GGGG......DDDD......GGGG.",
        "................................",
        "................................",
      ];

    case 6: // Monument
      return [
        "................................",
        "..................XX............",
        ".................0XX0...........",
        "................0ssss0..........",
        "................0ssss0..........",
        "................0sSSs0..........",
        "................0sSSs0..........",
        "................0ssss0..........",
        "................0ssss0..........",
        "...............0ssssss0.........",
        "..............0sSSSSSs0.........",
        "..............0sSSSSSs0.........",
        ".............0sssssssss0........",
        "............0sssssssssss0.......",
        "............0sSSSSSSSSSs0.......",
        "...........0sssssssssssss0......",
        "..........0ssssssssssssss0......",
        ".........0sssssssssssssss0......",
        ".........0sSSSSSSSSSSSSSs0......",
        "........0sssssssssssssssss0.....",
        ".......0ssssssssssssssssss0.....",
        ".......0sSSSSSSSSSSSSSSSs0.....",
        "......0sssssssssssssssssss0....",
        ".....0ssssssssssssssssssss0....",
        "....0sSSSSSSSSSSSSSSSSSSSs0....",
        "....00000000000000000000000....",
        ".....0SSSSSSSSSSSSSSSSSSS0.....",
        "......0SSSSSSSSSSSSSSSSS0......",
        ".......0SSSSSSSSSSSSSSS0.......",
        "........000000000000000........",
        "................................",
        "................................",
      ];

    case 7: // HighRiseCommercial
      return [
        "................................",
        ".............0000000000.........",
        "............0CCCCCCCCCC0........",
        "............0CLlLlLlLlC0........",
        "............0CLlLlLlLlC0........",
        "............0CLlLlLlLlC0........",
        "............0CLlLlLlLlC0........",
        "............0CLlLlLlLlC0........",
        "............0CLlLlLlLlC0........",
        "............0CLlLlLlLlC0........",
        "............0CLlLlLlLlC0........",
        "............0CLlLlLlLlC0........",
        "............0CLlLlLlLlC0........",
        "............0CLlLlLlLlC0........",
        "............0CLlLlLlLlC0........",
        "............0CLlLlLlLlC0........",
        "............0CLlLlLlLlC0........",
        "............0CLlLlLlLlC0........",
        "............0CLlLlLlLlC0........",
        "............0CLlLlLlLlC0........",
        "............0CLlLlLlLlC0........",
        "............0CLlLlLlLlC0........",
        "............0CLlLlLlLlC0........",
        "............0CLlLlLlLlC0........",
        "............0CLlLlLlLlC0........",
        "............0CCCCCCCCCC0........",
        "............0CWWWWWWWWC0........",
        "............0CWBWBWBWBC0........",
        "............0CWWTTTTWWC0........",
        "............0CWWTddTWWC0........",
        ".............0000000000.........",
        "................................",
      ];

    case 8: // Residential (apartment block)
      return [
        "................................",
        ".............0000000000.........",
        "............0WWWWWWWWWW0........",
        "............0WBBBBBBBBW0........",
        "............0WBBWWWWBBW0........",
        "............0WBBBBBBBBW0........",
        "............0WBBWWWWBBW0........",
        "............0WBBBBBBBBW0........",
        "............0WBBWWWWBBW0........",
        "............0WBBBBBBBBW0........",
        "............0WBBWWWWBBW0........",
        "............0WBBBBBBBBW0........",
        "............0WBBWWWWBBW0........",
        "............0WBBBBBBBBW0........",
        "............0WBBWWWWBBW0........",
        "............0WBBBBBBBBW0........",
        "............0WwwwwwwwwW0........",
        "............0WBBBBBBBBW0........",
        "............0WBBWWWWBBW0........",
        "............0WBBBBBBBBW0........",
        "............0WBBWWWWBBW0........",
        "............0WBBBBBBBBW0........",
        "............0WBBWWWWBBW0........",
        "............0WBBBBBBBBW0........",
        "............0WWWWWWWWWW0........",
        "............0WWTTTTTTWW0........",
        "............0WWTddTddWW0........",
        "............0WWTTTTTTWW0........",
        "............0WWWWWWWWWW0........",
        ".............0000000000.........",
        "............DDDDDDDDDD..........",
        "................................",
      ];

    case 9: // LuxuryHouseWithPool
      return [
        "................................",
        ".............000000000000.......",
        "............0RRRRRRRRRRRR0......",
        "...........0RRRRRRRRRRRRRR0.....",
        "..........0RRRRRRRRRRRRRRRR0....",
        ".........0RRRRRRRRRRRRRRRRRR0...",
        "..........000000000000000000....",
        "..........0WWWWWWWWWWWWWWWW0....",
        "..........0WBBWWBBWWBBWWBBW0....",
        "..........0WWWWWWWWWWWWWWWW0....",
        "..........0WWTTTTTTTTTTTTWW0....",
        "..........0WWTddTddTddTddWW0....",
        "..........0WWTTTTTTTTTTTTWW0....",
        "..........0WWWWWWWWWWWWWWWW0....",
        "..........000000000000000000....",
        "..........DDDDDDDDDDDDDDDD......",
        "...........DDDDDDDDDDDDDD.......",
        ".............0000000000.........",
        "............0PPPPPPPPPP0........",
        "............0PppppppppP0........",
        "............0PppPPPPppP0........",
        "............0PppPPPPppP0........",
        "............0PppppppppP0........",
        "............0PPPPPPPPPP0........",
        ".............0000000000.........",
        "..............GGGGGGGG..........",
        ".............GgGGGGGGgG.........",
        ".............GGTTGGTTGG.........",
        "..............GGGGGGGG..........",
        "................................",
        "................................",
        "................................",
      ];

    case 10: // LargePark (bigger greenery + pond + paths)
      return [
        "................................",
        "........GGGGGGGGGGGGGGGG........",
        "......GGgGGGGGGGGGGGGGGgGG......",
        ".....GgGGGGGGGGGGGGGGGGGGgG.....",
        "....GgGGGGGGGGGGGGGGGGGGGGgG....",
        "....GgGGGGGGGGGGGGGGGGGGGGgG....",
        "....GgGGGGGGGGGGGGGGGGGGGGgG....",
        ".....GgGGGGGGGGGGGGGGGGGGgG.....",
        "......GGgGGGGGGGGGGGGGGgGG......",
        "........GGGGGGGGGGGGGGGG........",
        "................................",
        "...........DDDDDDDDDD...........",
        "..........DdddddddddddD.........",
        ".........DdddBBBBBBBBddD........",
        "........DddBbbbbbbbbbbBddD......",
        "........DddBbbbbbbbbbbBddD......",
        "........DddBbbbbbbbbbbBddD......",
        "........DddBbbbbbbbbbbBddD......",
        ".........DdddBBBBBBBBddD........",
        "..........DdddddddddddD.........",
        "...........DDDDDDDDDD...........",
        "................................",
        "....GGTTGG......DD......GGTTGG..",
        "...GgGGGGgG....DddD....GgGGGGgG.",
        "...GGGGGGGG....DDDD....GGGGGGGG.",
        "...GgGGGGgG............GgGGGGgG.",
        "....GGTTGG..............GGTTGG..",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
      ];

    case 11: // AmusementPark (gate + ferris wheel vibe)
      return [
        "................................",
        ".............0000000000.........",
        "............0MMMMMMMMMM0........",
        "............0MmmmmmmmmM0........",
        "............0Mm000000mM0........",
        "............0Mm0XXXX0mM0........",
        "............0Mm0XXXX0mM0........",
        "............0Mm000000mM0........",
        "............0MmmmmmmmmM0........",
        "............0MMMMMMMMMM0........",
        ".............0000000000.........",
        "................................",
        "..............GGGGGG............",
        ".............GgGGGGgG...........",
        ".............GGGGGGGG...........",
        "..............GGGGGG............",
        ".............00000000...........",
        "............0ssssssss0..........",
        "............0sSBBBBSs0..........",
        "............0sBBlLBbs0..........",
        "............0sBBlLBbs0..........",
        "............0sSBBBBSs0..........",
        "............0ssssssss0..........",
        ".............00000000...........",
        "...............DDDD.............",
        "..............DddddD............",
        ".............DddDDddD...........",
        ".............DddDDddD...........",
        "..............DddddD............",
        "...............DDDD.............",
        "................................",
        "................................",
      ];

    default:
      return Array.from({ length: 32 }, () => ".".repeat(32));
  }
}

function applyLevel32(kind, level, grid) {
  const L = Math.max(0, Math.min(5, Number(level || 0)));

  switch (kind) {
    case 1: { // House
      if (L >= 2) {
        rect(grid, 9, 20, 4, 3, "B");
        rect(grid, 19, 20, 4, 3, "B");
      }
      if (L >= 3) {
        rect(grid, 12, 27, 8, 3, "T");
        outlineBox(grid, 12, 27, 8, 3);
      }
      if (L >= 4) {
        rect(grid, 24, 4, 3, 8, "s");
        outlineBox(grid, 24, 4, 3, 8);
        put(grid, 25, 3, "r");
      }
      if (L >= 5) {
        hline(grid, 6, 26, 19, "w");
        rect(grid, 14, 15, 4, 3, "B");
      }
      return;
    }

    case 2: { // Farm
      if (L >= 2) {
        for (let y = 4; y < 12; y += 1) {
          for (let x = 5; x < 27; x += 2) put(grid, x, y, (x + y) % 2 ? "Y" : "y");
        }
      }
      if (L >= 3) rect(grid, 14, 14, 4, 2, "T");
      if (L >= 4) {
        rect(grid, 26, 18, 4, 10, "S");
        outlineBox(grid, 26, 17, 4, 12);
      }
      if (L >= 5) {
        rect(grid, 4, 20, 7, 4, "X");
        outlineBox(grid, 4, 20, 7, 4);
      }
      return;
    }

    case 7: { // HighRiseCommercial: more neon / lobby at higher levels
      if (L >= 2) {
        hline(grid, 12, 19, 27, "X");
      }
      if (L >= 3) {
        rect(grid, 12, 3, 8, 1, "X"); // sign
      }
      if (L >= 4) {
        vline(grid, 15, 3, 24, "c"); // central spine
        vline(grid, 16, 3, 24, "c");
      }
      if (L >= 5) {
        rect(grid, 13, 1, 6, 1, "X");
        rect(grid, 13, 2, 6, 1, "x");
      }
      return;
    }

    case 8: { // Residential: balconies + extra lights
      if (L >= 2) {
        hline(grid, 12, 19, 16, "w");
        hline(grid, 12, 19, 20, "w");
      }
      if (L >= 3) {
        for (let y = 4; y < 22; y += 4) {
          rect(grid, 8, y, 2, 1, "T");
          rect(grid, 22, y, 2, 1, "T");
        }
      }
      if (L >= 4) {
        rect(grid, 14, 25, 4, 2, "T"); // entrance canopy
        outlineBox(grid, 14, 25, 4, 2);
      }
      if (L >= 5) {
        rect(grid, 3, 29, 26, 1, "D"); // sidewalk
      }
      return;
    }

    case 9: { // LuxuryHouseWithPool: add pool lights / deck
      if (L >= 2) {
        rect(grid, 12, 17, 8, 1, "T");
        rect(grid, 12, 24, 8, 1, "T");
      }
      if (L >= 3) {
        put(grid, 10, 19, "X");
        put(grid, 21, 19, "X");
        put(grid, 10, 22, "X");
        put(grid, 21, 22, "X");
      }
      if (L >= 4) {
        rect(grid, 5, 8, 4, 3, "B"); // extra windows
      }
      if (L >= 5) {
        rect(grid, 22, 8, 4, 3, "B"); // extra windows
        hline(grid, 2, 29, 15, "D");
      }
      return;
    }

    case 10: { // LargePark: add gazebo / statue at higher levels
      if (L >= 2) {
        rect(grid, 14, 2, 4, 2, "T");
        outlineBox(grid, 14, 2, 4, 2);
      }
      if (L >= 3) {
        rect(grid, 15, 4, 2, 3, "S");
        outlineBox(grid, 15, 4, 2, 3);
      }
      if (L >= 4) {
        rect(grid, 6, 24, 6, 3, "D");
        rect(grid, 20, 24, 6, 3, "D");
      }
      if (L >= 5) {
        rect(grid, 12, 26, 8, 2, "T");
        outlineBox(grid, 12, 26, 8, 2);
      }
      return;
    }

    case 11: { // AmusementPark: add more lights / wheel details
      if (L >= 2) {
        for (let x = 12; x <= 19; x += 2) put(grid, x, 2, "X");
      }
      if (L >= 3) {
        rect(grid, 14, 17, 4, 4, "L");
        rect(grid, 15, 18, 2, 2, "l");
      }
      if (L >= 4) {
        put(grid, 13, 19, "X");
        put(grid, 18, 19, "X");
        put(grid, 16, 17, "X");
        put(grid, 16, 22, "X");
      }
      if (L >= 5) {
        hline(grid, 10, 21, 24, "X");
        hline(grid, 10, 21, 25, "x");
      }
      return;
    }

    default:
      return;
  }
}

function spriteCanvas32(kind, level) {
  const k = `${kind}:${level}`;
  const hit = cache32.get(k);
  if (hit) return hit;

  const grid = makeGrid(baseSprite32(kind), 32);
  applyLevel32(kind, level, grid);
  const cv = drawToCanvas(toLines(grid));
  cache32.set(k, cv);
  return cv;
}

/* ----------------------------
 * Public API
 * ---------------------------- */

export function clearSpriteCache() {
  cache16.clear();
  cache32.clear();
}

export function drawGround(ctx, px, py, tilePx) {
  ctx.fillStyle = "#EAF6EA";
  ctx.fillRect(px, py, tilePx, tilePx);

  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, tilePx - 1, tilePx - 1);
}

export function drawSprite1x1(ctx, px, py, tilePx, kind, level) {
  const spr = spriteCanvas16(kind, level);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(spr, px, py, tilePx, tilePx);
}

export function drawBuilding2x2(ctx, px, py, tilePx, kind, level) {
  const spr = spriteCanvas32(kind, level);
  ctx.imageSmoothingEnabled = false;

  const w = tilePx * 2;
  const h = tilePx * 2;

  ctx.drawImage(spr, px, py, w, h);
}
