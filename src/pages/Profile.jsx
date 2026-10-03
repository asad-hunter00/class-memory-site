import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useToast } from '../lib/ui.jsx';
import { uploadToCloud } from '../lib/upload.js';
import { Avatar, PageHead } from '../components/common.jsx';

export default function Profile() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({
    fullName: user.fullName || '', nickname: user.nickname || '', bio: user.bio || '',
    currentCity: user.currentCity || '', currentCountry: user.currentCountry || '', currentOccupation: user.currentOccupation || '',
  });
  const [busy, setBusy] = useState(false);
  const [up, setUp] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const file = useRef(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const body = { fullName: f.fullName.trim() };
      ['nickname', 'bio', 'currentCity', 'currentCountry', 'currentOccupation'].forEach((k) => { body[k] = f[k].trim() || null; });
      await api.patch('/auth/profile', body); await refresh(); toast('Profil saqlandi ✨');
    } catch (er) { toast(er.message, 'bad'); } finally { setBusy(false); }
  };
  const avatar = async (e) => {
    const fl = e.target.files?.[0]; e.target.value = ''; if (!fl) return;
    setUp(true);
    try { const r = await uploadToCloud(fl); await api.patch('/auth/profile', { avatarUrl: r.url }); await refresh(); toast('Rasm yangilandi'); }
    catch (er) { toast(er.message, 'bad'); } finally { setUp(false); }
  };
  const changePw = async (e) => {
    e.preventDefault();
    try { await api.post('/auth/change-password', pw); setPw({ currentPassword: '', newPassword: '' }); toast("Parol o'zgartirildi 🔐"); }
    catch (er) { toast(er.message, 'bad'); }
  };

  return (
    <>
      <PageHead hand="siz haqingizda" title="Mening profilim" />
      <div style={{ maxWidth: 760, display: 'grid', gap: 22 }}>
        <div className="card profile-top">
          <div style={{ position: 'relative' }}>
            <Avatar user={user} size={96} />
            <button className="icon-btn" style={{ position: 'absolute', right: -6, bottom: -6, background: 'var(--accent)', color: '#211D16', border: '2px solid var(--card)', width: 36, height: 36, borderRadius: '50%' }} onClick={() => file.current.click()} aria-label="Rasmni almashtirish">{up ? <span className="spin" /> : <Camera size={17} />}</button>
            <input ref={file} type="file" accept="image/*" hidden onChange={avatar} />
          </div>
          <div><h2 style={{ fontSize: 28 }}>{user.fullName}</h2><div className="muted">@{user.username} · {user.role === 'ADMIN' ? 'Admin' : "Sinfdosh"}</div>
            <div className="row wrap" style={{ marginTop: 8 }}><span className="chip">📷 {user._count?.photos ?? 0}</span><span className="chip">🎬 {user._count?.videos ?? 0}</span><span className="chip">✍️ {user._count?.posts ?? 0}</span><span className="chip">🔖 {user._count?.favorites ?? 0}</span></div></div>
        </div>

        <form className="card pad" onSubmit={save}>
          <h3 style={{ marginBottom: 14 }}>Ma'lumotlarim</h3>
          <div className="grid-2">
            <div className="field"><label>Ism familiya</label><input className="input" required minLength={2} value={f.fullName} onChange={set('fullName')} /></div>
            <div className="field"><label>Laqab</label><input className="input" maxLength={50} value={f.nickname} onChange={set('nickname')} /></div>
            <div className="field"><label>Hozirgi shahar</label><input className="input" value={f.currentCity} onChange={set('currentCity')} placeholder="Seul" /></div>
            <div className="field"><label>Davlat</label><input className="input" value={f.currentCountry} onChange={set('currentCountry')} placeholder="Janubiy Koreya" /></div>
          </div>
          <div className="field"><label>Nima bilan band (o'qish / ish)</label><input className="input" maxLength={100} value={f.currentOccupation} onChange={set('currentOccupation')} placeholder="Kompyuter fanlari talabasi" /></div>
          <div className="field"><label>O'zim haqimda</label><textarea className="textarea" maxLength={500} value={f.bio} onChange={set('bio')} /></div>
          <button className="btn primary" disabled={busy}>{busy ? <span className="spin" /> : 'Saqlash'}</button>
        </form>

        <form className="card pad" onSubmit={changePw}>
          <h3 style={{ marginBottom: 14 }}>Parolni o'zgartirish</h3>
          <div className="grid-2">
            <div className="field"><label>Hozirgi parol</label><input className="input" type="password" required autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></div>
            <div className="field"><label>Yangi parol</label><input className="input" type="password" required minLength={6} autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></div>
          </div>
          <button className="btn">O'zgartirish</button>
        </form>
      </div>
    </>
  );
}
