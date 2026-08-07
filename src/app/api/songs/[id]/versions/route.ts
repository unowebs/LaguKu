import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

function getUserId(s: any) {
  return s?.user?.id;
}

// GET /api/songs/[id]/versions — list all versions
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const versions = await prisma.songVersion.findMany({
      where: { songId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true } } },
    });
    const data = versions.map((v: any) => ({
      id: v.id,
      label: v.label,
      userName: v.user.name,
      createdAt: v.createdAt.toISOString(),
    }));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/songs/[id]/versions
// Body: { versionId: string } → restore version
// Body: { label: string }   → create snapshot
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  try {
    // Case 1: Restore a specific version
    if (body.versionId) {
      const version = await prisma.songVersion.findUnique({ where: { id: body.versionId } });
      if (!version || version.songId !== id) {
        return NextResponse.json({ success: false, error: 'Versi tidak ditemukan' }, { status: 404 });
      }
      const song = await prisma.song.findFirst({ where: { id, ownerId: userId } });
      if (!song) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

      // Save current state as new version before restoring
      await prisma.songVersion.create({
        data: {
          songId: id,
          userId,
          content: song.content as object,
          label: `Sebelum restore ${new Date().toLocaleTimeString('id-ID')}`,
        },
      });

      // Restore
      const updated = await prisma.song.update({
        where: { id },
        data: {
          content: version.content as object,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // Case 2: Create snapshot
    if (body.label !== undefined) {
      const song = await prisma.song.findFirst({ where: { id, ownerId: userId } });
      if (!song) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

      const snapshot = await prisma.songVersion.create({
        data: {
          songId: id,
          userId,
          content: song.content as object,
          label: body.label || `Snapshot ${new Date().toLocaleTimeString('id-ID')}`,
        },
        include: { user: { select: { name: true } } },
      });

      // Keep only 50 newest versions
      const allVersions = await prisma.songVersion.findMany({
        where: { songId: id },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (allVersions.length > 50) {
        const toDelete = allVersions.slice(50).map((v: any) => v.id);
        await prisma.songVersion.deleteMany({ where: { id: { in: toDelete } } });
      }

      return NextResponse.json({
        success: true,
        data: {
          id: snapshot.id,
          label: snapshot.label,
          userName: (snapshot as any).user.name,
          createdAt: snapshot.createdAt.toISOString(),
        },
      }, { status: 201 });
    }

    return NextResponse.json({ success: false, error: 'Body tidak valid' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
