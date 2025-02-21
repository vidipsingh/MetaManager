import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function POST(req: Request) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, receiverId } = await req.json();

    // Verify both users exist
    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.user.findUnique({ where: { id: receiverId } })
    ]);

    if (!sender || !receiver) {
      console.error('User not found:', { senderId: userId, receiverId });
      return NextResponse.json(
        { error: 'One or both users not found' },
        { status: 404 }
      );
    }

    // Check if a conversation exists by looking at messages between these users
    let conversation = await prisma.conversation.findFirst({
      where: {
        messages: {
          some: {
            OR: [
              { senderId: userId, receiverId: receiverId },
              { senderId: receiverId, receiverId: userId },
            ],
          },
        },
      },
      include: {
        messages: {
          include: {
            sender: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    // If no conversation exists, create one
    if (!conversation) {
      try {
        conversation = await prisma.conversation.create({
          data: {
            // No users relation needed; we'll rely on messages to link users
            messages: {
              create: [], // Optionally create an initial empty message if needed
            },
          },
          include: {
            messages: {
              include: {
                sender: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        });
      } catch (error) {
        console.error('Error creating conversation:', error);
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error in conversations API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}