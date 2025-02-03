# StarkFinder: Your AI-Powered Starknet Navigator

[![Telegram Channel](https://img.shields.io/badge/Telegram-Channel-blue?logo=telegram)](https://t.me/shogenlabs)
[![Telegram Bot](https://img.shields.io/badge/Telegram-Bot-light--blue?logo=telegram)](https://t.me/starkfinder_bot)
[![Website](https://img.shields.io/badge/Website-StarkFinder-green)](https://www.starkfinder.ai](https://stark-finder-mq45.vercel.app/))

![image](https://github.com/user-attachments/assets/22bf72f4-0edd-4af6-a3c2-1397e85ca0f8)


## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Using StarkFinder](#using-starkfinder)
  - [Available Agents](#available-agents)
    - [Trade Agent](#trade-agent)
    - [Investment Agent](#investment-agent)
    - [Exploration Agent](#exploration-agent)
    - [Research Agent](#research-agent)
- [Design](#design)
   - [Landing Page](#landing-page)
   - [Starkfinder Transaction Page](#starkfinder-transaction-page)
- [Bridging Functionality](#bridging-functionality)
- [Future Plans](#future-plans)
- [Contributing](#contributing)
- [License](#license)

## Introduction
StarkFinder is an innovative AI-powered application that helps users navigate the Starknet ecosystem with ease. Developed for the EthGlobal AI Web3 Hackathon, StarkFinder leverages the power of multi-agent AI to automate various tasks, making the Starknet experience more efficient and streamlined for users.

## Features
- **Multi-Agent Architecture**: StarkFinder supports a diverse set of specialized agents, each with its own capabilities, such as trading, investing, exploring, and researching Starknet protocols.
- **Starknet Integration**: The agents seamlessly interact with the Starknet Layer 2 network, allowing users to leverage the benefits of this high-performance blockchain.
- **Conversational Interface**: Users can communicate with the agents through an intuitive chat-like interface, making the experience natural and user-friendly.
- **Cross-Chain Bridging**: Seamless token bridging between Ethereum, Starknet, and other supported networks using Layerswap integration.
- **Automation and Task Delegation**: Users can delegate tasks to the agents, which will then execute them on their behalf, saving time and effort.
- **Comprehensive Starknet Insights**: The application provides users with in-depth information about Starknet, including DeFi platforms, trading opportunities, and research insights.

## Architecture
StarkFinder is built using the following technologies:

- **Next.js**: A React framework for building server-rendered and static websites.
- **Prisma**: A type-safe ORM for interacting with the database.
- **PostgreSQL**: The relational database used for storing user data and agent configurations.
- **TypeScript**: A superset of JavaScript that adds optional static typing.
- **Cairo**: A domain-specific language used for writing Starknet smart contracts.

The application's architecture follows a multi-agent design, where each agent specializes in a specific task or domain. The agents communicate with the Starknet network through a set of APIs and integrate with various Starknet-based protocols and services.

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- PostgreSQL (version 12 or higher)
- Create `.env` file both in `client` and `tg_bot` directories with different `DATABASE_URL`. For BrianAI API key go to their [app](https://www.brianknows.org/app) connect wallet and get your key.

### Installation
1. Clone the repository:
   ```
   git clone https://github.com/username/StarkFinder.git
   ```
2. Navigate to the project directory:
   ```
   cd StarkFinder
   ```
3. Install the dependencies:
   ```
   cd client
   npm install
   cd ..
   cd tg_bot
   npm install
   ```
4. Set up the database (both into `client` and `tg_bot` directories):
   ```
   npx prisma generate
   npx prisma migrate dev
   ```
5. Start the development server:
   ```
   npm run dev
   ```
### Setting up Telegram Test Environment
- Please go through this [doc](https://docs.ton.org/v3/guidelines/dapps/tma/guidelines/testing-apps) to setup the telegram mini app test environment
## Using StarkFinder

### Available Agents

#### Trade Agent
The Trade Agent is responsible for executing trades on the Starknet network based on user-defined conditions. Users can interact with this agent using the `/trade` command.

#### Investment Agent
The Investment Agent researches and automatically invests in Starknet-based decentralized finance (DeFi) platforms on the user's behalf. Users can interact with this agent using the `/invest` command.

#### Exploration Agent
The Exploration Agent helps users discover new Starknet-based projects, protocols, and services. Users can interact with this agent using the `/explore` command.

#### Research Agent
The Research Agent provides in-depth analysis and insights about the Starknet ecosystem. Users can interact with this agent using the `/research` command.

## Bridging Functionality
StarkFinder integrates with Layerswap to provide seamless cross-chain token transfers. The bridging functionality supports:

### Supported Networks
- Starknet (Mainnet)
- Ethereum (Mainnet)
- Base
- Arbitrum
- Optimism
- Polygon
- zkEra
- Linea
- Scroll
- zkSync

### Features
- **Token Support**: Bridge popular tokens like ETH, USDC, USDT, and more
- **Smart Routing**: Automatically finds the best bridging route for your tokens
- **Deposit Address**: Uses deposit addresses for better transaction handling
- **Error Handling**: Comprehensive error handling with clear user feedback
- **Network Validation**: Validates network and token support before transactions
- **Amount Validation**: Enforces minimum and maximum bridge amounts
- **Address Validation**: Ensures correct address formats for each network

### Usage
1. Set up your environment variables in `.env`:
   ```
   LAYERSWAP_API_KEY=your_layerswap_api_key
   ```

2. Initialize the Layerswap client:
   ```typescript
   import { LayerswapClient } from '@/lib/layerswap/client';
   
   const client = new LayerswapClient(process.env.LAYERSWAP_API_KEY);
   ```

3. Create a bridge transaction:
   ```typescript
   const response = await client.createSwap({
     sourceNetwork: 'ethereum_mainnet',
     destinationNetwork: 'starknet_mainnet',
     sourceToken: 'ETH',
     destinationToken: 'ETH',
     amount: 0.1,
     destinationAddress: '0x...'
   });
   ```

4. Handle the response:
   ```typescript
   if (response.data?.deposit_actions) {
     const steps = JSON.parse(response.data.deposit_actions[0].call_data);
     // Process transaction steps
   }
   ```

### Error Handling
The bridge implementation includes comprehensive error handling for common scenarios:
- Invalid networks or tokens
- Insufficient liquidity
- Invalid addresses
- Network-specific errors
- Rate limiting
- API errors

### Configuration
Configure bridging parameters in your environment:
```env
NEXT_PUBLIC_MIN_BRIDGE_AMOUNT="0.01"
NEXT_PUBLIC_MAX_BRIDGE_AMOUNT="1000"
NEXT_PUBLIC_DEFAULT_BRIDGE_TOKEN="ETH"
```

## Bridging Documentation

StarkFinder is a comprehensive DeFi tool for Starknet that enables users to easily perform transfers, swaps, deposits, withdrawals, and now bridging between networks.

### Features

- Transfer tokens between Starknet addresses
- Swap tokens on Starknet
- Deposit tokens to Starknet
- Withdraw tokens from Starknet
- Bridge tokens between networks (NEW!)

### Bridging Functionality

StarkFinder now supports bridging tokens between networks using Layerswap. Here's an example of bridging ETH from Starknet to Ethereum:

#### Steps to Bridge

1. Connect your wallet
2. Click "Bridge" in the main navigation
3. Select source network (e.g., Starknet)
4. Select destination network (e.g., Ethereum)
5. Enter the amount to bridge
6. Review and confirm the transaction

#### Example Bridge Transaction

**Transaction Details:**
- From: Starknet
- To: Ethereum
- Token: ETH
- Amount: 0.05 ETH
- Transaction URL: https://www.layerswap.io/track/123456

**Screenshots:**
- [Bridge Interface](docs/screenshots/bridge-interface.png)
- [Transaction Status](docs/screenshots/bridge-status.png)

#### Supported Networks

- Starknet (Mainnet)
- Ethereum (Mainnet)
- Base
- Arbitrum
- Optimism
- Polygon

#### Supported Tokens

- ETH
- USDC
- USDT

## Design

### Landing Page
Kindly refer to the following for the [landing page](https://www.figma.com/design/pfxBpMpBiiJvXQtF7zUgFy/Starkfinder?node-id=0-1&t=sgOod3BsqDHeHuhC-1) design.

### Starkfinder Transaction Page
Kindly refer to [web app](https://www.figma.com/file/AJEN6n4Wi8ltjYW7mNSPKX?node-id=0:1&locale=en&type=design) for the web application transaction page.

## Future Plans
In the future, the StarkFinder team plans to expand the application's capabilities by integrating with more Starknet-based protocols and services. Additionally, the team aims to explore the integration of XMTP (Cross-Message Transport Protocol) to enhance the decentralized and secure communication between the agents and users.

## Contributing
Contributions to the StarkFinder project are welcome. If you'd like to contribute, please follow these steps:

Refer to [Contributing](./CONTRIBUTING.md) for contributing.

## License
This project is licensed under the [MIT License](LICENSE).




























## Contributors

<a href='https://github.com/PoulavBhowmick03' target='_blank'><img src='https://avatars.githubusercontent.com/u/133862694?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='PoulavBhowmick03' /></a><a href='https://github.com/tosoham' target='_blank'><img src='https://avatars.githubusercontent.com/u/144812467?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='tosoham' /></a><a href='https://github.com/actions-user' target='_blank'><img src='https://avatars.githubusercontent.com/u/65916846?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='actions-user' /></a><a href='https://github.com/TheRanomial' target='_blank'><img src='https://avatars.githubusercontent.com/u/129299316?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='TheRanomial' /></a><a href='https://github.com/guha-rahul' target='_blank'><img src='https://avatars.githubusercontent.com/u/52607971?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='guha-rahul' /></a><a href='https://github.com/jaykayudo' target='_blank'><img src='https://avatars.githubusercontent.com/u/58009744?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='jaykayudo' /></a><a href='https://github.com/akintewe' target='_blank'><img src='https://avatars.githubusercontent.com/u/85641756?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='akintewe' /></a><a href='https://github.com/Reallanky' target='_blank'><img src='https://avatars.githubusercontent.com/u/107430741?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='Reallanky' /></a><a href='https://github.com/1nonlypiece' target='_blank'><img src='https://avatars.githubusercontent.com/u/190412812?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='1nonlypiece' /></a><a href='https://github.com/Jagadeeshftw' target='_blank'><img src='https://avatars.githubusercontent.com/u/92681651?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='Jagadeeshftw' /></a><a href='https://github.com/Bosun-Josh121' target='_blank'><img src='https://avatars.githubusercontent.com/u/96661657?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='Bosun-Josh121' /></a><a href='https://github.com/omsant02' target='_blank'><img src='https://avatars.githubusercontent.com/u/102831123?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='omsant02' /></a><a href='https://github.com/JayWebtech' target='_blank'><img src='https://avatars.githubusercontent.com/u/45628811?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='JayWebtech' /></a><a href='https://github.com/Agbeleshe' target='_blank'><img src='https://avatars.githubusercontent.com/u/97415163?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='Agbeleshe' /></a><a href='https://github.com/0xdevcollins' target='_blank'><img src='https://avatars.githubusercontent.com/u/90073781?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='0xdevcollins' /></a><a href='https://github.com/armaanansari121' target='_blank'><img src='https://avatars.githubusercontent.com/u/145029005?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='armaanansari121' /></a><a href='https://github.com/jahrulezfrancis' target='_blank'><img src='https://avatars.githubusercontent.com/u/69053775?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='jahrulezfrancis' /></a><a href='https://github.com/SudiptaPaul-31' target='_blank'><img src='https://avatars.githubusercontent.com/u/117905151?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='SudiptaPaul-31' /></a>
