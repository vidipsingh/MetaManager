import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) { // Change the type to NextRequest
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    let userData;

    try {
      // First try to verify as JWT token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as {
        email: string;
      };
      
      userData = await prisma.user.findUnique({
        where: { email: decoded.email },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    } catch (jwtError) {
      // If JWT verification fails, try to get session token
      const session = await getToken({ req }); // Use the correct request type
      if (session?.email) {
        userData = await prisma.user.findUnique({
          where: { email: session.email as string },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
      }
    }

    if (!userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error in getUserData:", error);
    return NextResponse.json(
      { error: "Failed to get user data" },
      { status: 500 }
    );
  }
}
