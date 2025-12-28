# CypherCity

**CypherCity** is an adminless, fully on-chain, collaborative city-building game deployed on the **Cypherium EVM** network.

Players collaboratively build a single shared city on a 256×256 grid by placing and upgrading tiles on-chain.  
There is **no owner**, **no admin**, and **no off-chain game server**.

---

## ✨ Core Concepts

- **Fully On-Chain**
  - All city state (tiles, buildings, levels) is stored on-chain.
  - Frontend is static (HTML + JS only).

- **Adminless / Ownerless**
  - No privileged roles.
  - Rules are immutable once deployed.

- **Collaborative World**
  - Everyone builds in the same city.
  - No PvP, no destruction, no resets.

- **Low Cost**
  - Designed to run on inexpensive infrastructure.
  - Only requires an RPC endpoint.

---

## 🧱 City Model

- Grid size: 
- Each tile contains:
  - `kind` (building type)
  - `level` (upgrade level)
  - `founder` (address)
  - `updatedAt` (block timestamp)

### Tile Kinds

| ID | Kind        |
|----|------------|
| 0  | Empty      |
| 1  | House      |
| 2  | Farm       |
| 3  | Workshop  |
| 4  | Park       |
| 5  | Road       |
| 6  | Monument  |
and-more

## ⬆️ Upgrade System

- Tiles can be upgraded up to **Level 10**
- Upgrade effects:
  - On-chain: `level` increases
  - Frontend: sprite visually evolves
- No downgrade, no destruction

---

## 💰 Fees (Anti-Spam Sink)

Fees are burned (not withdrawable):

- Place tile: **0.001 CPH**
- Upgrade tile: **0.0005 CPH**

---

## 🔗 Network

- **Chain**: Cypherium (EVM Istanbul)
- **Chain ID**: `16166`
- **RPC**:  
  `https://pubnodes.cypherium.io/rpc`
- **Explorer**:  
  https://cypherium.tryethernal.com

---

## 📜 Smart Contract

- Written in Solidity `0.8.19`
- EVM version: **Istanbul**
- Deployed address:0x413E4D388A3a8d9fA86F52294b524941f8657e22

