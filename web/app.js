// web/app.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import { clearSpriteCache, drawGround, drawSprite1x1, drawBuilding2x2 } from "./sprites.js";

const RPC_URL = "https://pubnodes.cypherium.io/rpc";
const CHAIN_ID_HEX = "0x3f26"; // 16166
const EXPLORER = "https://cypherium.tryethernal.com";

// CypherCityV2 address (Diamond)
const CITY = "0x413E4D388A3a8d9fA86F52294b524941f8657e22";

const ui = {
  connect: document.getElementById("connect"),
  status: document.getElementById("status"),
  x0: document.getElementById("x0"),
  y0: document.getElementById("y0"),
  size: document.getElementById("size"),
  load: document.getElementById("load"),
  map: document.getElementById("map"),
  selPos: document.getElementById("selPos"),
  selInfo: document.getElementById("selInfo"),
  kind: document.getElementById("kind"),
  place: document.getElementById("place"),
  upgrade: document.getElementById("upgrade"),
};

function setStatus(s) {
  ui.status.textContent = s;
}

let abi;
const readProvider = new ethers.JsonRpcProvider(RPC_URL);
let cityRead;

let browserProvider;
let signer;
let cityWrite;

let view = { x0: 0, y0: 0, size: 16 };
let selected = { x: 0, y: 0 };

// chunk cache packed uint256 -> BigInt
let chunkPacked = [];

const ctx = ui.map.getContext("2d");
ctx.imageSmoothingEnabled = false;

// ------------------------------
// Gas helpers (Cypherium RPC: no eth_feeHistory)
// Use legacy gasPrice and manual gasLimit to avoid EIP-1559 estimation issues.
// ------------------------------
const DEFAULT_GAS_PRICE_GWEI = 1n; // adjust if needed
const DEFAULT_GAS_LIMIT_PLACE = 300000n;
const DEFAULT_GAS_LIMIT_UPGRADE = 300000n;

async function getLegacyOverrides({ value, gasLimit }) {
  // Prefer MetaMask/provider gasPrice if available; fallback to 1 gwei
  let gasPrice;
  try {
    gasPrice = await browserProvider.send("eth_gasPrice", []);
  } catch {
    gasPrice = ethers.parseUnits(DEFAULT_GAS_PRICE_GWEI.toString(), "gwei");
  }

  const o = {
    gasPrice, // legacy
    gasLimit: gasLimit ? BigInt(gasLimit) : undefined,
    value: value ?? undefined,
  };

  // remove undefined keys (ethers is ok, but keep clean)
  Object.keys(o).forEach((k) => o[k] === undefined && delete o[k]);
  return o;
}

// V2 packed decode
function decodePackedV2(u) {
  if (u === 0n) {
    return {
      exists: false,
      founder: null,
      kind: 0,
      level: 0,
      updatedAt: 0,
      isAnchor: false,
      anchorX: 0,
      anchorY: 0,
      part: 0,
    };
  }

  const founderMask = (1n << 160n) - 1n;
  const founder = "0x" + (u & founderMask).toString(16).padStart(40, "0");

  const kind = Number((u >> 160n) & 0xffn);
  const level = Number((u >> 168n) & 0xffn);
  const updatedAt = Number((u >> 176n) & 0xffffffffn);

  const isAnchor = ((u >> 208n) & 1n) === 1n;
  const anchorX = Number((u >> 209n) & 0xffn);
  const anchorY = Number((u >> 217n) & 0xffn);
  const part = Number((u >> 225n) & 0x3n);

  return { exists: true, founder, kind, level, updatedAt, isAnchor, anchorX, anchorY, part };
}

function idxOf(x, y) {
  const s = view.size;
  const dx = x - view.x0;
  const dy = y - view.y0;
  if (dx < 0 || dy < 0 || dx >= s || dy >= s) return -1;
  return dy * s + dx;
}

