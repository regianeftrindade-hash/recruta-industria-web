import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user?: {
      id?: string;
      email?: string;
      userType?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    userType: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    email?: string;
    userType?: string;
    provider?: string;
  }
}
