// web/sprites.js

// 1x1 sprite size (Road uses this)
export const SPR = 16;

// unified palette
const PAL = {
  ".": null,        // transparent
  "0": "#1B1B1B",   // outline (near-black)

  // terrain
  "G": "#7FCB8A",   // grass
  "g": "#5EAF6B",   // dark grass
  "D": "#C9A26A",   // dirt
  "d": "#9B7B4C",   // dark dirt
  "S": "#B9B9B9",   // stone
  "s": "#8F8F8F",   // dark stone

  // building basics
  "W": "#E9E1D2",   // wall
  "w": "#CFC4B2",   // dark wall
  "R": "#C15A52",   // roof
  "r": "#8F3C37",   // dark roof
  "B": "#6FB6FF",   // window
  "b": "#2D6FA7",   // dark window
  "T": "#7A5A3A",   // wood
  "t": "#5A422B",   // dark wood

  // farm / accent
  "Y": "#E7D46D",   // wheat
  "y": "#C8AF3F",   // dark wheat
  "X": "#D9A441",   // accent
  "x": "#9D6F1E",   // dark accent

  // modern / luxury
  "C": "#D0D3D6",   // concrete
  "c": "#A9ADB2",   // dark concrete
  "K": "#2A2F35",   // asphalt / very dark
  "L": "#BFE9FF",   // light glass
  "l": "#7DB9D6",   // dark glass

  // pool / amusement
  "P": "#4FC3F7",   // pool water
  "p": "#1E88C8",   // deep pool
  "M": "#E85D9E",   // amusement accent (pink)
  "m": "#B83E77",   // dark amusement

  // level color ramp (Monument / Residential)
  // 1..9 + A (10)
  "1": "#101215",   // black
  "2": "#5A3A22",   // brown
  "3": "#D17A2B",   // orange
  "4": "#C13B3B",   // red
  "5": "#E85DA0",   // pink
  "6": "#4EAD62",   // green
  "7": "#F2F4F6",   // white
  "8": "#B26A3C",   // bronze
  "9": "#D6B86A",   // gold (soft)
  "A": "#F2D35B",   // gold (bright)
};

// separate caches (16x16 and 32x32)
const cache16 = new Map(); // key: kind:level
const cache32 = new Map(); // key: kind:level

function clampLevel(level, max = 10) {
  const n = Number(level || 0);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(max, Math.floor(n)));
}

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

