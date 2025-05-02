# StarkFinder: Unified StarkNet Data and AI Assistant

## Vision

StarkFinder is an innovative application designed to help users navigate and interact with the StarkNet ecosystem. It combines AI-powered assistance with comprehensive data access, providing tools for both exploring StarkNet and automating tasks. StarkFinder leverages a multi-agent AI architecture to streamline the StarkNet experience, making it more efficient and user-friendly.

## Features

StarkFinder offers a range of features, including:

*   **Multi-Agent Architecture:** StarkFinder employs a diverse set of specialized agents, each with specific capabilities, such as trading, investing, exploring, and researching StarkNet protocols.
*   **StarkNet Integration:** The agents seamlessly interact with the StarkNet Layer 2 network.
*   **Conversational Interface:** Users can communicate with the agents through an intuitive chat-like interface.
*   **Task Automation:** Users can delegate tasks to the agents, which will execute them, saving time and effort.
*   **StarkNet Insights:** The application provides in-depth information about StarkNet, including DeFi platforms, trading opportunities, and research.
*   **Advanced DeFi Features:** Implementation of sophisticated DeFi primitives, including a Concentrated Liquidity AMM.

## Architecture

StarkFinder is built using the following technologies:

*   **Next.js:** A React framework.
*   **Prisma:** A type-safe ORM.
*   **PostgreSQL:** A relational database.
*   **TypeScript:** A superset of JavaScript.
*   **Cairo:** A domain-specific language for Starknet smart contracts.

The application's architecture follows a multi-agent design, where each agent specializes in a specific task. The agents communicate with the StarkNet network through a set of APIs and integrate with various StarkNet-based protocols and services.

## Getting Started

### Prerequisites

*   Node.js (version 14 or higher)
*   PostgreSQL (version 12 or higher)

### Installation

1.  Clone the repository:

    ```bash
    git clone [https://github.com/username/StarkFinder.git](https://github.com/username/StarkFinder.git)

    git clone <YOUR_REPOSITORY_URL> # TODO: Replace with actual URL
    cd StarkFinder
    ```

2.  Install dependencies:

    ```bash
    cd client
    npm install # Install client dependencies
    cd ..
    cd tg_bot
    npm install
    ```

3.  Set up environment variables:

    *   Create `.env` files in both the `client` and `tg_bot` directories.
    *   Copy the environment variable structure:

        ```bash
        # In the 'client' directory
        cp .env.example .env

        # In the 'tg_bot' directory
        cp .env.example .env
        ```

    *   Populate the `.env` files with the following variables:

        ```dotenv
        # === client/.env ===
        # REQUIRED: PostgreSQL connection URL for the client application database
        DATABASE_URL="postgresql://user:password@host:port/client_db?schema=public"

        # === tg_bot/.env ===
        # REQUIRED: PostgreSQL connection URL for the Telegram bot database (MUST be separate from client DB)
        DATABASE_URL="postgresql://user:password@host:port/tgbot_db?schema=public"

        # REQUIRED: Brian AI API Key
        BRIAN_API_KEY="your_brian_ai_api_key"
        # REQUIRED: Layerswap API Key
        LAYERSWAP_API_KEY="your_layerswap_api_key"
        # REQUIRED: OpenAI API Key
        OPENAI_API_KEY="your_openai_api_key"
        # REQUIRED: Anthropic API Key
        ANTHROPIC_API_KEY="your_anthropic_api_key"

        # --- Optional Variables ---
        # Your Telegram bot username (from BotFather)
        BOT_USERNAME="your_bot_username"
        # Your Telegram Bot Token (from BotFather)
        MY_TOKEN="your_telegram_bot_token"
        # Webhook URL (if using webhooks instead of polling)
        WEBHOOK_URL="your_webhook_url"
        # Telegram Mini App URL (from BotFather)
        TELEGRAM_APP_URL="your_telegram_app_url"
        ```

        *   **`BOT_USERNAME`**: Your Telegram bot username (from BotFather). *Not Required*
        *   **`BRIAN_API_KEY`**: Your Brian AI API key (from the Brian AI website). *Required*
        *   **`DATABASE_URL`**: PostgreSQL database URL. *Required* (Create separate databases for `client` and `tg_bot`)
        *   **`MY_TOKEN`**: Your Telegram Bot Token (from BotFather). *Not Required*
        *   **`WEBHOOK_URL`**: Webhook URL. *Not Required*
        *   **`LAYERSWAP_API_KEY`**: Layerswap API key (from Layerswap Dashboard). *Required*
        *   **`TELEGRAM_APP_URL`**: Telegram Mini App URL (from BotFather). *Not Required*
        *   **`OPENAI_API_KEY`**: OpenAI API key. *Required*
        *   **`ANTHROPIC_API_KEY`**: Anthropic API key. *Required*

