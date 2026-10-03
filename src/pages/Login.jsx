import { useState } from 'react';
import { Moon, Sun, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { useTheme } from '../components/Layout.jsx';

export default function Login() {
  const { login } = useAuth();
  const [theme, toggleTheme] = useTheme();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ username: '', password: '', fullName: '', nickname: '', inviteCode: '' });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      if (mode === 'login') {
        await login(f.username, f.password);
      } else {
        const body = { username: f.username.trim().toLowerCase(), fullName: f.fullName.trim(), password: f.password, inviteCode: f.inviteCode.trim() };
        if (f.nickname.trim()) body.nickname = f.nickname.trim();
        const data = await api.post('/auth/register', body);
        if (data?.status === 'APPROVED') { await login(body.username, body.password); }
        else { setDone("So'rovingiz yuborildi! Sinf admini tasdiqlagach, kira olasiz. Tasdiqlanganini admin sizga aytadi."); setMode('login'); setF({ ...f, password: '' }); }
      }
    } catch (er) { setError(er.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth">
      <button className="icon-btn theme-fab" onClick={toggleTheme} aria-label="Mavzu">{theme === 'dark' ? <Sun size={21} /> : <Moon size={21} />}</button>
      <section className="auth-art">
        <div className="row" style={{ gap: 10 }}>
          <div className="brand-mark" style={{ width: 40, height: 40, background: '#211D16', color: 'var(--accent)' }}>S</div>
          <b style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>Sinf Esdaligi</b>
        </div>
        <div>
          <span className="hand">bitirgandan keyin ham, birga</span>
          <h1>Bizning<br />sinf xotira<br />sandig'i.</h1>
          <div className="auth-collage hide-m" aria-hidden>
            <div className="polaroid" style={{ left: '2%', top: 14, transform: 'rotate(-8deg)' }}><div className="ph" style={{ background: '#F29A8B' }}>📸</div><span className="cap">birinchi kun</span></div>
            <div className="polaroid" style={{ left: '30%', top: 0, transform: 'rotate(3deg)', zIndex: 2 }}><div className="ph" style={{ background: '#9AD0B5' }}>🎒</div><span className="cap">sayohat</span></div>
            <div className="polaroid" style={{ left: '58%', top: 22, transform: 'rotate(9deg)' }}><div className="ph" style={{ background: '#9DB8EE' }}>🎓</div><span className="cap">bitiruv</span></div>
          </div>
        </div>
        <p style={{ fontWeight: 600, maxWidth: 420 }}>Rasmlar, videolar, suhbatlar va kelajakka xatlar. Yillar o'tib ham shu yerda kutib turadi.</p>
      </section>

      <section className="auth-form">
        <div className="auth-card">
          <h2>{mode === 'login' ? 'Xush kelibsiz!' : "Sinfga qo'shiling"}</h2>
          <p className="muted" style={{ marginBottom: 22 }}>{mode === 'login' ? "Faqat sinfdoshlar uchun yopiq joy." : "Sinf kodini sinfdoshlardan so'rang."}</p>
          {done && <div className="card pad" style={{ marginBottom: 16, background: 'var(--accent-soft)', fontWeight: 600 }}>{done}</div>}
          <form onSubmit={submit}>
            {mode === 'register' && <div className="field"><label>Ism familiya</label><input className="input" required minLength={2} value={f.fullName} onChange={set('fullName')} placeholder="Masalan: Aziz Karimov" /></div>}
            <div className="field"><label>Login (username)</label><input className="input" required minLength={3} autoCapitalize="none" autoComplete="username" value={f.username} onChange={set('username')} placeholder="aziz2008" /></div>
            <div className="field"><label>Parol</label>
              <div style={{ position: 'relative' }}>
                <input className="input" required minLength={mode === 'register' ? 6 : 1} type={show ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={f.password} onChange={set('password')} style={{ paddingRight: 46 }} />
                <button type="button" className="icon-btn" style={{ position: 'absolute', right: 2, top: 2 }} onClick={() => setShow(!show)} aria-label="Parolni ko'rsatish">{show ? <EyeOff size={19} /> : <Eye size={19} />}</button>
              </div>
              {mode === 'register' && <span className="hint">Kamida 6 ta belgi</span>}
            </div>
            {mode === 'register' && <>
              <div className="field"><label>Laqab (ixtiyoriy)</label><input className="input" maxLength={50} value={f.nickname} onChange={set('nickname')} placeholder="Sinfdagi taxallusingiz" /></div>
              <div className="field"><label>Sinf kodi</label><input className="input" required value={f.inviteCode} onChange={set('inviteCode')} placeholder="Maxfiy kod" autoCapitalize="none" /></div>
            </>}
            {error && <p className="err">{error}</p>}
            <button className="btn primary block" disabled={busy} style={{ padding: '13px 16px', fontSize: 16 }}>{busy ? <span className="spin" /> : mode === 'login' ? 'Kirish' : "So'rov yuborish"}</button>
          </form>
          <p className="muted small" style={{ marginTop: 18, textAlign: 'center' }}>
            {mode === 'login' ? "Akkauntingiz yo'qmi? " : 'Akkauntingiz bormi? '}
            <a href="#" style={{ fontWeight: 800, borderBottom: '2px solid var(--accent)' }} onClick={(e) => { e.preventDefault(); setMode(mode === 'login' ? 'register' : 'login'); setError(''); setDone(''); }}>{mode === 'login' ? "Ro'yxatdan o'ting" : 'Kirish'}</a>
          </p>
        </div>
      </section>
    </div>
  );
}
