// lib/auth.ts
import { AuthOptions } from "next-auth";
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
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("Email/Password authorize called with:", credentials);
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            organizationId: true,
          },
        });

        if (!user || !user.password) {
          throw new Error("User not found");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: user.organizationId,
        };
      },
    }),
    CredentialsProvider({
      id: "ethereum",
      name: "Ethereum",
      credentials: {
        address: { label: "Ethereum Address", type: "text" },
      },
      async authorize(credentials) {
        console.log("Ethereum authorize called with:", credentials);
        if (!credentials?.address) {
          console.log("No address provided");
          throw new Error("No wallet address provided");
        }

        const address = ethers.getAddress(credentials.address);
        console.log("Normalized address:", address);

        let user = await prisma.user.findFirst({
          where: { ethAddress: address },
          select: {
            id: true,
            email: true,
            name: true,
            ethAddress: true,
            organizationId: true,
          },
        });

        if (!user) {
          console.log("Creating new user for address:", address);
          user = await prisma.user.create({
            data: {
              email: `${address}@metamanager.eth`,
              name: address.slice(0, 6) + "..." + address.slice(-4),
              ethAddress: address,
            },
            select: {
              id: true,
              email: true,
              name: true,
              ethAddress: true,
              organizationId: true,
            },
          });
        } else {
          console.log("Found existing user:", user);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          ethAddress: address,
          organizationId: user.organizationId,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log("signIn callback:", { user, account });
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: {
              id: true,
              email: true,
              name: true,
              emailVerified: true,
              organizationId: true,
            },
          });

          if (!existingUser) {
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name!,
                emailVerified: new Date(),
              },
              select: {
                id: true,
                email: true,
                name: true,
                emailVerified: true,
                organizationId: true,
              },
            });
            user.id = newUser.id;
            user.organizationId = newUser.organizationId;
          } else {
            user.id = existingUser.id;
            user.organizationId = existingUser.organizationId;
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
        token.organizationId = user.organizationId;
      }

      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.ethAddress = token.ethAddress as string | undefined;
        session.user.organizationId = token.organizationId as string | undefined;

        const customToken = jwt.sign(
          {
            userId: token.id,
            email: session.user.email,
            ethAddress: token.ethAddress,
            organizationId: token.organizationId,
          },
          process.env.JWT_SECRET!,
          { expiresIn: "24h" }
        );

        session.customToken = customToken;
      }
      return session;
    },
  },
  debug: false,
};