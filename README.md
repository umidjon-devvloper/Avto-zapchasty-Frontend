# AvtoEhtiyot — Admin Panel (Next.js)

Avtoehtiyot marketplace boshqaruv paneli. Backend REST API ga ulanadi.
Telefon+OTP kirish (faqat admin/superadmin), e'lonlar moderatsiyasi, foydalanuvchilar va katalog boshqaruvi.

## Dizayn
Industrial parts-catalog yo'nalishi: to'q ko'mir fon + amber urg'u, Archivo + IBM Plex Mono
(OEM/ID/narxlar uchun mono raqamlar). To'liq dark, ma'lumotga boy, aniq.

## Texnologiyalar
Next.js 14 (App Router) · TypeScript · Tailwind CSS · TanStack Query · Axios · lucide-react

## O'rnatish

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_URL ni backend manziliga sozlang
npm run dev                    # http://localhost:3000
```

Backend birinchi ishga tushgan va seed qilingan bo'lishi kerak (../autoparts-backend).

Tekshiruv:
```bash
npm run typecheck   # TypeScript (xatosiz)
npm run build       # production build
```

## Kirish
1. `/login` da telefon raqami → OTP.
2. DEV rejimda backend kodni qaytaradi (toast'da ko'rinadi) — Eskiz shart emas.
3. Faqat **admin** yoki **superadmin** roli kira oladi. Boshqa rollarga "huquq yo'q" deyiladi.

> Birinchi adminni qanday yaratish: telefon bilan ro'yxatdan o'ting (buyer bo'lasiz),
> keyin bazada yoki backend orqali rolingizni `superadmin` ga o'zgartiring
> (`db.users.updateOne({phone:'+998...'},{ $set:{role:'superadmin'} })`).

## Sahifalar
| Yo'l | Vazifa |
|---|---|
| `/` | Boshqaruv paneli — statistika (foydalanuvchi, sotuvchi, faol/kutilayotgan e'lon, top kategoriyalar) |
| `/reports` | Shikoyatlar moderatsiyasi |
| `/listings` | E'lonlar moderatsiyasi — status filtri, tasdiqlash/rad etish (+sabab) |
| `/users` | Foydalanuvchilar — qidiruv, rol o'zgartirish, tasdiqlash, bloklash |
| `/catalog/categories` | Kategoriyalar CRUD |
| `/catalog/part-types` | Detal turlari — paginatsiya, kategoriya filtri, qidiruv, CRUD |
| `/catalog/synonyms` | Sinonimlar (qidiruv lug'ati) CRUD |
| `/catalog/brands` | Brendlar CRUD |
| `/catalog/vehicles` | Mashina ierarxiyasi — model / avlod / dvigatel (kaskadli) |
| `/catalog/cities` | Shaharlar CRUD |

## Tuzilishi
```
app/
├── layout.tsx              root (fontlar + QueryProvider + ToastProvider)
├── login/page.tsx          OTP kirish
└── (dashboard)/
    ├── layout.tsx          auth+rol guard + sidebar
    ├── page.tsx            statistika
    ├── listings/page.tsx   moderatsiya
    ├── users/page.tsx      foydalanuvchilar
    └── catalog/{categories,brands,cities}/page.tsx
components/
├── ui/                     button, input, card, badge, table, select, ...
├── sidebar, topbar, modal, toast, stat-card, empty
├── resource-manager.tsx    generik CRUD (flat kataloglar)
├── cascade-crud.tsx        ota-element bo'yicha CRUD (model/avlod/dvigatel)
└── form-fields.tsx         umumiy forma maydonlari (text/number/bool/tags/select)
lib/
├── api.ts                  axios + token refresh interceptor + API methodlari
├── auth.ts                 token/session boshqaruvi
├── types.ts                TypeScript interfeyslar
└── query-provider.tsx      TanStack Query
```

## Holat
Admin panel to'liq: barcha katalog entity'lari (kategoriya, detal turi, sinonim, brend,
model/avlod/dvigatel, shahar) boshqariladi + e'lon moderatsiyasi + foydalanuvchilar + statistika.
Backendga mos GET endpointlar (`/admin/synonyms`, `/admin/part-types`) qo'shilgan.

## Keyingi qadam
Expo React Native mobil ilova — xaridor/sotuvchi tomoni (katalog, qidiruv, e'lon ko'rish/berish).
# Avto-zapchasty-Frontend
