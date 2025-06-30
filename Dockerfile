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
    && rm -rf /var/lib/apt/lists/*

# ---- Backend Build Stage ----
FROM base AS backend-builder
WORKDIR /app/backend

# Set environment variables for build (will be overridden by compose/runtime)
ENV OPENAI_API_KEY=*******
ENV BRIAN_API_KEY=*******
ENV ANTHROPIC_API_KEY=*******
ENV DEFAULT_LLM_PROVIDER=*******
ENV STARKNET_RPC_URL=*******
ENV ACCOUNT_ADDRESS=*******
ENV OZ_ACCOUNT_PRIVATE_KEY=*******
ENV DATABASE_URL=*******

# Create minimal package.json for backend
RUN cat <<EOF > package.json
{
  "name": "starkfinder-backend",
  "version": "1.0.0",
  "scripts": {
    "build": "prisma generate && next build",
    "start": "next start"
  },
  "dependencies": {
    "@prisma/client": "^6.3.1",
    "@anthropic-ai/sdk": "^0.39.0",
    "@langchain/openai": "^0.3.17",
    "@langchain/core": "^0.3.31",
    "@langchain/anthropic": "^0.3.11",
    "@langchain/langgraph": "^0.2.41",
    "axios": "^1.7.9",
    "prisma": "^6.3.1",
    "starknet": "^6.11.0",
    "next": "14.2.17",
    "@next/mdx": "^15.3.2",
    "typescript": "^5.8.3"
  }
}
EOF

RUN npm install

# Copy backend sources
COPY ./client/app/api ./app/api
COPY ./client/tsconfig.json ./
COPY ./client/next.config.mjs ./
COPY ./client/prisma ./prisma
COPY ./client/lib ./lib
COPY ./client/components.json ./
COPY ./client/webpack.config.js ./
COPY ./client/prompts ./prompts

# Build backend
RUN npm run build

# ---- Agent Build Stage ----
FROM base AS agent-builder
WORKDIR /app/agent

# Create minimal package.json for agent
RUN cat <<EOF > package.json
{
  "name": "starkfinder-agent",
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

# Create minimal tsconfig.json for agent
RUN cat <<EOF > tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "agents"
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

RUN npm install

# Copy agent sources
COPY ./client/agents ./agents
COPY run-all-agents.js ./

# Build agent
RUN npm run build

# Prune dev dependencies
RUN npm prune --production && npm cache clean --force

# ---- Production Stage ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create directories for both services
RUN mkdir -p /app/backend /app/agent

# Copy backend files
COPY --from=backend-builder /app/backend/.next ./backend/.next
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package.json ./backend/
COPY --from=backend-builder /app/backend/next.config.mjs ./backend/
COPY --from=backend-builder /app/backend/prisma ./backend/prisma
COPY --from=backend-builder /app/backend/lib ./backend/lib
COPY --from=backend-builder /app/backend/app/api ./backend/app/api
COPY --from=backend-builder /app/backend/components.json ./backend/
COPY --from=backend-builder /app/backend/webpack.config.js ./backend/
COPY --from=backend-builder /app/backend/prompts ./backend/prompts
COPY --from=backend-builder /app/backend/node_modules/.prisma ./backend/node_modules/.prisma

# Copy agent files
COPY --from=agent-builder /app/agent/node_modules ./agent/node_modules
COPY --from=agent-builder /app/agent/package.json ./agent/
COPY --from=agent-builder /app/agent/dist ./agent/dist
COPY --from=agent-builder /app/agent/run-all-agents.js ./agent/

# Create startup script to run both services
RUN cat <<EOF > start-services.sh
#!/bin/bash
set -e

echo "Starting StarkFinder services..."

# Start agent in background
cd /app/agent
npm start &
AGENT_PID=\$!

# Start backend in foreground
cd /app/backend
npm start &
BACKEND_PID=\$!

# Function to handle shutdown
shutdown() {
    echo "Shutting down services..."
    kill \$AGENT_PID \$BACKEND_PID 2>/dev/null || true
    wait \$AGENT_PID \$BACKEND_PID 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap shutdown SIGTERM SIGINT

# Wait for both processes
wait \$AGENT_PID \$BACKEND_PID
EOF

RUN chmod +x start-services.sh

# Expose ports for both services
EXPOSE 3000 4000

# Health check for both services
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health && \
      wget --no-verbose --tries=1 --spider http://localhost:4000 || exit 1

CMD ["./start-services.sh"]