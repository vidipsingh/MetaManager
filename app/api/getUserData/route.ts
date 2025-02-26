import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let userData;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { email: string };
      userData = await prisma.user.findUnique({
        where: { email: decoded.email },
        select: {
          id: true,
          name: true,
          email: true,
          ethAddress: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (jwtError) {
      const session = await getToken({ req });
      if (session?.email) {
        userData = await prisma.user.findUnique({
          where: { email: session.email as string },
          select: {
            id: true,
            name: true,
            email: true,
            ethAddress: true,
            organizationId: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      }
    }

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("getUserData returning:", userData);
    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error in getUserData:", error);
    return NextResponse.json({ error: "Failed to get user data" }, { status: 500 });
  }
}