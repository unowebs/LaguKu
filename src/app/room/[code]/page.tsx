'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Copy, Check, Music, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface RoomInfo {
  id: string;
  code: string;
  songId: string;
  isLocked: boolean;
  song: { id: string; title: string };
  members: Array<{
    user: { id: string; name: string; avatar?: string };
    permission: string;
  }>;
}

export default function RoomPage() {
  const { code } = useParams() as { code: string };
  const router = useRouter();
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function joinRoom() {
      try {
        const res = await fetch(`/api/rooms?code=${code}`);
        const data = await res.json();
        if (data.success) {
          setRoom(data.data);
        } else {
          toast.error(data.error || 'Room tidak ditemukan');
          router.push('/dashboard');
        }
      } catch {
        toast.error('Gagal bergabung ke room');
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    }
    if (code) joinRoom();
  }, [code, router]);

  async function copyLink() {
    const url = `${window.location.origin}/room/${code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link tersalin!');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--music-bg)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--music-accent)', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: 'var(--music-muted)' }}>Bergabung ke room...</p>
        </div>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--music-bg)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
            <Music size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--music-text)' }}>
            {room.song.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--music-muted)' }}>
            Room kolaborasi aktif
          </p>
        </div>

        <div className="rounded-2xl border p-6 space-y-4"
          style={{ background: 'var(--music-surface)', borderColor: 'var(--music-border)' }}>
          {/* Room code */}
          <div className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'var(--music-surface-2)' }}>
            <div>
              <p className="text-xs" style={{ color: 'var(--music-muted)' }}>Kode Room</p>
              <p className="font-mono font-bold text-xl tracking-widest"
                style={{ color: 'var(--music-accent)' }}>{code}</p>
            </div>
            <button onClick={copyLink}
              className="toolbar-icon-btn w-9 h-9"
              title="Salin link">
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
          </div>

          {/* Members */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--music-muted)' }}>
              <Users size={12} className="inline mr-1" />
              {room.members.length} Anggota
            </p>
            <div className="space-y-2">
              {room.members.map((member, i) => (
                <div key={member.user.id}
                  className="flex items-center gap-2 p-2 rounded-lg"
                  style={{ background: 'var(--music-surface-2)' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{
                      background: `hsl(${(i * 60) % 360}, 70%, 50%)`,
                    }}>
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm flex-1" style={{ color: 'var(--music-text)' }}>
                    {member.user.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: member.permission === 'OWNER'
                        ? 'rgba(99,102,241,0.15)' : 'var(--music-surface)',
                      color: member.permission === 'OWNER'
                        ? 'var(--music-accent)' : 'var(--music-muted)',
                    }}>
                    {member.permission}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Enter editor */}
          <Link
            href={`/editor/${room.songId}`}
            className="btn-primary w-full justify-center py-3"
          >
            Mulai Edit Bersama <ArrowRight size={18} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
