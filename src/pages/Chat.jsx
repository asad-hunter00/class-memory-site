import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Send, Trash2, ImagePlus } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useToast } from '../lib/ui.jsx';
import { uploadToCloud, optimize } from '../lib/upload.js';
import { connectSocket } from '../lib/socket.js';
import { Avatar, Empty, Loading } from '../components/common.jsx';

const dayKey = (m) => m.dateFormatted;

export default function Chat() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [channels, setChannels] = useState(null);
  const [cur, setCur] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [text, setText] = useState('');
  const [typers, setTyers] = useState({});
  const [uploading, setUploading] = useState(false);
  const box = useRef(null);
  const stick = useRef(true);
  const typingTimer = useRef(null);
  const fileRef = useRef(null);
  const curRef = useRef(null);
  curRef.current = cur;

  useEffect(() => {
    api.get('/channels').then((c) => { setChannels(c); setCur((c.find((x) => x.name === 'general') || c[0])?.id || null); }).catch((e) => toast(e.message, 'bad'));
    // eslint-disable-next-line
  }, []);

  // Kanal almashganda: tarix + real-time
  useEffect(() => {
    if (!cur) return;
    const s = connectSocket();
    setMsgs([]); setTyers({}); setLoadingMsgs(true); stick.current = true;

    const onHist = (d) => { if (d.channelId !== cur) return; setMsgs(d.messages); setHasOlder(d.messages.length >= 50); setLoadingMsgs(false); };
    const onNew = (m) => {
      if (m.channelId !== cur) return;
      setMsgs((c) => (c.some((x) => x.id === m.id) ? c : [...c, m]));
      setTyers((t) => { const n = { ...t }; delete n[m.sender?.id]; return n; });
    };
    const onTyping = (d) => {
      if (d.channelId !== cur || d.user.id === user.id) return;
      setTyers((t) => { const n = { ...t }; if (d.isTyping) n[d.user.id] = d.user.fullName.split(' ')[0]; else delete n[d.user.id]; return n; });
    };
    const onErr = (e) => toast(e?.message || 'Xabar yuborilmadi', 'bad');
    const join = () => s.emit('join_channel', { channelId: cur });
    s.on('channel_history', onHist); s.on('new_message', onNew); s.on('typing_status', onTyping); s.on('message_error', onErr); s.on('connect', join);
    if (s.connected) join();
    // zaxira: socket ulanmasa REST orqali
    const fallback = setTimeout(() => {
      if (!s.connected) api.list('/messages', { channelId: cur, limit: 50 }).then(({ items }) => { setMsgs(items); setHasOlder(items.length >= 50); setLoadingMsgs(false); }).catch(() => setLoadingMsgs(false));
    }, 4000);
    return () => { clearTimeout(fallback); s.emit('leave_channel', { channelId: cur }); s.off('channel_history', onHist); s.off('new_message', onNew); s.off('typing_status', onTyping); s.off('message_error', onErr); s.off('connect', join); };
    // eslint-disable-next-line
  }, [cur]);

  useLayoutEffect(() => { if (stick.current && box.current) box.current.scrollTop = box.current.scrollHeight; }, [msgs]);
  const onScroll = () => { const b = box.current; stick.current = b.scrollHeight - b.scrollTop - b.clientHeight < 80; };

  const older = async () => {
    const first = msgs[0]; if (!first) return;
    const prevH = box.current.scrollHeight; stick.current = false;
    try {
      const { items } = await api.list('/messages', { channelId: cur, limit: 50, before: first.createdAt });
      setMsgs((c) => [...items, ...c]); setHasOlder(items.length >= 50);
      requestAnimationFrame(() => { box.current.scrollTop = box.current.scrollHeight - prevH; });
    } catch (e) { toast(e.message, 'bad'); }
  };

  const send = (mediaUrl) => {
    const s = connectSocket(); const t = text.trim();
    if (!t && !mediaUrl) return;
    s.emit('send_message', { channelId: cur, text: t, mediaUrl: mediaUrl || undefined, mediaType: mediaUrl ? 'image' : undefined });
    s.emit('user_typing', { channelId: cur, isTyping: false });
    setText(''); stick.current = true;
  };
  const onType = (e) => {
    setText(e.target.value);
    const s = connectSocket();
    s.emit('user_typing', { channelId: cur, isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => s.emit('user_typing', { channelId: cur, isTyping: false }), 1800);
  };
  const onFile = async (e) => {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
    setUploading(true);
    try { const r = await uploadToCloud(f); send(r.url); } catch (er) { toast(er.message, 'bad'); } finally { setUploading(false); }
  };
  const remove = async (id) => {
    try { await api.del(`/messages/${id}`); setMsgs((c) => c.filter((m) => m.id !== id)); } catch (e) { toast(e.message, 'bad'); }
  };

  if (!channels) return <Loading />;
  const channel = channels.find((c) => c.id === cur);
  const names = Object.values(typers);

  return (
    <div className="card chat">
      <div className="chan-list">
        <div className="nav-label" style={{ color: 'var(--ink3)', padding: '4px 10px 8px' }}>Kanallar</div>
        {channels.map((c) => <button key={c.id} className={`chan ${c.id === cur ? 'on' : ''}`} onClick={() => setCur(c.id)}><span className="hash">#</span>{c.name}</button>)}
      </div>
      <div className="chat-main">
        <div className="chat-head"><h3># {channel?.name}</h3><span className="small muted">{channel?.description}</span></div>
        <div className="msgs" ref={box} onScroll={onScroll}>
          {loadingMsgs && <Loading />}
          {hasOlder && <button className="btn sm load-more" onClick={older}>Eski xabarlarni yuklash</button>}
          {!loadingMsgs && msgs.length === 0 && <Empty emoji="💬" title="Hali jim-jit">Birinchi xabarni yozing: "ertaga hamma maktabga keladimi?"</Empty>}
          {msgs.map((m, i) => {
            const prev = msgs[i - 1]; const mineMsg = m.sender?.id === user.id;
            const newDay = !prev || dayKey(prev) !== dayKey(m);
            const cont = prev && !newDay && prev.sender?.id === m.sender?.id;
            return (
              <div key={m.id}>
                {newDay && <div className="day-sep"><span>{m.dateFormatted}</span></div>}
                <div className={`msg ${mineMsg ? 'mine' : ''} ${cont ? 'cont' : ''}`} style={{ marginTop: cont ? 2 : 10 }}>
                  {!mineMsg && (cont ? <div style={{ width: 34, flex: 'none' }} /> : <Avatar user={m.sender} size={34} />)}
                  <div className="b">
                    {!mineMsg && !cont && <span className="who">{m.sender?.fullName}</span>}
                    {m.mediaUrl && <img src={optimize(m.mediaUrl, 600)} alt="" />}
                    {m.text && <span className="t">{m.text}</span>}
                    <span className="tm">{m.timeFormatted}</span>
                    {(mineMsg || isAdmin) && <button className="del" onClick={() => remove(m.id)} aria-label="O'chirish"><Trash2 size={13} /></button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="typing">{names.length > 0 && `${names.join(', ')} yozmoqda…`}</div>
        <div className="chat-input">
          <button className="icon-btn" onClick={() => fileRef.current.click()} disabled={uploading} aria-label="Rasm yuborish">{uploading ? <span className="spin" /> : <ImagePlus size={22} />}</button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
          <textarea className="textarea grow" rows={1} placeholder="Xabar yozing…" value={text} maxLength={2000} onChange={onType}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button className="btn primary" onClick={() => send()} disabled={!text.trim()} aria-label="Yuborish"><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
}
