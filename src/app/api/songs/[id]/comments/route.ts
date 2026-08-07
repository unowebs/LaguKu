import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// GET /api/songs/[id]/comments
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const song = await prisma.song.findUnique({ where: { id } });
    if (!song) {
      return NextResponse.json({ success: false, error: 'Lagu tidak ditemukan' }, { status: 404 });
    }

    if (!song.isPublic) {
      const session = await getServerSession(authOptions as any);
      const userId = (session as any)?.user?.id;
      if (!userId || song.ownerId !== userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    const comments = await prisma.comment.findMany({
      where: { songId: id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    console.error('GET /api/songs/[id]/comments error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/songs/[id]/comments
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions as any);
    const userId = (session as any)?.user?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { content, lineIndex = 0 } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: 'Komentar tidak boleh kosong' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        songId: id,
        userId,
        content: content.trim(),
        lineIndex,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ success: true, data: comment }, { status: 201 });
  } catch (error) {
    console.error('POST /api/songs/[id]/comments error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
