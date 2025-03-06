// types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string; // Replace customToken with accessToken
    user: {
      id: string;
      email?: string | null; // Make optional to match reality
      name?: string | null; // Make optional to match reality
      ethAddress?: string | null; // Add ethAddress
      organizationId?: string | null; // Add organizationId
    };
  }

  interface User {
    id: string;
    email?: string | null; // Make optional to match reality
    name?: string | null; // Make optional to match reality
    ethAddress?: string | null; // Add ethAddress
    organizationId?: string | null; // Add organizationId
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    ethAddress?: string | null; // Add ethAddress
    organizationId?: string | null; // Add organizationId
  }
}