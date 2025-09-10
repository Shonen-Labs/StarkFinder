# 🎮 Game Setup Guide

## Current Status: **PARTIALLY PLAYABLE** ✅

The game has a complete hook system and UI, but needs proper configuration to be fully playable.

## 🚀 Quick Setup

### 1. Environment Configuration

Create a `.env.local` file in the `client` directory:

```bash
# Starknet RPC URL (for Sepolia testnet)
VITE_PUBLIC_NODE_URL=https://starknet-sepolia.public.blastapi.io

# Torii Indexer URL (your Dojo indexer)
VITE_PUBLIC_TORII=http://localhost:8080

# Master Account (for game initialization)
VITE_PUBLIC_MASTER_ADDRESS=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Master Private Key (for game initialization)
VITE_PUBLIC_MASTER_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Game Configuration
VITE_GAME_NAMESPACE=blockrooms
VITE_GAME_SLOT=blockrooms-game
```

### 2. Start the Game

```bash
cd client
npm install
npm run dev
```

### 3. Connect Wallet

1. Open the game in your browser
2. Click "Start Game" 
3. Connect your Starknet wallet (ArgentX, Braavos, etc.)
4. The game will automatically initialize

## 🎯 What's Working Now

### ✅ **Complete Features:**
- **40+ Dojo Hooks** - All game functions available
- **Real-time UI** - GameInfo and GameActions panels
- **3D Game Engine** - Three.js with React Three Fiber
- **Wallet Integration** - Starknet wallet connection
- **State Management** - Zustand store with all game data
- **Event System** - Real-time blockchain event listening
- **Type Safety** - Full TypeScript integration

### 🎮 **Game Actions Available:**
- **Player Movement** - Move in 4 directions
- **Combat** - Attack entities
- **Collection** - Collect shards
- **Exploration** - Open doors
- **Turn Management** - Execute complex turns
- **Game Management** - Start/end games, respawn

### 📊 **Real-time Data:**
- Player health, position, stats
- Room information and entities
- Game configuration and session data
- Event history and turn tracking

## 🔧 **What You Need to Complete:**

### 1. **Configure Environment Variables**
- Set up your Dojo indexer URL
- Configure Starknet RPC endpoint
- Add master account credentials

### 2. **Deploy Smart Contract**
- Ensure your Dojo world is deployed
- Verify the contract address in `cartridgeConnector.tsx`
- Make sure Torii indexer is running

### 3. **Test Wallet Connection**
- Install a Starknet wallet (ArgentX recommended)
- Connect to Sepolia testnet
- Ensure you have test tokens

## 🎮 **How to Play:**

### **Basic Gameplay:**
1. **Start Game** - Click the "Start Game" button
2. **Connect Wallet** - Connect your Starknet wallet
3. **Move Around** - Use WASD keys to move
4. **Interact** - Click to shoot, collect items, open doors
5. **Monitor** - Watch the GameInfo panel for real-time stats

### **Advanced Features:**
- **Game Actions Panel** - Execute complex game actions
- **Turn System** - Plan and execute multiple actions per turn
- **Event Tracking** - Monitor blockchain events in real-time
- **Debug Mode** - Development mode shows connection status

## 🐛 **Troubleshooting:**

### **Common Issues:**

1. **"Wallet not connected"**
   - Install ArgentX or Braavos wallet
   - Connect to Sepolia testnet
   - Ensure wallet is unlocked

2. **"Player data error"**
   - Check Torii indexer is running
   - Verify environment variables
   - Ensure contract is deployed

3. **"Action failed"**
   - Check wallet has test tokens
   - Verify network connection
   - Check console for detailed errors

### **Debug Information:**
- Development mode shows connection status
- Console logs all game actions
- GameInfo panel shows real-time data
- GameActions panel shows error details

## 🚀 **Next Steps:**

1. **Configure Environment** - Set up your `.env.local`
2. **Deploy Contract** - Ensure Dojo world is live
3. **Test Connection** - Verify wallet and indexer work
4. **Start Playing** - Enjoy the fully integrated game!

## 📈 **Game Features:**

### **Core Gameplay:**
- ✅ First-person 3D movement
- ✅ Real-time combat system
- ✅ Item collection mechanics
- ✅ Door/room exploration
- ✅ Turn-based action system

### **Blockchain Integration:**
- ✅ Wallet connection
- ✅ Smart contract interactions
- ✅ Real-time state updates
- ✅ Event listening
- ✅ Transaction management

### **UI/UX:**
- ✅ Game information display
- ✅ Action controls
- ✅ Debug information
- ✅ Connection status
- ✅ Error handling

The game is **architecturally complete** and ready for full playability once configured! 🎉 