function draw() {
  const s = view.size;
  const tilePx = Math.floor(ui.map.width / s);

  ctx.clearRect(0, 0, ui.map.width, ui.map.height);

  // 1) background pass (always stable, independent of selection)
  for (let i = 0; i < chunkPacked.length; i++) {
    const dx = i % s;
    const dy = Math.floor(i / s);
    drawGround(ctx, dx * tilePx, dy * tilePx, tilePx);
  }

  // 2) road pass (1x1)
  for (let i = 0; i < chunkPacked.length; i++) {
    const dx = i % s;
    const dy = Math.floor(i / s);
    const info = decodePackedV2(chunkPacked[i]);
    if (!info.exists) continue;

    // Road = 5 (1 tile)
    if (info.kind === 5) {
      drawSprite1x1(ctx, dx * tilePx, dy * tilePx, tilePx, info.kind, info.level);
    }
  }

  // 3) building pass (2x2 drawn ONCE on anchor only)
  for (let i = 0; i < chunkPacked.length; i++) {
    const dx = i % s;
    const dy = Math.floor(i / s);
    const info = decodePackedV2(chunkPacked[i]);
    if (!info.exists) continue;

    // 0 empty, 5 road are not 2x2 buildings
    if (info.kind === 0 || info.kind === 5) continue;

    // Draw only if anchor.
    if (!info.isAnchor) continue;

    // If anchor is too close to right/bottom edge of current view,
    // drawing would be clipped. Skip in that case to avoid half-buildings.
    if (dx + 1 >= s || dy + 1 >= s) continue;

    drawBuilding2x2(ctx, dx * tilePx, dy * tilePx, tilePx, info.kind, info.level);
  }

  // 4) selection border ONLY (no sprite/shape changes)
  const sx = selected.x - view.x0;
  const sy = selected.y - view.y0;
  if (sx >= 0 && sy >= 0 && sx < s && sy < s) {
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeRect(sx * tilePx + 1, sy * tilePx + 1, tilePx - 2, tilePx - 2);
  }
}

async function loadAbi() {
  const r = await fetch("./abi.json");
  abi = await r.json();
  cityRead = new ethers.Contract(CITY, abi, readProvider);
}

async function ensureCypheriumChain() {
  if (!window.ethereum) throw new Error("MetaMask not found");

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_ID_HEX }],
    });
  } catch {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: CHAIN_ID_HEX,
          chainName: "Cypherium",
          nativeCurrency: { name: "CPH", symbol: "CPH", decimals: 18 },
          rpcUrls: [RPC_URL],
          blockExplorerUrls: [EXPLORER],
        },
      ],
    });
  }
}

async function connectWallet() {
  await ensureCypheriumChain();

  browserProvider = new ethers.BrowserProvider(window.ethereum);
  await browserProvider.send("eth_requestAccounts", []);
  signer = await browserProvider.getSigner();

  cityWrite = new ethers.Contract(CITY, abi, signer);

  const addr = await signer.getAddress();
  setStatus(`Connected: ${addr}`);
}

async function loadChunk(opts = {}) {
  const { keepSelection = false } = opts;

  const x0 = Number(ui.x0.value);
  const y0 = Number(ui.y0.value);
  const size = Number(ui.size.value);

  if (!Number.isFinite(size) || size <= 0 || size > 32) {
    throw new Error("Size must be 1..32");
  }

  const prevSelected = { ...selected };

  view = { x0, y0, size };

  if (!keepSelection) {
    selected = { x: x0, y: y0 };
  } else {
    const inside =
      prevSelected.x >= x0 &&
      prevSelected.y >= y0 &&
      prevSelected.x < x0 + size &&
      prevSelected.y < y0 + size;

    selected = inside ? prevSelected : { x: x0, y: y0 };
  }

  setStatus("Loading chunk...");
  const arr = await cityRead.getChunk(x0, y0, size);
  chunkPacked = arr.map((v) => BigInt(v.toString()));

  draw();
  await updateSelectedFromCache();
  setStatus("Loaded.");
}