4.  Set up the databases (in both the `client` and `tg_bot` directories):

    ```bash
    npx prisma generate
    npx prisma migrate dev
    ```

5.  Start the development server:

    ```bash
    npm run dev
    ```

### Setting up Telegram Test Environment

Refer to this [doc](link_to_telegram_test_env_doc) to set up the Telegram mini app test environment.

## Using StarkFinder

### Available Agents

StarkFinder provides several specialized agents:

*   **Trade Agent:** Executes trades on the Starknet network based on user-defined conditions (using the `/trade` command).
*   **Investment Agent:** Researches and invests in StarkNet-based DeFi platforms (using the `/invest` command).
*   **Exploration Agent:** Helps users discover new StarkNet projects, protocols, and services (using the `/explore` command).
*   **Research Agent:** Provides in-depth analysis and insights about the StarkNet ecosystem (using the `/research` command).

## Docker and Kubernetes Integration

StarkFinder can be deployed using Docker and Kubernetes for scalable and reliable operation. Docker containers encapsulate the application and its dependencies, ensuring consistency across different environments. Kubernetes orchestrates these containers, managing deployment, scaling, and maintenance.

To deploy StarkFinder with Docker and Kubernetes:

1.  **Docker Setup:** Ensure Docker is installed and configured on your system. Build Docker images for the `client` and `tg_bot` components using the provided `Dockerfile` (to be created).
2.  **Kubernetes Setup:** Set up a Kubernetes cluster. This can be a local cluster (e.g., Minikube, Kind) or a cloud-based cluster (e.g., AWS EKS, Google GKE, Azure AKS).
3.  **Deployment Configuration:** Define Kubernetes deployment and service configurations (YAML files) for each component, specifying resource requirements, networking, and scaling policies.
4.  **Database Configuration:** Configure persistent volumes and claims for the PostgreSQL databases to ensure data persistence across deployments.
5.  **Secrets Management:** Securely manage API keys and other sensitive information using Kubernetes secrets.
6.  **Deployment:** Deploy the application to the Kubernetes cluster using `kubectl`.
7.  **Monitoring and Logging:** Set up monitoring and logging to track the health and performance of the application.

### Synapse Integration

StarkFinder can be integrated with Synapse, a decentralized knowledge graph, to enhance the capabilities of the Research Agent. By connecting to Synapse, the Research Agent can access a vast amount of structured information about the StarkNet ecosystem, enabling more comprehensive and insightful analysis.

To integrate StarkFinder with Synapse:

1.  **Synapse API Key:** Obtain a Synapse API key.
2.  **Configuration:** Configure the Research Agent to connect to the Synapse API using the API key.
3.  **Data Access:** The Research Agent can now query the Synapse knowledge graph to retrieve information about StarkNet projects, protocols, and services.

## Design

*   **Landing Page:** [Landing Page Design](link_to_landing_page_design)
*   **Web Application Transaction Page:** [Web App Transaction Page](link_to_web_app_design)

## Future Plans

The StarkFinder team plans to expand the application's capabilities by integrating with more StarkNet-based protocols and services. The team also aims to explore the integration of XMTP (Cross-Message Transport Protocol) to enhance decentralized and secure communication between agents and users.

## Contributing

Contributions are welcome! See the [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the [MIT License](LICENSE).

## Contributors

[List Contributors here]