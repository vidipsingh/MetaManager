import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    console.log("No token provided in Authorization header");
    return NextResponse.json({ error: "No token provided" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    console.log("Token verified, decoded userId:", decoded.userId);
  } catch (error) {
    console.log("Invalid token:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { organizationId } = await req.json();
  if (!organizationId) {
    console.log("Organization ID is required but not provided");
    return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
  }

  try {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      console.log("Organization not found for id:", organizationId);
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { organizationId },
    });

    console.log("User joined organization successfully:", decoded.userId, organizationId);
    return NextResponse.json({ message: "Joined organization successfully" });
  } catch (error) {
    console.error("Failed to join organization:", error);
    return NextResponse.json({ error: "Failed to join organization" }, { status: 500 });
  }
}