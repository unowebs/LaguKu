import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createEmptySong } from '@/utils/noteAngka';

// GET /api/songs — list user's songs
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as { id?: string })?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session!.user as { id: string }).id;

  try {
    const songs = await prisma.song.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        composer: true,
        key: true,
        timeSignature: true,
        tempo: true,
        isPublic: true,
        updatedAt: true,
        createdAt: true,
        room: { select: { code: true } },
      },
    });
    return NextResponse.json({ success: true, data: songs });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/songs — create new song
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as { id?: string })?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session!.user as { id: string }).id;

  try {
    const body = await req.json();
    const { title = 'Lagu Baru', composer = '', key = 'C', timeSignature = '4/4', tempo = 80, genre, content } = body;

    const song = await prisma.song.create({
      data: {
        title, composer, key, timeSignature, tempo,
        genre: genre || null,
        content: content ?? createEmptySong(),
        ownerId: userId,
      },
    });
    return NextResponse.json({ success: true, data: song }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
