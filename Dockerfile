# Multi-stage Dockerfile for StarkFinder Project
# This Dockerfile builds both the backend API and agent in a single container

FROM node:20-slim AS base
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    wget \
    python3 \
    python3-pip \
    build-essential \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ---- Backend Build Stage ----
FROM base AS backend-builder
WORKDIR /app/backend

# Set environment variables for Next.js build
ARG OPENAI_API_KEY
ARG BRIAN_API_KEY
ARG ANTHROPIC_API_KEY
ARG DEFAULT_LLM_PROVIDER
ARG STARKNET_RPC_URL
ARG ACCOUNT_ADDRESS
ARG OZ_ACCOUNT_PRIVATE_KEY
ARG DATABASE_URL
ARG DEEPSEEK_API_KEY

# Create package.json for backend with all required dependencies
RUN cat <<EOF > package.json
{
  "name": "api-backend",
  "version": "1.0.0",
  "scripts": {
    "build": "prisma generate --no-engine && next build",
    "start": "next start"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "@argent/invisible-sdk": "^1.0.0",
    "@argent/tma-wallet": "^1.17.1",
    "@auth/prisma-adapter": "^2.9.1",
    "@brian-ai/langchain": "^1.2.9",
    "@brian-ai/sdk": "^0.3.6",
    "@elizaos/core": "^0.25.9",
    "@hookform/resolvers": "^3.10.0",
    "@langchain/anthropic": "^0.3.11",
    "@langchain/core": "^0.3.31",
    "@langchain/langgraph": "^0.2.41",
    "@langchain/openai": "^0.3.17",
    "@mdx-js/loader": "^3.1.0",
    "@mdx-js/react": "^2.3.0",
    "@next/mdx": "^15.3.2",
    "@prisma/client": "^6.3.1",
    "@radix-ui/react-accordion": "^1.2.2",
    "@radix-ui/react-avatar": "^1.1.1",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-icons": "^1.3.2",
    "@radix-ui/react-label": "^2.1.1",
    "@radix-ui/react-scroll-area": "^1.2.0",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-switch": "^1.1.2",
    "@radix-ui/react-tooltip": "^1.1.8",
    "@starknet-react/chains": "^3.1.0",
    "@starknet-react/core": "^3.5.0",
    "@tsparticles/engine": "^3.8.0",
    "@tsparticles/react": "^3.0.0",
    "@tsparticles/slim": "^3.8.0",
    "@twa-dev/sdk": "^8.0.1",
    "@types/bcryptjs": "^2.4.6",
    "@types/mdx": "^2.0.6",
    "@vercel/analytics": "^1.4.1",
    "@vercel/kv": "^1.0.1",
    "axios": "^1.7.9",
    "bcryptjs": "^3.0.2",
    "browserify-zlib": "^0.2.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "crypto-browserify": "^3.12.1",
    "csstype": "^3.1.3",
    "dotenv": "^16.4.7",
    "dotenv-safe": "^9.1.0",
    "framer-motion": "^10.18.0",
    "grammy": "^1.34.0",
    "https-browserify": "^1.0.0",
    "langchain": "^0.3.10",
    "lucide-react": "^0.456.0",
    "next": "^14.2.20",
    "next-auth": "^5.0.0-beta.28",
    "next-themes": "^0.4.3",
    "prism-react-renderer": "^2.0.6",
    "prismjs": "^1.30.0",
    "react": "^18.3.1",
    "react-blockies": "^1.4.1",
    "react-day-picker": "^9.3.0",
    "react-dom": "^18",
    "react-hook-form": "^7.55.0",
    "react-markdown": "^9.0.1",
    "react-simple-code-editor": "^0.14.1",
    "react-syntax-highlighter": "^15.6.1",
    "reactflow": "^11.11.4",
    "remark": "^15.0.1",
    "remark-gfm": "^4.0.0",
    "solc": "^0.8.28",
    "sonner": "^1.7.2",
    "starknet": "^6.11.0",
    "starknetkit": "^2.3.3",
    "stream-browserify": "^3.0.0",
    "stream-http": "^3.2.0",
    "tailwind-merge": "^2.5.4",
    "tailwindcss-animate": "^1.0.7",
    "tsc": "^2.0.4",
    "url": "^0.11.4",
    "uuid": "^11.0.3",
    "vaul": "^1.1.2",
    "vercel": "^39.1.0",
    "vite": "^6.0.7",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@types/dotenv-safe": "^8.1.6",
    "@types/node": "^20.17.31",
    "@types/prismjs": "^1.26.5",
    "@types/react": "^18.3.19",
    "@types/react-dom": "^18",
    "@types/react-syntax-highlighter": "^15.5.13",
    "concurrently": "^9.1.2",
    "eslint": "^8",
    "eslint-config-next": "14.2.17",
    "postcss": "^8",
    "prisma": "^6.3.1",
    "raw-loader": "^4.0.2",
    "tailwindcss": "^3.4.1",
    "ts-node": "^10.9.2",
    "tsx": "^4.19.3",
    "typescript": "^5.8.3"
  }
}
EOF

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy all backend sources needed for build
COPY ./client/app ./app
COPY ./client/components ./components
COPY ./client/hooks ./hooks
COPY ./client/public ./public
COPY ./client/types ./types
COPY ./client/legacy ./legacy
COPY ./client/scripts ./scripts
COPY ./client/utils ./utils
COPY ./client/tsconfig.json ./
COPY ./client/next.config.mjs ./
COPY ./client/prisma ./prisma
COPY ./client/lib ./lib
COPY ./client/components.json ./
COPY ./client/webpack.config.js ./
COPY ./client/prompts ./prompts
COPY ./client/auth.ts ./auth.ts
COPY ./client/middleware.ts ./middleware.ts
COPY ./client/tailwind.config.ts ./tailwind.config.ts
COPY ./client/postcss.config.mjs ./postcss.config.mjs

