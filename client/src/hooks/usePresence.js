import { useState, useEffect } from 'react';
import { getSocket } from '../utils/socket';

export const usePresence = (initialUsers = []) => {
  const [onlineUsers, setOnlineUsers] = useState(
    new Set(initialUsers.filter((u) => u.isOnline).map((u) => u._id))
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onOnline = ({ userId }) => setOnlineUsers((prev) => new Set([...prev, userId]));
    const onOffline = ({ userId }) =>
      setOnlineUsers((prev) => { const n = new Set(prev); n.delete(userId); return n; });

    socket.on('user:online', onOnline);
    socket.on('user:offline', onOffline);

    return () => {
      socket.off('user:online', onOnline);
      socket.off('user:offline', onOffline);
    };
  }, []);

  const isOnline = (userId) => onlineUsers.has(userId);
  return { onlineUsers, isOnline };
};
