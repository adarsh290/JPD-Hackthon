import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiConfig } from '@/lib/api';

export const useRealtimeAnalytics = (hubId: number | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!hubId) return;

    // In development, the proxy handles /socket.io
    // In production, it might need the full URL
    const newSocket = io(window.location.origin, {
      path: '/socket.io',
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to realtime analytics');
      newSocket.emit('join-hub-analytics', hubId);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [hubId]);

  return socket;
};
