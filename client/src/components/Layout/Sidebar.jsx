import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePresence } from '../../hooks/usePresence';
import api from '../../utils/api';

export default function Sidebar({ activeRoom, onSelectRoom }) {
  const { user, logout } = useAuth();
  const [rooms, setRooms] = useState([]);
  const { isOnline } = usePresence();

  useEffect(() => {
    api.get('/rooms').then(({ data }) => setRooms(data)).catch(console.error);
  }, []);

  const groups = rooms.filter((r) => r.type === 'group');
  const dms = rooms.filter((r) => r.type === 'direct');

  const getDmName = (room) => {
    const other = room.members?.find((m) => m._id !== user?._id);
    return other?.username || 'Unknown';
  };

  return (
    <div style={{ width: 220, background: '#111318', borderRight: '0.5px solid #ffffff12', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Brand */}
      <div style={{ padding: '16px 14px 12px', borderBottom: '0.5px solid #ffffff12' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e8eaf0', display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4f6ef7', display: 'inline-block' }} />
          NexusChat
        </div>
        <div style={{ fontSize: 10, color: '#22d3a0', fontFamily: 'monospace', marginTop: 4 }}>
          ● connected
        </div>
      </div>

      {/* Channels */}
      <div style={{ fontSize: 9, letterSpacing: '0.1em', color: '#6b7280', padding: '10px 14px 5px', textTransform: 'uppercase' }}>Channels</div>
      <div style={{ padding: '0 7px' }}>
        {groups.map((room) => (
          <div key={room._id} onClick={() => onSelectRoom(room)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 7px', borderRadius: 6, cursor: 'pointer',
              background: activeRoom?._id === room._id ? '#4f6ef718' : 'transparent' }}>
            <span style={{ color: activeRoom?._id === room._id ? '#4f6ef7' : '#6b7280', fontFamily: 'monospace' }}>#</span>
            <span style={{ fontSize: 12.5, color: activeRoom?._id === room._id ? '#e8eaf0' : '#9098b0' }}>{room.name}</span>
          </div>
        ))}
      </div>

      {/* DMs */}
      <div style={{ fontSize: 9, letterSpacing: '0.1em', color: '#6b7280', padding: '10px 14px 5px', textTransform: 'uppercase' }}>Direct Messages</div>
      <div style={{ padding: '0 7px', flex: 1, overflow: 'auto' }}>
        {dms.map((room) => {
          const other = room.members?.find((m) => m._id !== user?._id);
          return (
            <div key={room._id} onClick={() => onSelectRoom(room)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 7px', borderRadius: 6, cursor: 'pointer',
                background: activeRoom?._id === room._id ? '#22d3a018' : 'transparent' }}>
              <div style={{ position: 'relative', width: 22, height: 22, borderRadius: '50%', background: '#22d3a015', color: '#22d3a0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
                {getDmName(room).slice(0, 2).toUpperCase()}
                {other && isOnline(other._id) && (
                  <span style={{ position: 'absolute', bottom: -1, right: -1, width: 6, height: 6, borderRadius: '50%', background: '#22d3a0', border: '1.5px solid #111318' }} />
                )}
              </div>
              <span style={{ fontSize: 12, color: activeRoom?._id === room._id ? '#e8eaf0' : '#9098b0' }}>{getDmName(room)}</span>
            </div>
          );
        })}
      </div>

      {/* Current user */}
      <div style={{ padding: '10px 12px', borderTop: '0.5px solid #ffffff12', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#4f6ef722', color: '#4f6ef7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
          {user?.username?.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#e8eaf0', fontWeight: 600 }}>{user?.username}</div>
          <div style={{ fontSize: 10, color: '#22d3a0', fontFamily: 'monospace' }}>● online</div>
        </div>
        <button onClick={logout} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 16 }} title="Logout">⏻</button>
      </div>
    </div>
  );
}
