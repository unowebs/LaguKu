import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateRoomCode } from '@/lib/utils';

function getUserId(s: any) {
  return s?.user?.id;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const { songId, code } = await req.json();
    const song = await prisma.song.findFirst({ where: { id: songId, ownerId: userId } });
    if (!song) return NextResponse.json({ success: false, error: 'Song not found' }, { status: 404 });

    const existing = await prisma.room.findUnique({ where: { songId } });
    if (existing) return NextResponse.json({ success: true, data: existing });

    const roomCode = code?.trim().toUpperCase() || generateRoomCode();
    const codeExists = await prisma.room.findUnique({ where: { code: roomCode } });
    if (codeExists) {
      return NextResponse.json({ success: false, error: 'Kode sudah digunakan' }, { status: 409 });
    }

    const room = await prisma.room.create({
      data: {
        code: roomCode, songId, ownerId: userId,
        members: { create: { userId, permission: 'OWNER' } },
      },
    });
    return NextResponse.json({ success: true, data: room }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const code = new URL(req.url).searchParams.get('code');
  if (!code) return NextResponse.json({ success: false, error: 'Code required' }, { status: 400 });

  try {
    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        song: { select: { id: true, title: true, ownerId: true } },
        members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      },
    });
    if (!room) return NextResponse.json({ success: false, error: 'Room tidak ditemukan' }, { status: 404 });

    const isMember = room.members.some((m: any) => m.userId === userId);
    if (!isMember && !room.isLocked) {
      await prisma.roomMember.create({ data: { roomId: room.id, userId, permission: 'VIEWER' } });
    } else if (!isMember && room.isLocked) {
      return NextResponse.json({ success: false, error: 'Room dikunci' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: room });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
