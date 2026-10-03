import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Film, Send, Pin, Pencil } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useToast } from '../lib/ui.jsx';
import { uploadToCloud, optimize } from '../lib/upload.js';
import { getSocket } from '../lib/socket.js';
import { Avatar, Empty, ErrorBox, Loading, PageHead, Who } from '../components/common.jsx';
import { Comments, CommentToggle, DeleteButton, FavButton, ReactionButton } from '../components/Social.jsx';

function Composer({ onPosted }) {
  const { user } = useAuth();
  const toast = useToast();
  const [text, setText] = useState('');
  const [media, setMedia] = useState(null); // {url, type, local}
  const [progress, setProgress] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const accept = useRef('image/*');

  const pick = (kind) => { accept.current = kind === 'video' ? 'video/*' : 'image/*'; fileRef.current.accept = accept.current; fileRef.current.click(); };
  const onFile = async (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    const local = URL.createObjectURL(file);
    setProgress(0); setMedia({ local, type: file.type.startsWith('video') ? 'video' : 'image' });
    try {
      const r = await uploadToCloud(file, setProgress);
      setMedia({ local, url: r.url, type: r.type });
    } catch (er) { toast(er.message, 'bad'); setMedia(null); }
    finally { setProgress(null); }
  };
  const submit = async () => {
    if (!text.trim() || busy || progress !== null) return;
    setBusy(true);
    try {
      const body = { text: text.trim() };
      if (media?.url) body[media.type === 'video' ? 'videoUrl' : 'imageUrl'] = media.url;
      const post = await api.post('/posts', body);
      setText(''); setMedia(null); onPosted(post); toast('Lentaga joylandi ✨');
    } catch (e) { toast(e.message, 'bad'); }
    finally { setBusy(false); }
  };

  return (
    <div className="card composer">
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <Avatar user={user} size={42} />
        <textarea className="textarea grow" placeholder={`${user.fullName.split(' ')[0]}, esingizda nima bor?`} value={text} onChange={(e) => setText(e.target.value)} maxLength={5000} />
      </div>
      {media && (
        <div className="preview">
          {media.type === 'video' ? <video src={media.local} muted /> : <img src={media.local} alt="" />}
          {progress === null && <button className="x" onClick={() => setMedia(null)} aria-label="Olib tashlash">×</button>}
        </div>
      )}
      {progress !== null && <div className="progress" style={{ margin: '6px 0' }}><i style={{ width: progress + '%' }} /></div>}
      <div className="bar">
        <button className="btn ghost sm" onClick={() => pick('image')}><ImagePlus size={18} /> Rasm</button>
        <button className="btn ghost sm" onClick={() => pick('video')}><Film size={18} /> Video</button>
        <input ref={fileRef} type="file" hidden onChange={onFile} />
        <button className="btn primary sm" style={{ marginLeft: 'auto' }} disabled={!text.trim() || busy || progress !== null} onClick={submit}><Send size={16} /> Joylash</button>
      </div>
    </div>
  );
}

function Post({ post, onRemove, onPatch }) {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [showC, setShowC] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(post.text);
  const mine = post.author?.id === user.id;

  const react = (type) => onPatch({ myReaction: type, _count: { ...post._count, reactions: Math.max(0, (post._count?.reactions || 0) + (type ? (post.myReaction ? 0 : 1) : -1)) } });
  const remove = async () => {
    if (!confirm("Post o'chirilsinmi?")) return;
    try { await api.del(`/posts/${post.id}`); onRemove(); } catch (e) { toast(e.message, 'bad'); }
  };
  const save = async () => {
    try { await api.patch(`/posts/${post.id}`, { text: text.trim() }); onPatch({ text: text.trim() }); setEditing(false); } catch (e) { toast(e.message, 'bad'); }
  };

  return (
    <article className={`card post ${post.isPinned ? 'pinned' : ''}`}>
      {post.isPinned && <div className="chip accent" style={{ position: 'absolute', top: -11, right: 16 }}><Pin size={13} /> Muhim</div>}
      <Who user={post.author} item={post} />
      {editing ? (
        <div className="field"><textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="row"><button className="btn primary sm" onClick={save}>Saqlash</button><button className="btn sm" onClick={() => setEditing(false)}>Bekor</button></div></div>
      ) : <p className="post-text">{post.text}</p>}
      {post.imageUrl && <div className="post-media"><img src={optimize(post.imageUrl, 1200)} alt="" loading="lazy" /></div>}
      {post.videoUrl && <div className="post-media"><video src={post.videoUrl} controls preload="metadata" playsInline /></div>}
      <div className="post-actions">
        <ReactionButton kind="post" id={post.id} mine={post.myReaction} onChange={react} />
        {post._count?.reactions > 0 && <span className="small muted" style={{ marginRight: 6 }}>{post._count.reactions}</span>}
        <CommentToggle count={post._count?.comments} open={showC} onClick={() => setShowC(!showC)} />
        <FavButton kind="post" id={post.id} isFav={post.isFavorited} onChange={(v) => onPatch({ isFavorited: v })} />
        {mine && <button className="act" onClick={() => setEditing(true)}><Pencil size={16} /></button>}
        {(mine || isAdmin) && <DeleteButton onClick={remove} />}
      </div>
      {showC && <Comments kind="post" id={post.id} onCount={(n) => onPatch({ _count: { ...post._count, comments: n } })} />}
    </article>
  );
}

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [state, setState] = useState({ loading: true, error: null });

  const load = async (p = 1) => {
    try {
      const { items, pagination } = await api.list('/posts', { page: p, limit: 10 });
      setPosts((cur) => (p === 1 ? items : [...cur, ...items]));
      setMore(!!pagination?.hasNext); setPage(p); setState({ loading: false, error: null });
    } catch (e) { setState({ loading: false, error: e.message }); }
  };
  useEffect(() => {
    load(1);
    const s = getSocket();
    const onNew = (p) => setPosts((cur) => (cur.some((x) => x.id === p.id) ? cur : [{ ...p, _count: { comments: 0, reactions: 0 } }, ...cur]));
    s?.on('new_post', onNew);
    return () => s?.off('new_post', onNew);
  }, []);

  const patch = (id, change) => setPosts((cur) => cur.map((p) => (p.id === id ? { ...p, ...change } : p)));

  return (
    <>
      <PageHead hand="hamma nima yozayotgan ekan…" title="Sinf lentasi" />
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Composer onPosted={(p) => setPosts((cur) => (cur.some((x) => x.id === p.id) ? cur : [{ ...p, _count: { comments: 0, reactions: 0 } }, ...cur]))} />
        {state.loading && <Loading />}
        {state.error && <ErrorBox error={state.error} onRetry={() => load(1)} />}
        {!state.loading && !state.error && posts.length === 0 && <Empty emoji="✍️" title="Hali hech narsa yozilmagan">Birinchi bo'lib sinfga bir-ikki so'z yozing.<span className="hand">tarix shu yerdan boshlanadi</span></Empty>}
        {posts.map((p) => <Post key={p.id} post={p} onRemove={() => setPosts((c) => c.filter((x) => x.id !== p.id))} onPatch={(ch) => patch(p.id, ch)} />)}
        {more && <div className="center"><button className="btn" onClick={() => load(page + 1)}>Yana ko'rsatish</button></div>}
      </div>
    </>
  );
}
