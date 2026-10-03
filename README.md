# Sinf Esdaligi — Frontend

React + Vite. Backend: Render'dagi `backend-class` (REST + Socket.IO).

## Ishga tushirish
```bash
npm install
cp .env.example .env     # VITE_API_URL ni tekshiring
npm run dev              # http://localhost:5173
npm run build            # dist/ papkasi tayyor bo'ladi
```

`.env` ichida:
```
VITE_API_URL=https://backend-class-bvno.onrender.com
```
(oxirida `/api` yozilmaydi)

## MUHIM: CORS
Backend faqat `CLIENT_URL` dagi manzildan kelgan so'rovlarni qabul qiladi.
Render → backend servisi → Environment → `CLIENT_URL` ga frontend manzilini yozing
(bir nechta bo'lsa vergul bilan):
```
http://localhost:5173,https://SIZNING-SAYT.vercel.app
```
Saqlagach, Render servisi o'zi qayta ishga tushadi.

## Vercel / Netlify'ga joylash
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL`
- SPA yo'naltirish: Vercel uchun `vercel.json`, Netlify uchun `public/_redirects` tayyor.

## Birinchi kirish
Backend bo'sh bazada birinchi ro'yxatdan o'tgan odamni avtomatik ADMIN qiladi.
"Ro'yxatdan o'tish" orqali (sinf kodi bilan) akkaunt oching, qolganlarni Admin panel → "Kutayotganlar" dan tasdiqlaysiz.
