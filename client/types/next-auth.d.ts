import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    username?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    username?: string;
  }
}
