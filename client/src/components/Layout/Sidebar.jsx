import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePresence } from '../../hooks/usePresence';
import api from '../../utils/api';

/* ─── Tiny modal backdrop ─────────────────────────────────────────────────── */
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#161920', border: '1px solid #ffffff18',
        borderRadius: 14, width: 420, maxWidth: '95vw', maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #ffffff10',
        }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#e8eaf0' }}>{title}</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#6b7280',
            cursor: 'pointer', fontSize: 18, lineHeight: 1,
            transition: 'color 0.2s',
          }}
            onMouseEnter={(e) => e.target.style.color = '#e8eaf0'}
            onMouseLeave={(e) => e.target.style.color = '#6b7280'}
          >✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Input styled helper ─────────────────────────────────────────────────── */
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: '#0d0f14', border: '1px solid #ffffff18',
  borderRadius: 8, padding: '9px 12px',
  color: '#e8eaf0', fontSize: 13, outline: 'none',
  fontFamily: "'Sora', sans-serif",
  transition: 'border-color 0.2s',
};

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: '#6b7280', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em',
};

const btnPrimary = {
  background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
  border: 'none', borderRadius: 8, padding: '9px 20px',
  color: '#fff', fontWeight: 700, fontSize: 13,
  cursor: 'pointer', transition: 'opacity 0.2s',
};

/* ─── Create Room Modal ───────────────────────────────────────────────────── */
function CreateRoomModal({ onClose, onCreated, allUsers, currentUserId }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleUser = (uid) => {
    setSelectedUsers((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
    );
  };

  const submit = async () => {
    if (!name.trim()) { setError('Room name is required'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/rooms', {
        name: name.trim(),
        description: description.trim(),
        members: selectedUsers,
      });
      onCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    } finally { setLoading(false); }
  };

  return (
    <Modal title="✦ Create Channel" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>Channel Name *</label>
          <input
            style={inputStyle} value={name} placeholder="e.g. general"
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => e.target.style.borderColor = '#4f6ef7'}
            onBlur={(e) => e.target.style.borderColor = '#ffffff18'}
          />
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <input
            style={inputStyle} value={description} placeholder="What's this channel about?"
            onChange={(e) => setDescription(e.target.value)}
            onFocus={(e) => e.target.style.borderColor = '#4f6ef7'}
            onBlur={(e) => e.target.style.borderColor = '#ffffff18'}
          />
        </div>
        <div>
          <label style={labelStyle}>Add Members</label>
          <div style={{
            maxHeight: 160, overflowY: 'auto', display: 'flex',
            flexDirection: 'column', gap: 4, marginTop: 2,
          }}>
            {allUsers.map((u) => {
              const checked = selectedUsers.includes(u._id);
              return (
                <label key={u._id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
                  background: checked ? '#4f6ef712' : 'transparent',
                  transition: 'background 0.15s',
                }}>
                  <input
                    type="checkbox" checked={checked}
                    onChange={() => toggleUser(u._id)}
                    style={{ accentColor: '#4f6ef7', width: 14, height: 14 }}
                  />
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: '#4f6ef720', color: '#4f6ef7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, flexShrink: 0,
                  }}>
                    {u.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 12.5, color: '#d1d5db' }}>{u.username}</span>
                  {u.isOnline && (
                    <span style={{
                      marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%',
                      background: '#22d3a0', flexShrink: 0,
                    }} />
                  )}
                </label>
              );
            })}
          </div>
        </div>
        {error && <div style={{ fontSize: 12, color: '#f87171' }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid #ffffff18',
            borderRadius: 8, padding: '9px 20px',
            color: '#9098b0', cursor: 'pointer', fontSize: 13,
          }}>Cancel</button>
          <button onClick={submit} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Creating…' : 'Create Channel'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Join Room Modal ─────────────────────────────────────────────────────── */