async function updateSelectedFromCache() {
  const i = idxOf(selected.x, selected.y);
  ui.selPos.textContent = `Selected: (${selected.x},${selected.y})`;

  if (i >= 0) {
    const info = decodePackedV2(chunkPacked[i]);
    ui.selInfo.textContent = info.exists
      ? `kind=${info.kind}\nlevel=${info.level}\nfounder=${info.founder}\nupdatedAt=${info.updatedAt}\nisAnchor=${info.isAnchor}\nanchor=(${info.anchorX},${info.anchorY})\npart=${info.part}`
      : "empty";
    return;
  }

  try {
    const r = await cityRead.getTile(selected.x, selected.y);
    // V2: (exists, founder, kind, level, updatedAt, isAnchor, anchorX, anchorY, part)
    const exists = Boolean(r.exists ?? r[0]);
    const founder = (r.founder ?? r[1]) || "0x0";
    const kind = Number(r.kind ?? r[2]);
    const level = Number(r.level ?? r[3]);
    const updatedAt = Number(r.updatedAt ?? r[4]);
    const isAnchor = Boolean(r.isAnchor ?? r[5]);
    const anchorX = Number(r.anchorX ?? r[6]);
    const anchorY = Number(r.anchorY ?? r[7]);
    const part = Number(r.part ?? r[8]);

    ui.selInfo.textContent = exists
      ? `kind=${kind}\nlevel=${level}\nfounder=${founder}\nupdatedAt=${updatedAt}\nisAnchor=${isAnchor}\nanchor=(${anchorX},${anchorY})\npart=${part}`
      : "empty";
  } catch (e) {
    ui.selInfo.textContent = `read error: ${e.message}`;
  }
}

ui.map.addEventListener("click", async (ev) => {
  const rect = ui.map.getBoundingClientRect();
  const px = (ev.clientX - rect.left) * (ui.map.width / rect.width);
  const py = (ev.clientY - rect.top) * (ui.map.height / rect.height);

  const s = view.size;
  const tilePx = ui.map.width / s;
  const dx = Math.floor(px / tilePx);
  const dy = Math.floor(py / tilePx);

  selected = { x: view.x0 + dx, y: view.y0 + dy };
  draw();
  await updateSelectedFromCache();
});

async function placeSelected() {
  if (!cityWrite) throw new Error("Connect Wallet first");

  const kind = Number(ui.kind.value);

  let fee = ethers.parseEther("0.001");
  try {
    fee = await cityRead.PLACE_FEE();
  } catch {}

  setStatus("Sending place tx...");

  // Legacy gas overrides (no EIP-1559 / no feeHistory)
  const overrides = await getLegacyOverrides({
    value: fee,
    gasLimit: DEFAULT_GAS_LIMIT_PLACE,
  });

  const tx = await cityWrite.place(selected.x, selected.y, kind, overrides);
  setStatus(`tx: ${tx.hash}`);

  try {
    await tx.wait();
  } catch {
    setStatus("tx sent (wait warning). Refreshing...");
  }

  await loadChunk({ keepSelection: true });
}

async function upgradeSelected() {
  if (!cityWrite) throw new Error("Connect Wallet first");

  let fee = ethers.parseEther("0.0005");
  try {
    fee = await cityRead.UPGRADE_FEE();
  } catch {}

  setStatus("Sending upgrade tx...");

  // Legacy gas overrides (no EIP-1559 / no feeHistory)
  const overrides = await getLegacyOverrides({
    value: fee,
    gasLimit: DEFAULT_GAS_LIMIT_UPGRADE,
  });

  const tx = await cityWrite.upgrade(selected.x, selected.y, overrides);
  setStatus(`tx: ${tx.hash}`);

  try {
    await tx.wait();
  } catch {
    setStatus("tx sent (wait warning). Refreshing...");
  }

  await loadChunk({ keepSelection: true });
}

ui.connect.onclick = () => connectWallet().catch((e) => setStatus(e.message));
ui.load.onclick = () => loadChunk().catch((e) => setStatus(e.message));
ui.place.onclick = () => placeSelected().catch((e) => setStatus(e.message));
ui.upgrade.onclick = () => upgradeSelected().catch((e) => setStatus(e.message));

(async () => {
  clearSpriteCache();
  await loadAbi();
  setStatus("Ready.");
  await loadChunk();
})();