function outlineBox(grid, x0, y0, w, h, ch = "0") {
  hline(grid, x0, x0 + w - 1, y0, ch);
  hline(grid, x0, x0 + w - 1, y0 + h - 1, ch);
  vline(grid, x0, y0, y0 + h - 1, ch);
  vline(grid, x0 + w - 1, y0, y0 + h - 1, ch);
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

function rampChar10(L) {
  // L: 1..10
  const map = ["1","2","3","4","5","6","7","8","9","A"];
  return map[Math.max(1, Math.min(10, L)) - 1];
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
  const L = clampLevel(level, 10);
  if (kind !== 5) return;

  // Road: keep subtle improvements only (optional)
  if (L >= 3) vline(grid, 8, 0, 15, "s");
  if (L >= 5) for (let y = 0; y < 16; y += 2) put(grid, 7, y, "S");
  if (L >= 7) {
    hline(grid, 0, 15, 0, "0");
    hline(grid, 0, 15, 15, "0");
  }
  if (L >= 9) {
    for (let x = 2; x <= 13; x += 3) rect(grid, x, 7, 2, 2, "W");
  }
}

function spriteCanvas16(kind, level) {
  const L = clampLevel(level, 10);
  const k = `${kind}:${L}`;
  const hit = cache16.get(k);
  if (hit) return hit;

  const grid = makeGrid(baseSprite16(kind), 16);
  applyLevel16(kind, L, grid);
  const cv = drawToCanvas(toLines(grid));
  cache16.set(k, cv);
  return cv;
}

/* ----------------------------
 * 32x32 (2x2 buildings)
 * - Now driven mostly by procedural drawing for grades 1..10
 * ---------------------------- */

function baseGround32(kind) {
  // cleaner grass base + faint texture
  const lines = Array.from({ length: 32 }, (_, y) => {
    let row = "";
    for (let x = 0; x < 32; x++) {
      const v = (x * 7 + y * 11) % 13;
      row += v === 0 ? "g" : "G";
    }
    return row;
  });

  // give park kinds extra green base
  if (kind === 4 || kind === 10) {
    for (let y = 0; y < 32; y++) {
      lines[y] = lines[y].split("").map((ch, x) => ((x + y) % 9 === 0 ? "g" : ch)).join("");
    }
  }
  return lines;
}

function drawFence(grid, x0, y0, w, h) {
  outlineBox(grid, x0, y0, w, h, "t");
  for (let x = x0 + 1; x < x0 + w - 1; x += 3) {
    vline(grid, x, y0 + 1, y0 + h - 2, "T");
  }
}

function drawWindows(grid, x0, y0, w, h, spacingX = 3, spacingY = 3) {
  for (let y = y0; y < y0 + h; y += spacingY) {
    for (let x = x0; x < x0 + w; x += spacingX) {
      put(grid, x, y, "B");
      if ((x + y) % 2 === 0) put(grid, x, y, "L"); // occasional glass sparkle
    }
  }
}

function drawDoor(grid, x, y, w = 4, h = 5) {
  rect(grid, x, y, w, h, "T");
  outlineBox(grid, x, y, w, h, "0");
  put(grid, x + 1, y + Math.floor(h / 2), "x");
}

function drawTree(grid, cx, cy, size = 1) {
  // canopy
  const r = 2 + size;
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d = Math.abs(x) + Math.abs(y);
      if (d <= r + (size > 2 ? 1 : 0)) {
        put(grid, cx + x, cy + y, (x + y) % 3 === 0 ? "g" : "G");
      }
    }
  }
  // trunk
  rect(grid, cx - 1, cy + r - 1, 2, 4, "t");
  rect(grid, cx - 1, cy + r - 1, 1, 4, "T");
}

function drawCow(grid, x0, y0, w, h, spotDensity = 0.25) {
  // body (white)
  rect(grid, x0, y0, w, h, "7"); // white ramp char
  outlineBox(grid, x0, y0, w, h, "0");

  // head nub
  rect(grid, x0 + w - 3, y0 + 2, 3, 3, "7");
  outlineBox(grid, x0 + w - 3, y0 + 2, 3, 3, "0");

  // legs
  const legY = y0 + h;
  for (let lx = x0 + 1; lx < x0 + w - 1; lx += Math.max(2, Math.floor(w / 3))) {
    put(grid, lx, legY, "2");     // brown-ish
    put(grid, lx, legY + 1, "1"); // dark
  }

  // spots
  for (let y = y0 + 1; y < y0 + h - 1; y++) {
    for (let x = x0 + 1; x < x0 + w - 1; x++) {
      const v = (x * 17 + y * 29) % 100;
      if (v < spotDensity * 100) put(grid, x, y, "1"); // black
    }
  }

  // eyes
  put(grid, x0 + w - 2, y0 + 3, "1");
}

function drawPool(grid, x0, y0, w, h) {
  rect(grid, x0, y0, w, h, "P");
  // depth
  rect(grid, x0 + 1, y0 + 1, w - 2, h - 2, "p");
  // highlight
  for (let x = x0 + 2; x < x0 + w - 2; x += 3) put(grid, x, y0 + 1, "L");
  outlineBox(grid, x0, y0, w, h, "0");
}

function drawSwimmer(grid, cx, cy) {
  // tiny swimmer: head + arms
  put(grid, cx, cy, "7");        // head
  put(grid, cx - 1, cy + 1, "7");
  put(grid, cx + 1, cy + 1, "7");
  put(grid, cx, cy + 1, "M");    // floaty
}

