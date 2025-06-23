import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "./lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Remove the adapter line - you don't need it with JWT strategy
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: credentials.username as string },
                { username: credentials.username as string },
              ],
            },
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email ?? undefined,
            name: user.name ?? undefined,
            username: user.username ?? undefined,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60, // 2 hours
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Handle initial sign in
      if (user) {
        token.username = user.username || undefined;
      }
      
      // Handle Google OAuth - create user if doesn't exist
      if (account?.provider === "google" && user) {
        try {
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });
          
          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                username: user.email?.split('@')[0], // Generate username from email
              }
            });
          }
          
          token.username = dbUser.username || undefined;
          token.sub = dbUser.id;
        } catch (error) {
          console.error("Error handling Google OAuth:", error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.username = token.username as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth",
  },
  debug: process.env.NODE_ENV === "development",
});