function JoinRoomModal({ onClose, onJoined, myRoomIds }) {
  const [allRooms, setAllRooms] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/rooms/browse')
      .then(({ data }) => setAllRooms(data))
      .catch(() => setError('Could not load rooms'))
      .finally(() => setLoading(false));
  }, []);

  const joinRoom = async (roomId) => {
    setJoining(roomId);
    try {
      const { data } = await api.post(`/rooms/${roomId}/join`);
      onJoined(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room');
    } finally { setJoining(null); }
  };

  const filtered = allRooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal title="🔍 Browse Channels" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          style={inputStyle} placeholder="Search channels…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={(e) => e.target.style.borderColor = '#4f6ef7'}
          onBlur={(e) => e.target.style.borderColor = '#ffffff18'}
          autoFocus
        />
        {loading ? (
          <div style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            Loading channels…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            No channels found
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map((room) => {
              const isMember = myRoomIds.includes(room._id);
              return (
                <div key={room._id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 9,
                  background: '#0d0f14', border: '1px solid #ffffff10',
                  transition: 'border-color 0.2s',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: 'linear-gradient(135deg, #4f6ef720, #7c3aed20)',
                    color: '#4f6ef7', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 16, flexShrink: 0,
                  }}>
                    #
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0', marginBottom: 2 }}>
                      {room.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {room.description || 'No description'} · {room.members?.length || 0} members
                    </div>
                  </div>
                  {isMember ? (
                    <span style={{
                      fontSize: 11, color: '#22d3a0', background: '#22d3a012',
                      padding: '4px 10px', borderRadius: 20, fontWeight: 600,
                    }}>Joined</span>
                  ) : (
                    <button
                      onClick={() => joinRoom(room._id)}
                      disabled={joining === room._id}
                      style={{
                        background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
                        border: 'none', borderRadius: 7, padding: '6px 14px',
                        color: '#fff', fontWeight: 600, fontSize: 12,
                        cursor: 'pointer', flexShrink: 0,
                        opacity: joining === room._id ? 0.6 : 1,
                      }}
                    >
                      {joining === room._id ? '…' : 'Join'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {error && <div style={{ fontSize: 12, color: '#f87171' }}>{error}</div>}
      </div>
    </Modal>
  );
}

/* ─── Start DM Modal ──────────────────────────────────────────────────────── */
function StartDMModal({ onClose, onStarted, allUsers }) {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  const startDM = async (targetUserId) => {
    setLoading(targetUserId);
    try {
      const { data } = await api.post('/rooms/direct', { targetUserId });
      onStarted(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start DM');
    } finally { setLoading(null); }
  };

  const filtered = allUsers.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal title="💬 New Direct Message" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          style={inputStyle} placeholder="Search users…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={(e) => e.target.style.borderColor = '#22d3a0'}
          onBlur={(e) => e.target.style.borderColor = '#ffffff18'}
          autoFocus
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {filtered.map((u) => (
            <button
              key={u._id}
              onClick={() => startDM(u._id)}
              disabled={loading === u._id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
                background: '#0d0f14', border: '1px solid #ffffff10',
                transition: 'border-color 0.2s, background 0.2s',
                textAlign: 'left', opacity: loading === u._id ? 0.5 : 1,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#22d3a0'; e.currentTarget.style.background = '#22d3a008'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ffffff10'; e.currentTarget.style.background = '#0d0f14'; }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#22d3a015', color: '#22d3a0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                }}>
                  {u.username.slice(0, 2).toUpperCase()}
                </div>
                {u.isOnline && (
                  <span style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#22d3a0', border: '1.5px solid #161920',
                  }} />
                )}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0' }}>{u.username}</div>
                <div style={{ fontSize: 11, color: u.isOnline ? '#22d3a0' : '#6b7280' }}>
                  {u.isOnline ? '● online' : '○ offline'}
                </div>
              </div>
            </button>
          ))}
        </div>
        {error && <div style={{ fontSize: 12, color: '#f87171' }}>{error}</div>}
      </div>
    </Modal>
  );
}

/* ─── Section header with action button ──────────────────────────────────── */
function SectionHeader({ label, onAction, actionLabel }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px 5px',
    }}>
      <span style={{
        fontSize: 9, letterSpacing: '0.1em',
        color: '#6b7280', textTransform: 'uppercase', fontWeight: 700,
      }}>{label}</span>
      {onAction && (
        <button
          onClick={onAction}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          title={actionLabel}
          style={{
            background: hover ? '#4f6ef720' : 'none',
            border: 'none', cursor: 'pointer',
            color: hover ? '#4f6ef7' : '#6b7280',
            fontSize: 14, lineHeight: 1,
            width: 20, height: 20, borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >+</button>
      )}
    </div>
  );
}

/* ─── Main Sidebar ────────────────────────────────────────────────────────── */
export default function Sidebar({ activeRoom, onSelectRoom }) {
  const { user, logout } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const { isOnline } = usePresence();

  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [showStartDM, setShowStartDM] = useState(false);
  const [onlineOpen, setOnlineOpen] = useState(true);

  const loadRooms = useCallback(() => {
    api.get('/rooms').then(({ data }) => setRooms(data)).catch(console.error);
  }, []);

  const loadUsers = useCallback(() => {
    api.get('/users').then(({ data }) => setAllUsers(data)).catch(console.error);
  }, []);

  useEffect(() => {
    loadRooms();
    loadUsers();
  }, []);

  const groups = rooms.filter((r) => r.type === 'group');
  const dms = rooms.filter((r) => r.type === 'direct');
  const myRoomIds = rooms.map((r) => r._id);

  const getDmName = (room) => {
    const other = room.members?.find((m) => m._id !== user?._id);
    return other?.username || 'Unknown';
  };

  const getDmOther = (room) => room.members?.find((m) => m._id !== user?._id);

  const onlineUsers = allUsers.filter((u) => isOnline(u._id) || u.isOnline);
  const offlineCount = allUsers.length - onlineUsers.length;

  const handleRoomCreated = (newRoom) => {
    setRooms((prev) => [newRoom, ...prev]);
    onSelectRoom(newRoom);
  };

  const handleRoomJoined = (room) => {
    setRooms((prev) => {
      const exists = prev.find((r) => r._id === room._id);
      return exists ? prev : [room, ...prev];
    });
    onSelectRoom(room);
  };

  const handleDMStarted = (room) => {
    setRooms((prev) => {
      const exists = prev.find((r) => r._id === room._id);
      return exists ? prev : [room, ...prev];
    });
    onSelectRoom(room);
  };

  return (
    <>
      <div style={{
        width: 240, background: '#111318',
        borderRight: '0.5px solid #ffffff12',
        display: 'flex', flexDirection: 'column',
        flexShrink: 0, overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {/* ── Brand ─────────────────────────────────────────── */}
        <div style={{ padding: '16px 14px 12px', borderBottom: '0.5px solid #ffffff12' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e8eaf0', display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4f6ef7', display: 'inline-block' }} />
            NexusChat
          </div>
          <div style={{ fontSize: 10, color: '#22d3a0', fontFamily: 'monospace', marginTop: 4 }}>
            ● connected
          </div>
        </div>

        {/* ── Online Users ───────────────────────────────────── */}
        <div
          onClick={() => setOnlineOpen((p) => !p)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px 5px', cursor: 'pointer', userSelect: 'none',
          }}
        >
          <span style={{ fontSize: 9, letterSpacing: '0.1em', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>
            Online — {onlineUsers.length}
          </span>
          <span style={{ fontSize: 9, color: '#6b7280', transition: 'transform 0.2s', display: 'inline-block', transform: onlineOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▾</span>
        </div>

        {onlineOpen && (
          <div style={{ padding: '0 7px', marginBottom: 4 }}>
            {onlineUsers.length === 0 ? (
              <div style={{ padding: '4px 7px', fontSize: 11.5, color: '#4b5563' }}>No one else online</div>
            ) : (
              onlineUsers.map((u) => (
                <div
                  key={u._id}
                  onClick={() => {
                    api.post('/rooms/direct', { targetUserId: u._id })
                      .then(({ data }) => handleDMStarted(data))
                      .catch(console.error);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 7px', borderRadius: 6, cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#22d3a010'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: '#22d3a015', color: '#22d3a0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, fontWeight: 700,
                    }}>
                      {u.username.slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{
                      position: 'absolute', bottom: -1, right: -1,
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#22d3a0', border: '1.5px solid #111318',
                    }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#9aefcd' }}>{u.username}</span>
                </div>
              ))
            )}
            {offlineCount > 0 && (
              <div style={{ padding: '2px 7px 4px', fontSize: 10.5, color: '#374151' }}>
                + {offlineCount} offline
              </div>
            )}
          </div>
        )}

        {/* ── Channels ──────────────────────────────────────── */}
        <SectionHeader
          label="Channels"
          actionLabel="Create Channel"
          onAction={() => setShowCreateRoom(true)}
        />
        {/* Join room link */}
        <button
          onClick={() => setShowJoinRoom(true)}
          style={{
            margin: '0 14px 4px', padding: '5px 8px',
            background: 'none', border: '1px dashed #ffffff18',
            borderRadius: 6, color: '#6b7280', fontSize: 11,
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4f6ef7'; e.currentTarget.style.color = '#4f6ef7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ffffff18'; e.currentTarget.style.color = '#6b7280'; }}
        >
          + Browse &amp; Join Channels
        </button>
        <div style={{ padding: '0 7px' }}>
          {groups.length === 0 ? (
            <div style={{ padding: '4px 7px', fontSize: 11.5, color: '#4b5563' }}>No channels yet</div>
          ) : (
            groups.map((room) => (
              <div
                key={room._id}
                onClick={() => onSelectRoom(room)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 7px', borderRadius: 6, cursor: 'pointer',
                  background: activeRoom?._id === room._id ? '#4f6ef718' : 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { if (activeRoom?._id !== room._id) e.currentTarget.style.background = '#ffffff08'; }}
                onMouseLeave={(e) => { if (activeRoom?._id !== room._id) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ color: activeRoom?._id === room._id ? '#4f6ef7' : '#6b7280', fontFamily: 'monospace' }}>#</span>
                <span style={{ fontSize: 12.5, color: activeRoom?._id === room._id ? '#e8eaf0' : '#9098b0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {room.name}
                </span>
                {room.members?.length > 0 && (
                  <span style={{ fontSize: 9, color: '#4b5563', fontFamily: 'monospace', flexShrink: 0 }}>
                    {room.members.length}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* ── Direct Messages ────────────────────────────────── */}
        <SectionHeader
          label="Direct Messages"
          actionLabel="New DM"
          onAction={() => setShowStartDM(true)}
        />
        <div style={{ padding: '0 7px', flex: 1 }}>
          {dms.length === 0 ? (
            <div style={{ padding: '4px 7px', fontSize: 11.5, color: '#4b5563' }}>No DMs yet — click + to start one</div>
          ) : (
            dms.map((room) => {
              const other = getDmOther(room);
              const online = other && (isOnline(other._id) || other?.isOnline);
              return (
                <div
                  key={room._id}
                  onClick={() => onSelectRoom(room)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 7px', borderRadius: 6, cursor: 'pointer',
                    background: activeRoom?._id === room._id ? '#22d3a018' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { if (activeRoom?._id !== room._id) e.currentTarget.style.background = '#ffffff08'; }}
                  onMouseLeave={(e) => { if (activeRoom?._id !== room._id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ position: 'relative', width: 22, height: 22, flexShrink: 0 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: '#22d3a015', color: '#22d3a0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700,
                    }}>
                      {getDmName(room).slice(0, 2).toUpperCase()}
                    </div>
                    {online && (
                      <span style={{
                        position: 'absolute', bottom: -1, right: -1,
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#22d3a0', border: '1.5px solid #111318',
                      }} />
                    )}
                  </div>
                  <span style={{
                    fontSize: 12, color: activeRoom?._id === room._id ? '#e8eaf0' : '#9098b0',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                  }}>
                    {getDmName(room)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* ── Current User Footer ───────────────────────────── */}
        <div style={{
          padding: '10px 12px', borderTop: '0.5px solid #ffffff12',
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: '#4f6ef722', color: '#4f6ef7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, flexShrink: 0,
          }}>
            {user?.username?.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: '#e8eaf0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.username}
            </div>
            <div style={{ fontSize: 10, color: '#22d3a0', fontFamily: 'monospace' }}>● online</div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            style={{
              background: 'none', border: 'none',
              color: '#6b7280', cursor: 'pointer', fontSize: 16,
              transition: 'color 0.2s', flexShrink: 0,
            }}
            onMouseEnter={(e) => e.target.style.color = '#f87171'}
            onMouseLeave={(e) => e.target.style.color = '#6b7280'}
          >⏻</button>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────── */}
      {showCreateRoom && (
        <CreateRoomModal
          onClose={() => setShowCreateRoom(false)}
          onCreated={handleRoomCreated}
          allUsers={allUsers}
          currentUserId={user?._id}
        />
      )}
      {showJoinRoom && (
        <JoinRoomModal
          onClose={() => setShowJoinRoom(false)}
          onJoined={handleRoomJoined}
          myRoomIds={myRoomIds}
        />
      )}
      {showStartDM && (
        <StartDMModal
          onClose={() => setShowStartDM(false)}
          onStarted={handleDMStarted}
          allUsers={allUsers}
        />
      )}
    </>
  );
}