function drawFerrisWheel(grid, cx, cy, r) {
  // rim
  for (let a = 0; a < 360; a += 15) {
    const rad = (a * Math.PI) / 180;
    const x = Math.round(cx + Math.cos(rad) * r);
    const y = Math.round(cy + Math.sin(rad) * r);
    put(grid, x, y, "M");
  }
  // spokes
  for (let a = 0; a < 360; a += 45) {
    const rad = (a * Math.PI) / 180;
    const x = Math.round(cx + Math.cos(rad) * r);
    const y = Math.round(cy + Math.sin(rad) * r);
    // simple line to center
    const steps = r;
    for (let i = 0; i <= steps; i++) {
      const px = Math.round(cx + (x - cx) * (i / steps));
      const py = Math.round(cy + (y - cy) * (i / steps));
      put(grid, px, py, "m");
    }
  }
  // hub
  rect(grid, cx - 1, cy - 1, 3, 3, "X");
  outlineBox(grid, cx - 1, cy - 1, 3, 3, "0");

  // base supports
  vline(grid, cx - 3, cy + r - 1, cy + r + 6, "0");
  vline(grid, cx + 3, cy + r - 1, cy + r + 6, "0");
  hline(grid, cx - 6, cx + 6, cy + r + 6, "K");
}

function baseSprite32(kind) {
  // start with ground; drawings are applied in applyLevel32
  return baseGround32(kind);
}

