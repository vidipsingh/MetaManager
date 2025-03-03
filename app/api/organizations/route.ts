import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
// import { getServerSession } from "next-auth";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const organizations = await prisma.organization.findMany();
    return NextResponse.json(organizations);
  } catch{
    return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No token provided" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
  }

  try {
    const organization = await prisma.organization.create({
      data: { name },
    });

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { organizationId: organization.id },
    });

    return NextResponse.json(organization);
  } catch {
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }
}