# Verify UI components exist (debugging step)
RUN ls -la /app/backend/components/ui/ || echo "No UI components found"

# Build backend
RUN npm run build

# ---- Agent Build Stage ----
FROM base AS agent-builder
WORKDIR /app/agent

# Create package.json for agent
RUN cat <<EOF > package.json
{
  "name": "elizaos-agent",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node run-all-agents.js"
  },
  "dependencies": {
    "@elizaos/core": "^0.25.9",
    "fastembed": "^1.14.4",
    "@anush008/tokenizers-linux-x64-gnu": "^0.2.0"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}
EOF

# Create tsconfig.json for agent
RUN cat <<EOF > tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "agents",
    "declaration": false,
    "sourceMap": false
  },
  "include": [
    "agents/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
EOF

# Install dependencies
RUN npm install

# Copy agent sources
COPY ./client/agents ./agents
COPY ./run-all-agents.js ./

# Build agent
RUN npm run build || (echo "TypeScript build failed, but continuing..." && mkdir -p dist)

# Prune dev dependencies
RUN npm prune --production && npm cache clean --force

# ---- Production Stage ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user for security
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# Create directories for both services
RUN mkdir -p /app/backend /app/agent && \
    chown -R nextjs:nodejs /app

# Copy backend files
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/.next ./backend/.next
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/package.json ./backend/
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/next.config.mjs ./backend/
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/prisma ./backend/prisma
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/lib ./backend/lib
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/hooks ./backend/hooks
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/public ./backend/public
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/types ./backend/types
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/legacy ./backend/legacy
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/utils ./backend/utils
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/scripts ./backend/scripts
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/app ./backend/app
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/components ./backend/components
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/components.json ./backend/
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/webpack.config.js ./backend/
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/prompts ./backend/prompts
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/auth.ts ./backend/
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/middleware.ts ./backend/
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/tailwind.config.ts ./backend/
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/postcss.config.mjs ./backend/

# Copy agent files
COPY --from=agent-builder --chown=nextjs:nodejs /app/agent/node_modules ./agent/node_modules
COPY --from=agent-builder --chown=nextjs:nodejs /app/agent/package.json ./agent/
COPY --from=agent-builder --chown=nextjs:nodejs /app/agent/dist ./agent/dist
COPY --from=agent-builder --chown=nextjs:nodejs /app/agent/run-all-agents.js ./agent/
COPY --from=agent-builder --chown=nextjs:nodejs /app/agent/agents ./agent/agents

# Create startup script
RUN cat <<'EOF' > start-services.sh
#!/bin/bash
set -e

echo "Starting StarkFinder services..."

# Function to handle shutdown
shutdown() {
    echo "Shutting down services..."
    kill $(jobs -p) 2>/dev/null || true
    wait
    exit 0
}

# Set up signal handlers
trap shutdown SIGTERM SIGINT EXIT

# Start agent in background
cd /app/agent
echo "Starting agent..."
npm start &
AGENT_PID=$!

# Give agent time to start
sleep 5

# Start backend in background
cd /app/backend
echo "Starting backend..."
npm start &
BACKEND_PID=$!

echo "Both services started. Agent PID: $AGENT_PID, Backend PID: $BACKEND_PID"

# Wait for both processes
wait
EOF

RUN chmod +x start-services.sh && \
    chown nextjs:nodejs start-services.sh

# Switch to non-root user
USER nextjs

# Expose ports for both services
EXPOSE 3000 4000

# Health check for backend service
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["./start-services.sh"]