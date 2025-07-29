This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Setup

Before running the development server, you need to configure your environment variables:

1. Copy the environment variables template:
   ```bash
   cp env.example .env
   ```

2. Configure the following variables in your `.env` file:

   **Required for basic functionality:**
   - `DATABASE_URL`: PostgreSQL connection string
   - `REDIS_URL`: Redis connection string (default: `redis://localhost:6379`)
   - `NEXTAUTH_SECRET`: Secret key for NextAuth.js
   - `NEXTAUTH_URL`: Your application URL (default: `http://localhost:3000`)

   **Required for AI contract generation:**
   - `DEEPSEEK_API_KEY`: DeepSeek API key for contract generation
   - `OPENAI_API_KEY`: OpenAI API key (alternative AI provider)
   - `ANTHROPIC_API_KEY`: Anthropic API key (alternative AI provider)

   **Required for authentication:**
   - `GOOGLE_CLIENT_ID`: Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

   **Optional:**
   - `BRIAN_API_KEY`: Brian AI API key
   - `STARKNET_RPC_URL`: Starknet RPC URL
   - `STARKNET_PROVIDER_URL`: Starknet provider URL
   - `OZ_ACCOUNT_PRIVATE_KEY`: Account private key for deployment
   - `ACCOUNT_ADDRESS`: Account address for deployment
   - `LAYERSWAP_API_KEY`: Layerswap API key

3. Set up the database:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
