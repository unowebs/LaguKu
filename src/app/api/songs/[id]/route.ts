import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

function getUserId(session: any) {
  return session?.user?.id;
}

// GET /api/songs/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const song = await prisma.song.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { isPublic: true },
          { room: { members: { some: { userId } } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true } },
        room: { select: { code: true, isLocked: true } },
      },
    });
    if (!song) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: song });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/songs/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const existing = await prisma.song.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { room: { members: { some: { userId, permission: { in: ['OWNER', 'EDITOR'] } } } } },
        ],
      },
    });
    if (!existing) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await req.json();

    // Auto version snapshot
    await prisma.songVersion.create({
      data: { songId: id, content: existing.content as object, userId, label: '' },
    });

    // Prune old versions (keep 50)
    const allVersions = await prisma.songVersion.findMany({
      where: { songId: id }, orderBy: { createdAt: 'desc' }, select: { id: true },
    });
    if (allVersions.length > 50) {
      await prisma.songVersion.deleteMany({
        where: { id: { in: allVersions.slice(50).map((v: any) => v.id) } },
      });
    }

    const updated = await prisma.song.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.composer !== undefined && { composer: body.composer }),
        ...(body.key !== undefined && { key: body.key }),
        ...(body.timeSignature !== undefined && { timeSignature: body.timeSignature }),
        ...(body.tempo !== undefined && { tempo: body.tempo }),
        ...(body.genre !== undefined && { genre: body.genre }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/songs/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const song = await prisma.song.findFirst({ where: { id, ownerId: userId } });
    if (!song) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    await prisma.song.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
