import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const EMOJIS = ['👍', '❤️', '🔥', '😂', '🚀'];

export default function MessageBubble({ message, onReact }) {
  const { user } = useAuth();
  const isOwn = message.sender._id === user?._id;

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '4px 0' }}>
      {/* Avatar */}
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: isOwn ? '#4f6ef722' : '#22d3a015',
        color: isOwn ? '#4f6ef7' : '#22d3a0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700
      }}>
        {message.sender.username.slice(0, 2).toUpperCase()}
      </div>

      <div style={{ flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: isOwn ? '#4f6ef7' : '#e8eaf0' }}>
            {isOwn ? 'You' : message.sender.username}
          </span>
          <span style={{ fontSize: 10, color: '#6b7280', fontFamily: 'monospace' }}>
            {format(new Date(message.createdAt), 'hh:mm a')}
          </span>
          {message.sender.isOnline && (
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22d3a0', display: 'inline-block' }} />
          )}
        </div>

        {/* Content */}
        <div style={{ fontSize: 13, color: '#9098b0', lineHeight: 1.55 }}>{message.content}</div>

        {/* Reactions */}
        {message.reactions?.length > 0 && (
          <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
            {message.reactions.filter((r) => r.users.length > 0).map((r) => (
              <button key={r.emoji} onClick={() => onReact(message._id, r.emoji)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '2px 7px',
                  background: r.users.includes(user?._id) ? '#4f6ef720' : '#ffffff08',
                  border: `0.5px solid ${r.users.includes(user?._id) ? '#4f6ef740' : '#ffffff12'}`,
                  borderRadius: 10, cursor: 'pointer', fontSize: 12
                }}>
                {r.emoji}
                <span style={{ fontSize: 10, color: '#6b7280', fontFamily: 'monospace' }}>{r.users.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Quick react */}
        <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
          {EMOJIS.map((emoji) => (
            <button key={emoji} onClick={() => onReact(message._id, emoji)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, opacity: 0.3, padding: 1 }}
              onMouseEnter={(e) => (e.target.style.opacity = '1')}
              onMouseLeave={(e) => (e.target.style.opacity = '0.3')}>
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