function applyLevel32(kind, level, grid) {
  const L = clampLevel(level, 10);

  // common: base pad/sidewalk for buildings (not parks)
  function addPad(x0, y0, w, h) {
    rect(grid, x0, y0, w, h, "D");
    rect(grid, x0 + 1, y0 + 1, w - 2, h - 2, "d");
    outlineBox(grid, x0, y0, w, h, "0");
  }

  // HOUSE: grades 1..10 get more luxurious
  function drawHouse() {
    addPad(6, 22, 20, 8);

    const bodyX = 8, bodyY = 12, bodyW = 16, bodyH = 12;
    const wall = L >= 6 ? "W" : "w";
    shadeBox(grid, bodyX, bodyY, bodyW, bodyH, wall, "w");
    outlineBox(grid, bodyX, bodyY, bodyW, bodyH);

    // roof upgrades
    const roofH = 7 + Math.floor(L / 3);
    const roofY = bodyY - roofH;
    for (let i = 0; i < roofH; i++) {
      const inset = Math.max(0, Math.floor(i * 1.1));
      hline(grid, bodyX + inset, bodyX + bodyW - 1 - inset, roofY + i, L >= 7 ? "R" : "r");
    }
    outlineBox(grid, bodyX + 1, roofY + 1, bodyW - 2, roofH - 1, "0");

    // windows count/shine
    const win = L >= 5 ? "L" : "B";
    const rows = L >= 8 ? 2 : 1;
    for (let ry = 0; ry < rows; ry++) {
      const y = bodyY + 3 + ry * 4;
      rect(grid, bodyX + 2, y, 3, 3, win);
      rect(grid, bodyX + 11, y, 3, 3, win);
      outlineBox(grid, bodyX + 2, y, 3, 3);
      outlineBox(grid, bodyX + 11, y, 3, 3);
    }

    // door + porch
    drawDoor(grid, bodyX + 6, bodyY + 7, 4, 5);
    if (L >= 4) {
      rect(grid, bodyX + 4, bodyY + 11, 8, 1, "T"); // porch
      outlineBox(grid, bodyX + 4, bodyY + 11, 8, 2, "0");
    }

    // chimney / garden / driveway
    if (L >= 3) {
      rect(grid, bodyX + 12, roofY + 2, 2, 5, "s");
      outlineBox(grid, bodyX + 12, roofY + 2, 2, 5, "0");
    }
    if (L >= 6) drawTree(grid, 6, 12, 1);
    if (L >= 9) {
      rect(grid, 24, 24, 6, 3, "C"); // driveway
      outlineBox(grid, 24, 24, 6, 3, "0");
      rect(grid, 2, 25, 3, 2, "M"); // flower bed
    }
  }

  // FARM: grade 1..10 cows grow bigger
  function drawFarm() {
    // pasture
    drawFence(grid, 3, 7, 26, 16);
    // field stripes
    for (let y = 9; y < 20; y++) {
      for (let x = 5; x < 27; x++) put(grid, x, y, (x + y) % 4 === 0 ? "g" : "G");
      if (y % 3 === 0) hline(grid, 5, 27, y, "Y");
    }

    // barn (small)
    addPad(18, 22, 12, 8);
    rect(grid, 20, 16, 9, 7, "r");
    outlineBox(grid, 20, 16, 9, 7, "0");
    rect(grid, 21, 18, 7, 5, "W");
    outlineBox(grid, 21, 18, 7, 5, "0");
    rect(grid, 23, 20, 3, 3, "T");
    outlineBox(grid, 23, 20, 3, 3, "0");

    // cow scaling
    const cowScale = L; // 1..10
    // map to size within fence
    const w = Math.min(14, 4 + Math.floor(cowScale * 1.0));
    const h = Math.min(9, 3 + Math.floor(cowScale * 0.6));
    const x0 = 6 + Math.floor((12 - w) / 2);
    const y0 = 12 + Math.floor((7 - h) / 2);
    const density = 0.18 + (cowScale / 10) * 0.22;
    drawCow(grid, x0, y0, w, h, density);

    // hay bales at higher grades
    if (L >= 4) {
      rect(grid, 6, 23, 5, 3, "Y");
      outlineBox(grid, 6, 23, 5, 3, "0");
    }
    if (L >= 8) {
      rect(grid, 12, 24, 5, 3, "y");
      outlineBox(grid, 12, 24, 5, 3, "0");
    }
  }

  // WORKSHOP: company building 1..10 floors
  function drawWorkshop() {
    addPad(5, 24, 22, 6);

    // building footprint
    const x0 = 7, w = 18;
    const maxFloors = 10;
    const floors = Math.max(1, Math.min(maxFloors, L));
    const floorH = 2;              // each floor = 2px
    const baseY = 28;              // ground contact
    const height = floors * floorH + 6; // include lobby/roof
    const y0 = Math.max(2, baseY - height);

    // body
    rect(grid, x0, y0, w, height, "C");
    outlineBox(grid, x0, y0, w, height, "0");
    // shadow edge
    vline(grid, x0 + w - 1, y0, y0 + height - 1, "c");
    hline(grid, x0, x0 + w - 1, y0 + height - 1, "c");

    // floor separators
    for (let f = 1; f <= floors; f++) {
      const yy = baseY - (f * floorH);
      hline(grid, x0 + 1, x0 + w - 2, yy, "c");
    }

    // windows per floor
    for (let f = 0; f < floors; f++) {
      const yy = baseY - (f * floorH) - 1;
      for (let x = x0 + 2; x <= x0 + w - 3; x += 3) {
        put(grid, x, yy, f % 2 === 0 ? "B" : "L");
      }
    }

    // lobby door + sign
    drawDoor(grid, x0 + 7, baseY - 4, 4, 5);
    rect(grid, x0 + 2, y0 + 2, w - 4, 2, "X");
    outlineBox(grid, x0 + 2, y0 + 2, w - 4, 2, "0");

    // rooftop details
    if (L >= 5) {
      rect(grid, x0 + 2, y0 - 1, w - 4, 1, "K");
      outlineBox(grid, x0 + 2, y0 - 1, w - 4, 2, "0");
    }
    if (L >= 8) {
      rect(grid, x0 + w - 5, y0 + 1, 3, 5, "s"); // HVAC
      outlineBox(grid, x0 + w - 5, y0 + 1, 3, 5, "0");
    }
  }

  // PARK: just make it pretty; no level effect
  function drawPark() {
    // curved path + pond + benches
    // path
    for (let y = 8; y < 30; y++) {
      const x = 6 + Math.floor((y - 8) * 0.25);
      rect(grid, x, y, 10, 2, "D");
      rect(grid, x + 1, y + 1, 8, 1, "d");
    }
    // pond
    drawPool(grid, 18, 10, 10, 7);
    // trees
    drawTree(grid, 8, 10, 1);
    drawTree(grid, 10, 18, 2);
    drawTree(grid, 26, 22, 1);
    // bench
    rect(grid, 9, 25, 6, 2, "T");
    hline(grid, 9, 14, 26, "t");
    outlineBox(grid, 9, 25, 6, 2, "0");
  }

  // MONUMENT: color shifts with level (1..10)
  function drawMonument() {
    addPad(10, 24, 12, 6);
    const ch = rampChar10(L);

    // plinth
    rect(grid, 10, 21, 12, 4, ch);
    outlineBox(grid, 10, 21, 12, 4, "0");

    // column
    rect(grid, 14, 8, 4, 13, ch);
    outlineBox(grid, 14, 8, 4, 13, "0");

    // top
    rect(grid, 12, 6, 8, 3, ch);
    outlineBox(grid, 12, 6, 8, 3, "0");

    // gem / flame accent grows
    if (L >= 4) rect(grid, 15, 3, 2, 3, "X");
    if (L >= 7) {
      put(grid, 14, 2, "X");
      put(grid, 17, 2, "X");
      put(grid, 15, 1, "X");
      put(grid, 16, 1, "x");
    }
    if (L >= 9) {
      // laurels
      rect(grid, 11, 19, 3, 2, "G");
      rect(grid, 18, 19, 3, 2, "G");
    }
  }

  // HighRiseCommercial: L1..7 = 4..10 floors. L8..10 = 2..4 towers.
  function drawHighRiseCommercial() {
    addPad(4, 26, 24, 4);

    const towers = L <= 7 ? 1 : (L === 8 ? 2 : (L === 9 ? 3 : 4));
    const floors = L <= 7 ? (3 + L) : 10; // 4..10, else 10
    const floorH = 2;
    const height = floors * floorH + 4;
    const baseY = 28;
    const y0 = Math.max(2, baseY - height);

    const totalW = 24;
    const gap = towers > 1 ? 1 : 0;
    const towerW = Math.floor((totalW - gap * (towers - 1)) / towers);

    for (let i = 0; i < towers; i++) {
      const x0 = 4 + i * (towerW + gap);
      // body
      rect(grid, x0, y0, towerW, height, "C");
      outlineBox(grid, x0, y0, towerW, height, "0");
      vline(grid, x0 + towerW - 1, y0, y0 + height - 1, "c");
      hline(grid, x0, x0 + towerW - 1, y0 + height - 1, "c");

      // glass windows
      for (let f = 0; f < floors; f++) {
        const yy = baseY - (f * floorH) - 1;
        for (let x = x0 + 1; x <= x0 + towerW - 2; x += 2) {
          put(grid, x, yy, (x + yy) % 3 === 0 ? "l" : "L");
        }
      }

      // neon sign on front at higher levels
      if (L >= 3) {
        const sx = x0 + 1;
        const sw = Math.max(3, towerW - 2);
        rect(grid, sx, y0 + 1, sw, 1, "X");
        if (L >= 6) rect(grid, sx, y0 + 2, sw, 1, "x");
      }

      // lobby
      rect(grid, x0 + 1, baseY - 3, towerW - 2, 3, "c");
      outlineBox(grid, x0 + 1, baseY - 3, towerW - 2, 3, "0");
    }
  }

  // Residential: color shifts with level (1..10)
  function drawResidential() {
    addPad(6, 26, 20, 4);
    const ch = rampChar10(L);

    const x0 = 8, w = 16;
    const floors = 6 + Math.floor(L / 2); // 6..11ish
    const floorH = 2;
    const height = Math.min(26, floors * floorH + 4);
    const baseY = 28;
    const y0 = Math.max(2, baseY - height);

    rect(grid, x0, y0, w, height, ch);
    outlineBox(grid, x0, y0, w, height, "0");

    // balconies / rails
    for (let y = y0 + 4; y < baseY - 2; y += 4) {
      hline(grid, x0 + 1, x0 + w - 2, y, "w");
      for (let x = x0 + 2; x < x0 + w - 2; x += 3) put(grid, x, y + 1, "T");
    }

    // windows
    for (let y = y0 + 3; y < baseY - 1; y += 3) {
      for (let x = x0 + 2; x < x0 + w - 2; x += 3) {
        put(grid, x, y, (L >= 6 && (x + y) % 2 === 0) ? "L" : "B");
      }
    }

    // entrance
    drawDoor(grid, x0 + 6, baseY - 5, 4, 5);

    // crown / roof detail with higher grades
    if (L >= 8) {
      rect(grid, x0 + 2, y0 - 1, w - 4, 2, "9");
      outlineBox(grid, x0 + 2, y0 - 1, w - 4, 2, "0");
    }
    if (L >= 10) {
      rect(grid, x0 + 5, y0 - 2, w - 10, 1, "A");
    }
  }

  // LuxuryHouseWithPool: pool grows + swimmers + big tree etc.
  function drawLuxuryHouseWithPool() {
    addPad(4, 24, 24, 6);

    // house body (slightly bigger than normal house)
    const bodyX = 6, bodyY = 10, bodyW = 14, bodyH = 14;
    shadeBox(grid, bodyX, bodyY, bodyW, bodyH, "W", "w");
    outlineBox(grid, bodyX, bodyY, bodyW, bodyH, "0");

    // roof
    const roofH = 8;
    const roofY = bodyY - roofH;
    for (let i = 0; i < roofH; i++) {
      const inset = i;
      hline(grid, bodyX + inset, bodyX + bodyW - 1 - inset, roofY + i, L >= 7 ? "R" : "r");
    }
    outlineBox(grid, bodyX + 1, roofY + 1, bodyW - 2, roofH - 1, "0");

    // luxury windows
    rect(grid, bodyX + 2, bodyY + 3, 4, 4, "L");
    rect(grid, bodyX + 8, bodyY + 3, 4, 4, "L");
    outlineBox(grid, bodyX + 2, bodyY + 3, 4, 4, "0");
    outlineBox(grid, bodyX + 8, bodyY + 3, 4, 4, "0");
    drawDoor(grid, bodyX + 5, bodyY + 8, 4, 6);

    // pool grows with level: width/height increase
    const pw = Math.min(14, 6 + Math.floor(L * 0.8));
    const ph = Math.min(10, 4 + Math.floor(L * 0.6));
    const px0 = 20;
    const py0 = 12 + Math.max(0, Math.floor((10 - ph) / 2));
    drawPool(grid, px0 - pw, py0, pw, ph);

    // deck
    if (L >= 2) {
      rect(grid, px0 - pw, py0 + ph, pw, 2, "T");
      hline(grid, px0 - pw, px0 - 1, py0 + ph + 1, "t");
      outlineBox(grid, px0 - pw, py0 + ph, pw, 2, "0");
    }

    // swimmers appear at higher grades
    if (L >= 5) drawSwimmer(grid, px0 - Math.floor(pw / 2), py0 + Math.floor(ph / 2));
    if (L >= 7) drawSwimmer(grid, px0 - Math.floor(pw / 3), py0 + Math.floor(ph / 2) - 1);
    if (L >= 9) drawSwimmer(grid, px0 - Math.floor(pw / 2) - 2, py0 + Math.floor(ph / 2) + 1);

    // big tree / landscaping
    if (L >= 4) drawTree(grid, 4, 12, 2);
    if (L >= 8) drawTree(grid, 4, 20, 1);

    // lights
    if (L >= 6) {
      for (let x = px0 - pw + 1; x < px0 - 1; x += 3) put(grid, x, py0 - 1, "X");
    }
  }

  // LargePark: designer park with features; mild upgrades
  function drawLargePark() {
    // winding path
    for (let y = 6; y < 30; y++) {
      const x = 10 + Math.floor(Math.sin((y - 6) * 0.35) * 4);
      rect(grid, x, y, 12, 2, "D");
      rect(grid, x + 1, y + 1, 10, 1, "d");
    }

    // big pond + islands
    drawPool(grid, 4, 10, 12, 9);
    rect(grid, 7, 13, 3, 2, "G");
    rect(grid, 10, 16, 2, 2, "g");

    // gazebo / statue zone
    rect(grid, 20, 10, 10, 6, "D");
    outlineBox(grid, 20, 10, 10, 6, "0");
    rect(grid, 23, 11, 4, 4, "T");
    outlineBox(grid, 23, 11, 4, 4, "0");
    put(grid, 25, 9, "X");

    // trees
    drawTree(grid, 26, 22, 2);
    drawTree(grid, 18, 24, 1);
    drawTree(grid, 6, 24, 1);

    // flowers
    for (let i = 0; i < 10; i++) {
      const x = 18 + ((i * 5) % 12);
      const y = 18 + ((i * 7) % 10);
      put(grid, x, y, i % 2 ? "M" : "X");
    }
  }

  // AmusementPark:
  // - ferris wheel always
  // - each grade adds rides / stalls
  // - grade 10: cannot draw Mickey Mouse; instead draw an original mascot face (smiley)
  function drawAmusementPark() {
    addPad(4, 26, 24, 4);

    // entry gate
    rect(grid, 6, 20, 20, 6, "M");
    rect(grid, 6, 22, 20, 4, "m");
    outlineBox(grid, 6, 20, 20, 6, "0");
    rect(grid, 12, 21, 8, 2, "X");
    outlineBox(grid, 12, 21, 8, 2, "0");

    // ferris wheel
    drawFerrisWheel(grid, 24, 10, 7);

    // rides add by level
    if (L >= 2) {
      // carousel
      rect(grid, 6, 10, 10, 6, "C");
      outlineBox(grid, 6, 10, 10, 6, "0");
      rect(grid, 7, 11, 8, 1, "X");
      for (let x = 7; x <= 14; x += 2) put(grid, x, 14, "M");
    }
    if (L >= 3) {
      // coaster track
      for (let x = 6; x < 18; x++) put(grid, x, 6 + Math.floor(Math.sin(x * 0.5) * 2), "0");
      for (let x = 6; x < 18; x++) put(grid, x, 7 + Math.floor(Math.sin(x * 0.5) * 2), "K");
    }
    if (L >= 4) {
      // snack stall
      rect(grid, 6, 16, 8, 4, "T");
      outlineBox(grid, 6, 16, 8, 4, "0");
      rect(grid, 6, 15, 8, 1, "X");
    }
    if (L >= 5) {
      // lights
      for (let x = 6; x <= 25; x += 2) put(grid, x, 25, "X");
    }
    if (L >= 6) {
      // bumper cars zone
      rect(grid, 16, 14, 8, 5, "C");
      outlineBox(grid, 16, 14, 8, 5, "0");
      put(grid, 18, 16, "M");
      put(grid, 21, 17, "X");
    }
    if (L >= 7) {
      // extra ride
      rect(grid, 8, 7, 6, 3, "m");
      outlineBox(grid, 8, 7, 6, 3, "0");
      for (let x = 9; x <= 12; x++) put(grid, x, 6, "M");
    }
    if (L >= 8) {
      // fireworks sparkles
      put(grid, 10, 3, "X");
      put(grid, 12, 2, "M");
      put(grid, 8, 2, "X");
    }
    if (L >= 9) {
      // second small wheel / spinning ride
      drawFerrisWheel(grid, 10, 12, 4);
    }

    if (L >= 10) {
      // NOTE: Mickey Mouse is copyrighted; draw an original mascot face instead.
      // mascot face (smiley) on the gate sign
      rect(grid, 12, 20, 8, 6, "7");
      outlineBox(grid, 12, 20, 8, 6, "0");
      // eyes
      put(grid, 14, 22, "1");
      put(grid, 17, 22, "1");
      // smile
      put(grid, 14, 24, "4");
      put(grid, 15, 25, "4");
      put(grid, 16, 25, "4");
      put(grid, 17, 24, "4");
      // cheeks
      put(grid, 13, 23, "5");
      put(grid, 18, 23, "5");
    }
  }

  switch (kind) {
    case 1:  return drawHouse();
    case 2:  return drawFarm();
    case 3:  return drawWorkshop();
    case 4:  return drawPark();
    case 6:  return drawMonument();
    case 7:  return drawHighRiseCommercial();
    case 8:  return drawResidential();
    case 9:  return drawLuxuryHouseWithPool();
    case 10: return drawLargePark();
    case 11: return drawAmusementPark();
    default: return;
  }
}

function spriteCanvas32(kind, level) {
  const L = clampLevel(level, 10);
  const k = `${kind}:${L}`;
  const hit = cache32.get(k);
  if (hit) return hit;

  const grid = makeGrid(baseSprite32(kind), 32);
  applyLevel32(kind, L, grid);
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
