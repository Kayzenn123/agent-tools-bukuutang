# BukuUtang — Buku Bon Warung

Catat utang pelanggan, bayar, dan pantau siapa yang macet. 100% offline, data tersimpan di perangkat (localStorage). Dibangun untuk pemilik warung: buka, catat, tagih lewat WhatsApp.

## Fitur

- **Dua dunia**: DUNIA BON (yang masih berutang) vs DUNIA LUNAS (yang sudah bayar) — split screen di desktop.
- **Catat pelanggan baru** + bon pertama sekaligus, atau pisah.
- **Catat bayar** (sebagian/lunas) dengan riwayat per pelanggan.
- **Status umur utang otomatis**: LANCAR (<7 hari) · WASPADA (7–30) · MACET (>30), dihitung dari bon tertua.
- **Total piutang** dengan odometer animasi + statistik (pelanggan, macet, total bayar).
- **Salin tagihan WhatsApp** — kalimat sopan khas "Bu Buku", siap tempel ke chat.
- **Ekspor CSV/JSON, impor JSON** (format berversi `bukuutang@1`).
- **Bagikan buku** via deep-link `?buku=` (data terkompresi di URL; penerima memilih gabung/ganti; tidak merusak data penerima).
- **Cetak** struk tagihan per pelanggan.
- **Cari + saring** (semua/lancar/waspada/macet).
- **Pintu BON**: ketuk untuk membuka buku (dengan mode gerak yang bisa dimatikan).

## Teknologi

Astro 5 + template AstroWind, GSAP (ScrollTrigger) untuk motion, tanpa backend, tanpa database. Data contoh 8 pelanggan ikut saat pertama dibuka (berlabel jelas "contoh").

## Jalan lokal

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # output ke dist/
```

## Struktur kode aplikasi

- `src/pages/index.astro` — halaman tunggal (hero + dua dunia + form + utilitas).
- `src/scripts/bu/main.js` — bootstrap.
- `src/scripts/bu/store.js` — state + localStorage berversi + migrasi.
- `src/scripts/bu/share.js` — encode/decode deep-link + ekspor/impor.
- `src/scripts/bu/ui.js` — render + semua interaksi.
- `src/scripts/bu/motion.js` — GSAP: parallax, marquee, spotlight, clip-path.

## Catatan

- ClientRouter (Astro view transitions) **sengaja dimatikan** di `src/layouts/Layout.astro`: ia mencegat submit form untuk navigasi SPA dan merusak state aplikasi satu halaman ini.
- Budget: JS bundle ±135KB (GSAP + logika CRUD), CSS ±138KB, font ±147KB.
- QA: `tools/qa.cjs` (4 viewport, 0 overflow, 0 console error, fps 4x CPU ≈ 58) dan `tools/test-fungsi.cjs` (17/17 skenario lolos).

---
Dibangun dari template [AstroWind](https://github.com/arthelokyo/astrowind) (Astro + Tailwind CSS).
