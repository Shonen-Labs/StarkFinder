# 🎮 Dojo Game Starter - Frontend Integration Guide

> **Complete React + Dojo integration documentation**
> From zero to onchain game in 5 minutes ⚡

[![Starknet](https://img.shields.io/badge/Starknet-Ready-orange)](https://starknet.io) [![Cairo](https://img.shields.io/badge/Cairo-2.0-blue)](https://cairo-lang.org) [![Dojo](https://img.shields.io/badge/Dojo-ECS-red)](https://dojoengine.org)

## 🚀 Quick Start

> Controller requires the client to run over HTTPS, so make sure you have the `mkcert` package installed on your system

```bash
git clone https://github.com/your-username/dojo-game-starter
cd dojo-game-starter/client
npm install && npm run mkcert && npm run dev:https
```

**That's it!** Your client is running locally with wallet integration, optimistic updates, and seamless blockchain connectivity.

> Note: this quickstart will connect your client to the existing Sepolia deployment, not your local version!

---

## 📚 Complete Integration Guide

This documentation series explains how to build robust onchain games using React + Dojo + Starknet. Follow the guides in order for best understanding:

### **🏗️ Foundation**
| Guide | Description | Key Topics |
|-------|-------------|------------|
| **[01. Overview](./docs/01-overview.md)** | Big picture and core concepts | Architecture, data flow, gaming UX |
| **[02. Architecture](./docs/02-architecture.md)** | System design and components | Providers, layers, performance |
| **[03. Core Files](./docs/03-core-files.md)** | Essential files and their roles | Bindings, contracts, configuration |

### **🔧 Integration**
| Guide | Description | Key Topics |
|-------|-------------|------------|
| **[04. Zustand State Management](./docs/04-zustand-state-management.md)** | Global state and optimistic updates | Store patterns, performance, persistence |
| **[05. Cartridge Controller](./docs/05-cartridge-controller.md)** | Gaming wallet integration | Session policies, seamless UX |
| **[06. React Hooks Pattern](./docs/06-react-hooks-pattern.md)** | Custom hooks for blockchain | Data fetching, actions, coordination |

### **⚡ Advanced**
| Guide | Description | Key Topics |
|-------|-------------|------------|
| **[07. Data Flow](./docs/07-data-flow.md)** | Complete request/response cycles | Real-time gameplay, state sync |
| **[08. Extending the System](./docs/08-extending-system.md)** | Building your dream game | Extension strategies, development approach |

---

## 🎯 What You'll Learn

By following this guide series, you'll master:

**🏗️ Technical Integration**
- React + Dojo + Starknet architecture
- Optimistic updates for instant UX
- Type-safe contract interactions
- Custom hooks for blockchain operations

**🎮 Gaming-Specific Patterns**
- Cartridge Controller for seamless wallet UX
- Session policies for uninterrupted gameplay
- Real-time state synchronization
- Error handling for blockchain operations

**🚀 Production Best Practices**
- Performance optimization techniques
- Testing strategies for Web3 apps
- Deployment and environment management
- Scalable architecture patterns

---

## 🎮 Game Mechanics Demo

The starter includes three core actions that demonstrate different interaction patterns:

| Action | Effect | Demonstrates |
|--------|--------|--------------|
| 🏋️ **Train** | +10 EXP | Pure advancement mechanics |
| ⛏️ **Mine** | +5 Coins, -5 Health | Risk/reward decisions |
| 💤 **Rest** | +20 Health | Resource management |

These simple mechanics showcase the complete integration stack: from Cairo contracts to React components, with optimistic updates and error handling.

---

## 🛠️ Tech Stack

```
Frontend:  React + Vite + TypeScript + TailwindCSS
State:     Zustand + React Query patterns
Wallet:    Cartridge Controller + Starknet React
Blockchain: Dojo + Cairo + Starknet
Data:      Torii GraphQL + Optimistic Updates
```

---

## 🎯 Perfect For

- 🏆 **Hackathon teams** needing quick onchain game setup
- 🎮 **Game developers** entering Web3 space
- 🏢 **Studios** prototyping blockchain games
- 📚 **Developers** learning Starknet + Dojo

---

## 🌟 Key Features

**⚡ Instant Feedback**
- Optimistic updates for immediate UI response
- Background blockchain confirmation
- Automatic rollback on transaction failure

**🎮 Gaming-First UX**
- Cartridge Controller integration
- Session policies for seamless actions
- No wallet popups during gameplay

**🔧 Developer Experience**
- Complete TypeScript integration
- Hot reload with contract changes
- Comprehensive error handling
- Testing strategies included

**🚀 Production Ready**
- Environment-based configuration
- Performance optimizations
- Deployment best practices
- Monitoring and analytics patterns

---

## 🚀 Getting Started

1. **Start with [Overview](./docs/01-overview.md)** to understand the big picture
2. **Follow the guides in order** for comprehensive understanding
3. **Reference specific topics** as needed during development
4. **Use [Extending the System](./docs/09-extending-system.md)** to build your unique game

Each guide builds upon the previous ones, creating a complete learning path from basic concepts to advanced implementation patterns.

---

## 📞 Support

- 💬 **Discord**: [Dojo Engine Community](https://discord.com/invite/dojoengine)
- 📚 **Docs**: [Official Dojo Documentation](https://dojoengine.org)
- 🐦 **Twitter**: [@ohayo_dojo](https://twitter.com/ohayo_dojo)

---

**Ready to build the future of onchain gaming?** Start with the [Overview](./docs/01-overview.md) and begin your journey! 🚀
