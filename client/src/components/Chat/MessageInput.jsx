import { useState, useRef, useCallback } from 'react';

export default function MessageInput({ onSend, onTyping }) {
  const [text, setText] = useState('');
  const typingRef = useRef(false);
  const typingTimer = useRef(null);

  const handleChange = (e) => {
    setText(e.target.value);
    if (!typingRef.current) {
      typingRef.current = true;
      onTyping(true);
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      typingRef.current = false;
      onTyping(false);
    }, 1500);
  };

  const handleSend = useCallback(() => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
    clearTimeout(typingTimer.current);
    typingRef.current = false;
    onTyping(false);
  }, [text, onSend, onTyping]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div style={{
      padding: '10px 16px 14px', borderTop: '0.5px solid #ffffff12'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, background: '#161920',
        border: '0.5px solid #ffffff12', borderRadius: 8, padding: '8px 12px',
      }}>
        <input
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#e8eaf0', fontFamily: 'inherit' }}
          placeholder="Send a message..."
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleSend}
          style={{
            background: text.trim() ? '#4f6ef7' : '#ffffff10', border: 'none', borderRadius: 5,
            width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 14, transition: 'background .15s'
          }}>
          ➤
        </button>
      </div>
    </div>
  );
}
