// app/api/messages/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function POST(req: Request) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messageData = await req.json();

    const message = await prisma.message.create({
      data: {
        content: messageData.content,
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        conversationId: messageData.conversationId,
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error in messages API:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}