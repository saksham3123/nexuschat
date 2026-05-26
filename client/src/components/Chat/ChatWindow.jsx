import { useEffect, useRef } from 'react';
import { useMessages } from '../../hooks/useMessages';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

export default function ChatWindow({ room }) {
  const { messages, loading, hasMore, typingUsers, loadMore, sendMessage, sendTyping, reactToMessage } = useMessages(room?._id);
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const typingList = Object.values(typingUsers);

  if (!room) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 14 }}>
      Select a room to start chatting
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0d0f14', minWidth: 0 }}>
      {/* Header */}
      <div style={{ padding: '12px 18px', borderBottom: '0.5px solid #ffffff12', background: '#111318', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16, color: '#4f6ef7', fontFamily: 'monospace' }}>#</span>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: '#e8eaf0' }}>{room.name}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>
          {room.members?.length} members
        </span>
      </div>

      {/* Messages */}
      <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {hasMore && (
          <button onClick={loadMore} disabled={loading}
            style={{ background: '#ffffff08', border: '0.5px solid #ffffff12', color: '#9098b0', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, alignSelf: 'center', marginBottom: 8 }}>
            {loading ? 'Loading...' : '↑ Load older messages'}
          </button>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg._id} message={msg} onReact={reactToMessage} />
        ))}

        {/* Typing indicator */}
        {typingList.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', color: '#6b7280', fontSize: 11 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#22d3a0', display: 'inline-block', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
              ))}
            </div>
            {typingList.join(', ')} {typingList.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={sendMessage} onTyping={sendTyping} />
    </div>
  );
}
