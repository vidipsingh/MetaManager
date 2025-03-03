import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.NEXTAUTH_SECRET || '';
    const decodedToken = jwt.verify(token, secret) as { sub: string };

    if (!decodedToken?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messageData = await req.json();
    const { content, senderId, receiverId, conversationId } = messageData;

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
