# lunayairmarina — Azure Marina Suite

Premium yacht management marketing site + Super Admin CMS, powered by **TanStack Start**, **React**, **Tailwind**, and **Firebase (Auth + Firestore)**.

## Stack

- TanStack Start (Vite) + React + TypeScript
- Firebase Authentication (email/password)
- Cloud Firestore for CMS content, media (compressed data URLs), messages, and admin profiles
- EN / AR with RTL

## Scripts

```bash
npm install
npm run dev
npm run build
npm run seed:firebase
```

## Admin

- Login: `/admin/login`
- First Super Admin can bootstrap once; later admins are invited from **Users**
- Images: upload from device → compressed → stored in Firestore `media` (Storage not required)

## Firebase setup

1. Enable **Authentication → Email/Password**
2. Publish `firestore.rules`
3. Configure `.env` from `.env.example`

## Notes

- `public/robots.txt` and `public/sitemap.xml` are ready for SEO
- Admin SEO page: `/admin/seo`
