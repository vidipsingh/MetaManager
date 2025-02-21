import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ethers } from "ethers";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("Email/Password authorize called with:", credentials);
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error("User not found");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name
        };
      }
    }),
    CredentialsProvider({
      id: "ethereum",
      name: "Ethereum",
      credentials: {
        address: { label: "Ethereum Address", type: "text" }
      },
      async authorize(credentials) {
        console.log("Ethereum authorize called with:", credentials);
        if (!credentials?.address) {
          console.log("No address provided");
          throw new Error("No wallet address provided");
        }

        const address = ethers.getAddress(credentials.address); // Normalize address
        console.log("Normalized address:", address);

        let user = await prisma.user.findFirst({
          where: { ethAddress: address }
        });

        if (!user) {
          console.log("Creating new user for address:", address);
          user = await prisma.user.create({
            data: {
              email: `${address}@metamanager.eth`,
              name: address.slice(0, 6) + "..." + address.slice(-4),
              ethAddress: address,
            }
          });
        } else {
          console.log("Found existing user:", user);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          ethAddress: address
        };
      }
    })
  ],
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log("signIn callback:", { user, account });
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });

          if (!existingUser) {
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name!,
                emailVerified: new Date(),
              }
            });
            user.id = newUser.id;
          } else {
            user.id = existingUser.id;
          }
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      } else if (account?.provider === "ethereum") {
        user.ethAddress = account.providerAccountId;
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.ethAddress = user.ethAddress;
      }
      
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.ethAddress = token.ethAddress;
        
        const customToken = jwt.sign(
          { 
            userId: token.id,
            email: session.user.email,
            ethAddress: token.ethAddress
          },
          process.env.JWT_SECRET!,
          { expiresIn: "24h" }
        );
        
        session.customToken = customToken;
      }
      return session;
    }
  },
  debug: true, // Enable debug mode for more logs
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };