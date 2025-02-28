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
- [Future Plans](#future-plans)
- [Contributing](#contributing)
- [License](#license)

## Introduction
StarkFinder is an innovative AI-powered application that helps users navigate the Starknet ecosystem with ease. Developed for the EthGlobal AI Web3 Hackathon, StarkFinder leverages the power of multi-agent AI to automate various tasks, making the Starknet experience more efficient and streamlined for users.

## Features
- **Multi-Agent Architecture**: StarkFinder supports a diverse set of specialized agents, each with its own capabilities, such as trading, investing, exploring, and researching Starknet protocols.
- **Starknet Integration**: The agents seamlessly interact with the Starknet Layer 2 network, allowing users to leverage the benefits of this high-performance blockchain.
- **Conversational Interface**: Users can communicate with the agents through an intuitive chat-like interface, making the experience natural and user-friendly.
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
This project is licensed under the [MIT License](https://opensource.org/license/mit).
















































































































## Contributors

<a href='https://github.com/actions-user' target='_blank'><img src='https://avatars.githubusercontent.com/u/65916846?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='actions-user' /></a><a href='https://github.com/PoulavBhowmick03' target='_blank'><img src='https://avatars.githubusercontent.com/u/133862694?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='PoulavBhowmick03' /></a><a href='https://github.com/tosoham' target='_blank'><img src='https://avatars.githubusercontent.com/u/144812467?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='tosoham' /></a><a href='https://github.com/TheRanomial' target='_blank'><img src='https://avatars.githubusercontent.com/u/129299316?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='TheRanomial' /></a><a href='https://github.com/guha-rahul' target='_blank'><img src='https://avatars.githubusercontent.com/u/52607971?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='guha-rahul' /></a><a href='https://github.com/Nityam573' target='_blank'><img src='https://avatars.githubusercontent.com/u/100020368?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='Nityam573' /></a><a href='https://github.com/jaykayudo' target='_blank'><img src='https://avatars.githubusercontent.com/u/58009744?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='jaykayudo' /></a><a href='https://github.com/laryhills' target='_blank'><img src='https://avatars.githubusercontent.com/u/43778211?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='laryhills' /></a><a href='https://github.com/od-hunter' target='_blank'><img src='https://avatars.githubusercontent.com/u/146340502?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='od-hunter' /></a><a href='https://github.com/OnyemaAnthony' target='_blank'><img src='https://avatars.githubusercontent.com/u/50530242?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='OnyemaAnthony' /></a><a href='https://github.com/Reallanky' target='_blank'><img src='https://avatars.githubusercontent.com/u/107430741?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='Reallanky' /></a><a href='https://github.com/Jagadeeshftw' target='_blank'><img src='https://avatars.githubusercontent.com/u/92681651?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='Jagadeeshftw' /></a><a href='https://github.com/akintewe' target='_blank'><img src='https://avatars.githubusercontent.com/u/85641756?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='akintewe' /></a><a href='https://github.com/SudiptaPaul-31' target='_blank'><img src='https://avatars.githubusercontent.com/u/117905151?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='SudiptaPaul-31' /></a><a href='https://github.com/omsant02' target='_blank'><img src='https://avatars.githubusercontent.com/u/102831123?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='omsant02' /></a><a href='https://github.com/ryzen-xp' target='_blank'><img src='https://avatars.githubusercontent.com/u/92181599?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='ryzen-xp' /></a><a href='https://github.com/kimcascante' target='_blank'><img src='https://avatars.githubusercontent.com/u/72054684?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='kimcascante' /></a><a href='https://github.com/Bosun-Josh121' target='_blank'><img src='https://avatars.githubusercontent.com/u/96661657?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='Bosun-Josh121' /></a><a href='https://github.com/armaanansari121' target='_blank'><img src='https://avatars.githubusercontent.com/u/145029005?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='armaanansari121' /></a><a href='https://github.com/Verifieddanny' target='_blank'><img src='https://avatars.githubusercontent.com/u/103733496?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='Verifieddanny' /></a><a href='https://github.com/manassehO' target='_blank'><img src='https://avatars.githubusercontent.com/u/111440385?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='manassehO' /></a><a href='https://github.com/Luluameh' target='_blank'><img src='https://avatars.githubusercontent.com/u/104063177?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='Luluameh' /></a><a href='https://github.com/ishitab02' target='_blank'><img src='https://avatars.githubusercontent.com/u/139248026?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='ishitab02' /></a><a href='https://github.com/psychemist' target='_blank'><img src='https://avatars.githubusercontent.com/u/76947677?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='psychemist' /></a><a href='https://github.com/LazarusAA' target='_blank'><img src='https://avatars.githubusercontent.com/u/169322121?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='LazarusAA' /></a><a href='https://github.com/luighis' target='_blank'><img src='https://avatars.githubusercontent.com/u/41096968?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='luighis' /></a><a href='https://github.com/kingjosmel' target='_blank'><img src='https://avatars.githubusercontent.com/u/175310260?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='kingjosmel' /></a><a href='https://github.com/RareMmemshima' target='_blank'><img src='https://avatars.githubusercontent.com/u/180828156?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='RareMmemshima' /></a><a href='https://github.com/Ndifreke000' target='_blank'><img src='https://avatars.githubusercontent.com/u/111875002?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='Ndifreke000' /></a><a href='https://github.com/Ocheretovich' target='_blank'><img src='https://avatars.githubusercontent.com/u/107276324?v=4' width='50' height='50' style='border-radius: 50%; margin: 5px;' title='Ocheretovich' /></a>

