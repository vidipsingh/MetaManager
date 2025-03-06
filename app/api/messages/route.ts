import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function POST(req: Request) {
  try {
    const nextRequest = req as unknown as NextRequest;
    const token = await getToken({ req: nextRequest, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messageData = await req.json();
    const { content, senderId, receiverId, conversationId } = messageData;

    if (senderId !== token.sub) {
      return NextResponse.json({ error: 'Invalid sender ID' }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        receiverId,
        conversationId,
      },
      include: {
        sender: true,
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error in messages API:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}