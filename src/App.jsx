import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth.jsx';
import Layout from './components/Layout.jsx';
import { Loading } from './components/common.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Feed from './pages/Feed.jsx';
import Photos from './pages/Photos.jsx';
import Videos from './pages/Videos.jsx';
import { Albums, AlbumDetail } from './pages/Albums.jsx';
import Chat from './pages/Chat.jsx';
import Timeline from './pages/Timeline.jsx';
import Capsules from './pages/Capsules.jsx';
import Gather from './pages/Gather.jsx';
import Members from './pages/Members.jsx';
import Favorites from './pages/Favorites.jsx';
import SearchPage from './pages/SearchPage.jsx';
import Profile from './pages/Profile.jsx';
import Admin from './pages/Admin.jsx';

function Protected({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}><Loading label="Yuklanmoqda…" /></div>;
  return user ? children : <Navigate to="/kirish" replace />;
}

export default function App() {
  const { user, ready, isAdmin } = useAuth();
  return (
    <Routes>
      <Route path="/kirish" element={ready && user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Home />} />
        <Route path="lenta" element={<Feed />} />
        <Route path="rasmlar" element={<Photos />} />
        <Route path="videolar" element={<Videos />} />
        <Route path="albomlar" element={<Albums />} />
        <Route path="albomlar/:id" element={<AlbumDetail />} />
        <Route path="chat" element={<Chat />} />
        <Route path="xronologiya" element={<Timeline />} />
        <Route path="kapsula" element={<Capsules />} />
        <Route path="uchrashuv" element={<Gather />} />
        <Route path="sinfdoshlar" element={<Members />} />
        <Route path="saqlanganlar" element={<Favorites />} />
        <Route path="qidiruv" element={<SearchPage />} />
        <Route path="profil" element={<Profile />} />
        <Route path="admin" element={isAdmin ? <Admin /> : <Navigate to="/" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
