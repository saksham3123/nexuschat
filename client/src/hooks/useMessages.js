import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../utils/socket';
import api from '../utils/api';

export const useMessages = (roomId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimers = useRef({});

  // Initial load
  useEffect(() => {
    if (!roomId) return;
    setMessages([]);
    setNextCursor(null);
    setHasMore(true);
    fetchMessages(null, true);
  }, [roomId]);

  // Socket listeners
  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('room:join', roomId);

    const onNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const onTyping = ({ userId, username, isTyping }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (isTyping) next[userId] = username;
        else delete next[userId];
        return next;
      });
      // Auto-clear after 3s
      clearTimeout(typingTimers.current[userId]);
      if (isTyping) {
        typingTimers.current[userId] = setTimeout(() => {
          setTypingUsers((prev) => { const n = { ...prev }; delete n[userId]; return n; });
        }, 3000);
      }
    };

    const onReacted = ({ messageId, reactions }) => {
      setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, reactions } : m));
    };

    socket.on('message:new', onNewMessage);
    socket.on('typing:update', onTyping);
    socket.on('message:reacted', onReacted);

    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('typing:update', onTyping);
      socket.off('message:reacted', onReacted);
    };
  }, [roomId]);

  const fetchMessages = useCallback(async (cursor = null, reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = { limit: 30 };
      if (cursor) params.cursor = cursor;
      const { data } = await api.get(`/messages/${roomId}`, { params });
      setMessages((prev) => reset ? data.messages : [...data.messages, ...prev]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('fetchMessages error:', err);
    } finally {
      setLoading(false);
    }
  }, [roomId, loading]);

  const loadMore = () => {
    if (hasMore && nextCursor) fetchMessages(nextCursor);
  };

  const sendMessage = (content) => {
    const socket = getSocket();
    if (!socket || !content.trim()) return;
    socket.emit('message:send', { roomId, content });
  };

  const sendTyping = (isTyping) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit(isTyping ? 'typing:start' : 'typing:stop', { roomId });
  };

  const reactToMessage = (messageId, emoji) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('message:react', { messageId, emoji, roomId });
  };

  return { messages, loading, hasMore, typingUsers, loadMore, sendMessage, sendTyping, reactToMessage };
};
