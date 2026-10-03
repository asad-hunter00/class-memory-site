import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const id = useRef(0);
  const push = useCallback((text, kind = 'ok') => {
    const k = ++id.current;
    setItems((a) => [...a, { k, text, kind }]);
    setTimeout(() => setItems((a) => a.filter((x) => x.k !== k)), 3800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => <div key={t.k} className={`toast ${t.kind}`}>{t.text}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}
