# 🎮 Blockrooms: Backrooms inspired FPS onchain

## 📘 Contents

- 🔗 [Our Stack](#our-stack)
- 🔗 [Game Logic](#game-logic)

# Our-Stack

> A high-level breakdown of the technologies powering **BlockRooms** — from 3D graphics and frontend architecture to fully on-chain gameplay mechanics.

---

## 🎮 Frontend Stack

We use a robust set of modern tools to build the visual and interactive parts of BlockRooms:

- 🎨 **Blender** – for modeling and exporting `.gltf` assets used in our 3D game environment.
- ⚛️ **React** – component-based UI library for structuring our game frontend.
- ⚡ **Vite** – the dev server and build tool powering the React app.
- 🌐 **Three.js** (via [`@react-three/fiber`](https://docs.pmnd.rs/react-three-fiber)) – for real-time 3D rendering in WebGL.
- 🕹️ **PointerLockControls** – to enable mouse-look and FPS-style movement.
- 🐻 **zustand** – lightweight and scalable state manager to handle in-game data like player state, room transitions, HUD, etc.

---

## ⛓️ Onchain Game Logic (via [Dojo](https://dojoengine.org/overview))

The logic of the game lives entirely on-chain, built using the **Dojo Engine**:

- 🧱 **Dojo** – a provable game engine for Starknet. The game state (players, rooms, scores) is stored on-chain using Dojo’s ECS-style architecture.
- 🔧 **dojo.js SDK** – bridges our React frontend to the onchain world. Enables typed access to components and systems using TypeScript.
- 🛠️ **Sozo** – CLI tool used for compiling, testing, and deploying Dojo worlds.
- 📡 **Torii** – for event indexing and real-time subscriptions to in-game events.

👉 **Explore Dojo documentation:** [https://docs.dojoengine.org](https://docs.dojoengine.org)

---


## 🔗 Relevant Links

- 📚 [Dojo Docs](https://dojoengine.org/overview)


# Game-Logic

This section outlines the core gameplay loop, progression mechanics, and XP logic of **BlockRooms**. It’s built to reflect both **on-chain** and **frontend** behavior.

---

## 🧩 Overview

- **Genre**: On-chain, zone-based shooter with progression and XP mechanics.  
- **Map Structure**: 3 zones → Red (8 rooms), Blue (8 rooms), Green (4 rooms)  
- **Objective**: Locate and eliminate the *real enemy* in each zone to unlock the next.

---

## 🔁 Game Loop Summary

Wallet → Join Session → Spawn in Red Zone →
→ Choose Room → Read Enemy Positions → Shoot →
→ If Real Enemy: Gain XP & Unlock Next Zone
→ If Fake Enemy: Lose XP → Continue Searching
→ Repeat for all 3 zones until exit

markdown
Copy
Edit

---

## ⚙️ Game Loop Step-by-Step

### 1. 🔌 Connect Wallet
- Player connects their **Cartridge Wallet** to the website.

### 2. 👥 Join Session
- Player taps **Join Session**.
- A session is created **on-chain**.
- Player spawns in **Red Zone**, with:
  - `Health = 100`
  - `XP = 200`

### 3. 🧭 Explore Red Zone
- **Total Rooms**: 8 (Red Zone)
- Player can only enter **one room at a time**.
- In each room:
  - **4 positions** are shown by the frontend where enemies may appear.
  - These positions are **predefined** in the frontend.
  - However, the **frontend does not know** which is real or fake.
  - This info is derived from **on-chain** state.

### 4. ❓ Real vs. Fake Enemies
- Across all 8 rooms:
  - Only **one** hides the **real enemy**.
  - Its identity is **hidden from the frontend** and **stored on-chain**.

---

## 🎯 Shooting Logic

| Enemy Type     | Action | XP Impact             | Zone Impact                             |
|----------------|--------|------------------------|------------------------------------------|
| ❌ Fake Enemy  | Hit    | `-1 × current_health`  | Stay in current zone, keep searching     |
| ✅ Real Enemy  | Hit    | `+5 × current_health`  | Unlock next zone                         |

---

## 💡 XP Formula

- **On Miss (fake):**  
  `XP -= 1 × Health`

- **On Hit (real):**  
  `XP += 5 × Health`

---

## 🔓 Zone Progression

Red Zone (8 rooms)
→ Real enemy defeated
→ Blue Zone (8 rooms)
→ Real enemy defeated
→ Green Zone (4 rooms)
→ Game Completed

yaml
Copy
Edit

- Once the real enemy in a zone is defeated:
  - The next zone is unlocked
  - Health and XP are retained
- If **Health = 0**, player may be prevented from progressing.

---

## 🧠 On-Chain vs. Frontend Responsibilities

| Layer         | Responsibility                                      |
|---------------|-----------------------------------------------------|
| **Frontend**  | Renders rooms, enemy visuals, manages input         |
| **On-Chain**  | Chooses real enemy, calculates XP, controls state   |
| **Dojo ECS**  | Stores health, XP, room state, and logs events      |

---

## 🔗 Session End Conditions

- Player defeats the real enemy in the **Green Zone**.
- The system may record:
  - ✅ Final XP  
  - ⏱️ Time taken  
  - 🎯 Shots fired  

---

## ⚠️ Disclaimer: Zone Difficulty Scaling

> The above loop repeats across zones, but XP values change to increase challenge.

### 🔵 Blue Zone (8 Rooms)

- **Fake Enemy Shot**: `-1.5 × Health`  
- **Real Enemy Shot**: `+10 × Health`  
- **Total Positions**: `8 × 4 = 32`

### 🟢 Green Zone (4 Rooms)

- **Fake Enemy Shot**: `-4 × Health`  
- **Real Enemy Shot**: `+15 × Health`  
- **Total Positions**: `4 × 4 = 16`

---



