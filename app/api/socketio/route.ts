// app/api/socketio/route.ts
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // This route is just for health check
  return new NextResponse('Socket.IO server is running');
}

export const dynamic = 'force-dynamic';