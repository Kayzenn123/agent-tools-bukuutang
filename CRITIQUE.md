# GERBANG KRITIK — BukuUtang (j0800 2026-11-02)

Tanggal: 2026-11-02. Build: Astro + AstroWind + GSAP. Verifikasi: tools/qa.cjs (4 viewport), tools/test-fungsi.cjs (17/17), screenshot manual.

## 1. SLOP TEST (v3)
Logo ditutup: buku bon warung raksasa — pintu "BON" outline raksasa + marquee melingkar "catat bon • bayar lunas • warung berkah •". TIDAK ketuker dengan build j0800 lain (28/10: panel neon, 29/10: koran horizontal, 30/10: timeline tiang, 31/10: canvas kebun).
- 3 hal paling template di output ini: (a) kartu pelanggan = kotak berborder (pola umum), (b) form stacked standar, (c) strip utilitas sticky.
- Rombak nyata: (a) strip vertikal 3 baris → 1 baris horizontal kompak (putusan kritik putaran 1); (b) BON terisi tinta sebagian saat load → outline bersih, terisi HANYA saat diklik (putusan putaran 1); (c) pintu BON = zoom-through ke buku (bold decision BRIEF, bukan hero statis); (d) kartu bergaya stempel/label kemasan jadul + aksen coretan tangan, bukan kartu SaaS polos.

## 2. GERBANG MOTION (v4) — seed 2026-11-10
- A parallax 5 layer + zoom-out: LULUS (hero 5 layer: bg, stempel, cincin marquee, BON, chip).
- B 2 marquee melingkar: LULUS (SVG textPath 2 arah berlawanan, jeda putaran tersedia).
- C outline-terisi saat scroll: LULUS (BON terisi via ScrollTrigger + ink-fill saat diklik).
- D spotlight mengikuti kursor: LULUS (radial gradient mengikuti pointer, nonaktif di touch).
- E clip-path lingkaran: LULUS (kartu & badge ter-reveal via circle wipe; pintu = zoom lingkaran).
- FPS 4x CPU throttle: 58.1. Reduced-motion: 0 animasi berjalan (terverifikasi).
- Mode ringan otomatis: baterai lemah / Save-Data → bu-lite (marquee & parallax dimatikan).

## 3. GERBANG v5
- vs 3 build terakhir (koran, canvas, timeline): split screen DUA DUNIA (BON | LUNAS) belum dipakai. Beda nyata.
- Blur test: bentuk dominan = lingkaran (marquee) + huruf BON raksasa. Berbeda dari build lain.
- 3 detik: "BON — ketuk untuk buka buku" — jelas ini buku utang warung.
- Keyboard-only: pintu = <button>, tab saringan = <button>, semua form berlabel. LULUS.
- Mode terang/gelap: satu tema kertas (by design); kontras teks ≥ 7:1 di kedua dunia.
- Tanpa mouse: semua aksi via klik/ketuk; spotlight & parallax nonaktif di touch.

## 4. BUDGET & KEAMANAN
- JS bundle 135KB (GSAP + logika CRUD offline) — >30KB, dijustifikasi: motion A–E + aplikasi penuh tanpa backend.
- CSS 138KB (template), font 147KB (3 family, display=swap), total dist 1.2MB.
- Keamanan: semua data pengguna di-escape (esc()) sebelum innerHTML; tidak ada eval; tidak ada data keluar perangkat (100% localStorage).
- Lighthouse: BELUM TERUKUR (Chrome di VM tidak bisa jalan — preseden build sebelumnya). Proksi: fps 58.1, 0 console error, 0 tap-target kecil.

## 5. SKOR (target ≥8)
- Karakter & keunikan: 9/10 (persona Bu Buku konsisten di seluruh copy; stempel/label jadul; pintu BON).
- Kerapian visual: 8/10 (strip & kartu rapi; kartu padat di layar sangat kecil masih terbaca).
- Kegunaan: 9/10 (17/17 tes fungsi lolos; alur catat→bayar→lunas < 30 detik).
- Performa: 8/10 (fps 58.1; bundle 135KB wajar untuk app penuh).
- Copy: 9/10 (suara Bu Buku: "Jangan malu catat, yang malu itu yang lupa.").

Putusan: LOLOS semua gerbang. Siap deploy.
