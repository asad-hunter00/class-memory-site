import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { monthYear, monthName } from '../lib/util.js';
import { Empty, ErrorBox, Loading, PageHead } from '../components/common.jsx';
import { MemoryRow, useViewer } from '../components/Memory.jsx';

const TYPES = [['all', 'Hammasi'], ['photo', 'Rasmlar'], ['video', 'Videolar'], ['post', 'Postlar']];

export default function Timeline() {
  const { viewer, show } = useViewer();
  const now = new Date();
  const [type, setType] = useState('all');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [state, setState] = useState({ loading: true, error: null });

  const load = async (p = 1) => {
    try {
      const { items: it, pagination } = await api.list('/memories/timeline', { page: p, limit: 20, contentType: type, year, month: year ? month : '' });
      setItems((c) => (p === 1 ? it : [...c, ...it]));
      setMore(!!pagination?.hasNext); setPage(p); setState({ loading: false, error: null });
    } catch (e) { setState({ loading: false, error: e.message }); }
  };
  useEffect(() => { setState({ loading: true, error: null }); load(1); /* eslint-disable-next-line */ }, [type, year, month]);

  const groups = [];
  items.forEach((m) => { const k = monthYear(m.createdAt); const g = groups[groups.length - 1]; if (g && g.k === k) g.items.push(m); else groups.push({ k, items: [m] }); });
  const years = Array.from({ length: 8 }, (_, i) => now.getFullYear() - i);

  return (
    <>
      <PageHead hand="oy-oyma, yil-yilma" title="Xronologiya" />
      <div className="row wrap" style={{ marginBottom: 24 }}>
        <div className="seg">{TYPES.map(([k, t]) => <button key={k} className={type === k ? 'on' : ''} onClick={() => setType(k)}>{t}</button>)}</div>
        <select className="select" style={{ width: 'auto' }} value={year} onChange={(e) => { setYear(e.target.value); setMonth(''); }}>
          <option value="">Barcha yillar</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        {year && <select className="select" style={{ width: 'auto' }} value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="">Butun yil</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{monthName(i)}</option>)}
        </select>}
      </div>
      {state.loading && <Loading />}
      {state.error && <ErrorBox error={state.error} onRetry={() => load(1)} />}
      {!state.loading && !state.error && items.length === 0 && <Empty emoji="🧭" title="Bu davrda xotira topilmadi">Boshqa oy yoki yilni tanlab ko'ring.</Empty>}
      <div className="tl">
        {groups.map((g) => (
          <div key={g.k}><div className="tl-month">{g.k}</div>{g.items.map((m) => <MemoryRow key={m.memoryType + m.id} item={m} onOpen={show} />)}</div>
        ))}
      </div>
      {more && <div className="center"><button className="btn" onClick={() => load(page + 1)}>Yana ko'rsatish</button></div>}
      {viewer}
    </>
  );
}
