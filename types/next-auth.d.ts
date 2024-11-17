// types/next-auth.d.ts (or global.d.ts)
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    customToken?: string;  // Add customToken to the Session type
    user: {
      id: string;          // Include the user id as well
      email: string;
      name: string;
    };
  }
}
