'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useEditorStore } from '@/store/editorStore';
import { CollaboratorInfo, ChatMessage, Song, EditorSelection } from '@/types';
import { getCollaboratorColor } from '@/lib/utils';
import toast from 'react-hot-toast';

const WS_URL = process.env.NEXT_PUBLIC_WS_SERVER_URL || 'http://localhost:3001';

export function useCollaboration(roomCode: string | undefined, user: { id: string; name: string } | null) {
  const socketRef = useRef<Socket | null>(null);
  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { song, setSong, selection } = useEditorStore();
  const lastSentSongJson = useRef<string>('');

  // Setup connection
  useEffect(() => {
    if (!roomCode || !user) return;

    const socket = io(WS_URL);
    socketRef.current = socket;

    const userColor = getCollaboratorColor(Math.floor(Math.random() * 100));

    socket.on('connect', () => {
      console.log('Connected to collaboration server');
      socket.emit('join-room', {
        roomCode,
        userId: user.id,
        name: user.name,
        color: userColor,
      });
    });

    socket.on('collaborators-changed', (list: CollaboratorInfo[]) => {
      // Filter out self
      setCollaborators(list.filter((c) => c.userId !== user.id));
    });

    socket.on('song-updated', (updatedSong: Song) => {
      const updatedJson = JSON.stringify(updatedSong);
      if (updatedJson !== JSON.stringify(useEditorStore.getState().song)) {
        lastSentSongJson.current = updatedJson;
        setSong(updatedSong);
        toast.success('Lagu diperbarui oleh rekan kolaborasi', { id: 'collab-sync' });
      }
    });

    socket.on('receive-message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('connect_error', () => {
      console.warn('Realtime server connection failed. Running in local mode.');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomCode, user, setSong]);

  // Sync song changes
  useEffect(() => {
    if (!roomCode || !song || !socketRef.current) return;
    
    const songJson = JSON.stringify(song);
    if (songJson !== lastSentSongJson.current) {
      lastSentSongJson.current = songJson;
      socketRef.current.emit('song-edit', { roomCode, song });
    }
  }, [song, roomCode]);

  // Sync cursor position
  useEffect(() => {
    if (!roomCode || !socketRef.current) return;
    socketRef.current.emit('cursor-move', { roomCode, selection });
  }, [selection, roomCode]);

  // Send message
  const sendMessage = useCallback((content: string) => {
    if (!roomCode || !user || !socketRef.current) return;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      userId: user.id,
      userName: user.name,
      content,
      createdAt: new Date().toISOString(),
    };
    socketRef.current.emit('send-message', { roomCode, message: msg });
  }, [roomCode, user]);

  // Set typing status
  const sendTypingStatus = useCallback((isTyping: boolean) => {
    if (!roomCode || !socketRef.current) return;
    socketRef.current.emit('typing-status', { roomCode, isTyping });
  }, [roomCode]);

  return {
    collaborators,
    messages,
    sendMessage,
    sendTypingStatus,
  };
}
