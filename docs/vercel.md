# Vercel + Turso orqali joylash

Frontend va akkaunt API bitta Vercel loyihasida ishlaydi. Akkauntlar, sessiyalar va klub saqlanmalari Turso bazasida saqlanadi. Vercel diskiga baza yozilmaydi.

## 1. Turso bazasini oching

[Turso](https://turso.tech/) akkauntiga kiring, yangi baza yarating. Baza sahifasidan **Database URL** va bazaga yozish huquqiga ega **Auth Token** oling.

Turso CLI ishlatsangiz, shu amallar:

```sh
turso auth login
turso db create clubsim
turso db show clubsim --url
turso db tokens create clubsim
```

Oxirgi ikki buyruq chiqishini maxfiy saqlang. Ularni kodga yoki chatga joylamang.

## 2. Vercel sozlamalari

Loyiha ichida **Settings → Environment Variables** bo‘limiga quyidagilarni qo‘shing:

| Name | Value |
| --- | --- |
| `TURSO_DATABASE_URL` | Turso bergan `libsql://...` manzil |
| `TURSO_AUTH_TOKEN` | Turso bazasining auth tokeni |

Ishlatiladigan muhitlarni tanlang: **Production**, sinov deploylari uchun **Preview** ham. Nomlar oldiga `VITE_` qo‘shmang: bu ma’lumotlar faqat server uchun.

**Framework Preset:** Vite. **Node.js Version:** 24.x. **Build Command:** `npm run build`. **Output Directory:** `dist`. Root Directory `package.json` va `vercel.json` joylashgan papka bo‘lishi kerak.

## 3. Yangi kodni deploy qiling

O‘zgartirilgan kodni Vercelga ulangan repozitoriyga yuboring va yangi deploymentni ishga tushiring. Environment Variables o‘zgarganidan keyin **Redeploy** qiling. `api/index.js` ham deploy tarkibida bo‘lishi kerak; faqat `dist` papkasini yuklash yetarli emas.

Birinchi akkaunt so‘rovida jadvallar avtomatik yaratiladi. Alohida SQL kiritish shart emas.

## 4. Tekshirish

- `https://SIZNING-SAYTINGIZ/api/health` JSON qaytarishi va `configured: true` bo‘lishi kerak. Bu kalitlar borligini bildiradi; baza ulanishini tekshirish uchun keyingi so‘rovni ishlating.
- `/api/auth/me` manzili tizimga kirmagan holatda `{"user":null}` qaytarishi kerak. `503` bo‘lsa Turso URL, token va Vercel Function loglarini tekshiring.
- Saytda ro‘yxatdan o‘ting, klubni saqlang, chiqing va qayta kiring. Klub tiklanishini tekshiring.
- `/login` sahifasini bevosita ochish va yangilash ham ishlaydi.

Mahalliy `backend/runtime/accounts.sqlite` dagi eski akkauntlar yangi Turso bazasiga avtomatik ko‘chmaydi. Yangi bazada ro‘yxatdan o‘ting. Klubni avvalgi qurilmadan JSON eksport/import orqali ko‘chirishingiz mumkin.

## Qo‘llab-quvvatlanadigan imkoniyatlar

Vercelda ro‘yxatdan o‘tish, kirish/chiqish, profil, shaxsiy klub saqlanmasi, statistika va reyting ishlaydi. Do‘stlar va jonli do‘stlar matchi bu rejimda `503 unavailable` qaytaradi: hozirgi match serveri xotira va uzluksiz timerga tayanadi. Ular mahalliy `npm run dev` va doimiy Node serverida avvalgidek ishlaydi.

Oddiy `npm run dev` mahalliy SQLite bazasidan foydalanadi. Turso sozlamalari Vercel Function uchun ishlatiladi.

Manbalar: [Turso quickstart](https://docs.turso.tech/quickstart), [Turso JavaScript SDK](https://tursodatabase.github.io/libsql-client-ts/), [Vercel Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
