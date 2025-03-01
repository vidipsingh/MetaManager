import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") || session.user.id;

    const events = await prisma.calendarEvent.findMany({
      where: { userId: userId },
      orderBy: { startTime: "asc" },
    });
    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.error("No session or user ID");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    // Validate required fields
    if (!data.title || !data.startTime || !data.endTime) {
      console.error("Missing required fields:", {
        hasTitle: !!data.title,
        hasStartTime: !!data.startTime,
        hasEndTime: !!data.endTime,
      });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create a clean data object with only the fields we want
    const eventData = {
      title: data.title,
      description: data.description || "",
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      userId: session.user.id,
    };

    const event = await prisma.calendarEvent.create({
      data: eventData,
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Calendar event creation error:", error);
    if (error.code) {
      console.error("Prisma error code:", error.code);
    }
    return NextResponse.json({ error: "Failed to create event", details: error.message }, { status: 500 });
  }
}