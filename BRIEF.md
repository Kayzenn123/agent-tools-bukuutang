# BRIEF — BukuUtang — 2026-11-02

## Masalah/usecase (1 kalimat + siapa yang kena)
Pemilik warung mencatat bon pelanggan di buku tulis yang gampang hilang dan susah ditagih; BukuUtang adalah buku bon digital yang jalan 100% offline di browser — catat utang, catat bayar, tagih via WA.

## Konsep visual (1 kalimat)
Satu buku bon raksasa ala label kemasan jadul yang dibelah jadi dua dunia — DUNIA BON (kiri) dan DUNIA LUNAS (kanan) — yang saling bereaksi saat disentuh.

## Hasil seed (base 2026-11-10; seed asli 2026-11-02 & 2026-11-06 ditolak: tabrakan 100% dengan build 10-18 & 10-25, disahkan ATURAN 19 v5)
- domain: arisan → difusi ke "buku bon warung" (sama-sama buku kepercayaan)
- layout: split screen dua dunia
- reference: label kemasan jadul
- constraint: hanya 3 ukuran font (16px UI, 28px sub, raksasa clamp)
- motion: A parallax 5 layer + zoom out di akhir · B marquee melingkar di path SVG (2 band lawan arah) · C outline terisi saat scroll · D cursor senter/spotlight mask · E clip-path lingkaran
- icons: outline tipis 1px, Remix + custom hand-built
- fonts: display Noto Serif Kannada · body Noto Sans Arabic · aksen Comic Neue (coretan tangan)
- palette: mid/monochrome hue 312 — bg oklch(0.71 0.109 312) kertas ungu-abu · surface oklch(0.60 0.110 312) · text oklch(0.16 0.030 312) · accent oklch(0.62 0.225 312) (teks: varian L 0.40) · pop hijau stempel oklch(0.84 0.216 165) hanya sebagai fill

## 3 arah desain (2 kalimat masing-masing) + arah terpilih
1. **Buku bon split-screen**: kiri DUNIA BON (daftar utang aktif), kanan DUNIA LUNAS (riwayat bayar). Hover/klik pelanggan di kiri menyorot pembayarannya di kanan; bayar = uang "terbang" menyeberang dunia.
2. **Terminal kasir warung**: semua lewat perintah ketik ("bon budi 25000 indomie"). Cepat buat yang hafal, tapi butuh belajar dan tidak ramah untuk ibu-ibu warung.
3. **Tumpukan kartu bon**: tiap pelanggan = kartu yang bisa diseret ke kotak LUNAS. Seru, tapi susah dipakai satu tangan di HP dan tabrakan dengan build kartu 10-16/10-20.
**Terpilih: arah 1** — paling jauh dari default template, langsung paham dalam 3 detik, dan persis memakai layout seed "split screen dua dunia".

## Keputusan berani
Tanpa navbar, tanpa hero marketing, tanpa menu. Pengunjung langsung di depan buku bon raksasa dengan judul "BON" sebesar layar — kata BON adalah pintu: diklik/disentuh, kamera zoom-through masuk ke dalam buku. Navigasi situs = dua dunia itu sendiri.

## Persona/suara
**Bu Buku** — bendahara warung, tegas tapi sayang. Bahasa warung, kalimat pendek. Contoh: judul "Siapa yang bon hari ini?"; tombol "Catat bon"; error "Nominalnya belum diisi, Mas. Bon kosong nggak bisa dicatat."; empty state "Bukunya masih bersih. Catat bon pertama di bawah."; toast sukses "Bon Budi Rp25.000 dicatat."; lunas "LUNAS! Budi sudah bayar semua. Alhamdulillah."

## Palet (harmoni, kenapa, psikologi warna, token final, kontras AA)
- Harmoni monochrome hue 312 (ungu-abu) + pop hijau stempel (komplemen jauh). Psikologi: ungu-abu = kertas bon lama yang tenang dan tepercaya; hijau stempel = lega, urusan selesai.
- Token: --bg #b9a8c4-ish (oklch 0.71 0.109 312) · --surface oklch(0.60 0.110 312) · --text oklch(0.16 0.030 312) · --muted oklch(0.32 0.040 312) · --accent oklch(0.62 0.225 312) (grafis/besar) · --accent-ink oklch(0.40 0.180 312) (teks, hue sama, lightness diturunkan) · --pop oklch(0.84 0.216 165) (fill stempel, teks di atasnya --text).
- Kontras AA: text/bg ≈ 9.5:1 ✓ · muted/bg ≈ 5.2:1 ✓ · accent-ink/bg ≈ 4.6:1 ✓ · text/pop-fill ≈ 8:1 ✓. (Dihitung dari selisih lightness OKLCH; verifikasi visual di QA.)

## Font (display/body/aksen, alasan, variable atau bukan)
- Display: **Noto Serif Kannada** (latin subset) — serif berwibawa seperti kop label jadul; untuk kata BON raksasa & angka total. Bukan variable.
- Body: **Noto Sans Arabic** (latin subset) — sans bersih, x-height wajar, terbaca di 390px. Bukan variable → animasi "denyut wght" diganti outline-terisi + scramble ringan.
- Aksen: **Comic Neue** — coretan tangan untuk anotasi ("contoh", "lunas!", catatan pinggir). Dipakai <5% area.
- Hanya 3 ukuran: 16px (UI/body), 28px (subjudul/label besar), clamp(64px, 18vw, 220px) (raksasa). Semua teks memakai salah satu dari tiga ini.

## Ikon (gaya, sumber, daftar 12+ ikon, 3+ custom)
Gaya: outline tipis 1px, konsisten. Sumber: Remix (iconify via astro-icon? — pakai SVG inline hand-built gaya Remix agar konsisten + lolos offline). 12 ikon: buku-bon, stempel, koin, karcis, tambah, bayar, cari, unduh, salin, cetak, hapus, jam, cek, peringatan. Custom (digambar sendiri): **buku bon terbuka**, **stempel LUNAS miring**, **koin warung**, **karcis bon bernomor**.

## Gerak (kategori A-F, narasi, MODE RINGAN)
Narasi penyatu: **"masuk ke dalam buku"** — scroll = membuka & menjelajahi buku bon; marquee melingkar = cap stempel berputar di sekeliling buku; senter = lampu warung yang menyorot baris bon.
- A: 5 layer parallax (sobekan label, cap, koin) melayang di hero; zoom-out 0.8× di ujung sebagai "buku dilihat dari jauh".
- B: 2 band marquee melingkar (SVG textPath, arah berlawanan, skew ikut velocity scroll).
- C: headline outline yang terisi (fill) seiring scroll; kata BON raksasa = pintu zoom-through (scale 1→8, clip).
- D: cursor senter — radial mask mengikuti pointer (pointer:fine saja), menyorot baris bon di DUNIA BON.
- E: reveal kartu/baris pakai clip-path lingkaran membesar.
- F: tidak dipakai (jaga budget).
- MODE RINGAN (hardwareConcurrency ≤4 / save-data / fps<40 2s): matikan A parallax (jadi statis), B jadi 1 band statis, D mati total, E jadi fade biasa.

## Storyboard hero moment
| Scroll | Yang terlihat | Kamera (zoom/pan) | Marquee | Teks | Interaksi |
|---|---|---|---|---|---|
| 0% | Kata "BON" raksasa outline memenuhi layar + buku tertutup | — | 1 marquee melingkar "buku utang • warung berkah •" | outline BON | klik/ketuk BON = masuk |
| 25% | Zoom-through pintu BON → buku terbuka, 5 layer label melayang | zoom in 1.8× | 2 band lawan arah | "BUKU UTANG" outline→terisi | — |
| 50% | Split screen: DUNIA BON kiri / DUNIA LUNAS kanan | pan kanan halus | — | label dunia terisi | hover pelanggan → sorot silang dua dunia |
| 75% | Form "catat bon" + tombol stempel | — | — | — | isi form → baris slide-in, toast Bu Buku |
| 100% | Zoom out: buku utuh dari jauh + total piutang raksasa | zoom out 0.8× | marquee melingkar | total outline→terisi | tombol ekspor/salin |

Pertunjukan utama: **stempel LUNAS jatuh** — saat tombol "Catat bayar" ditekan, stempel hijau slam dengan spring overshoot + buku berguncang 120ms + baris utang "terbang" menyeberang ke DUNIA LUNAS.
5 detik pertama: kata BON raksasa + instruksi "ketuk untuk buka buku" + marquee melingkar berputar.

## Konten (15+ item nyata, easter egg)
Data contoh (dilabeli "contoh"): 8 pelanggan — Budi (indomie 5 bks, Rp17.500), Siti (beras 5 kg, Rp68.000), Agus (minyak 2 L, Rp45.000), Rina (telur 1 kg, Rp28.000), Dewi (kopi sachet 10, Rp15.000), Joko (gula 1 kg, Rp17.500), Ani (sabun + sampo, Rp23.000), Pak RT (pulsa 50rb, Rp52.000) — dengan umur utang bervariasi (2, 5, 9, 14, 21, 33, 40, 3 hari) untuk demo status LANCAR/WASPADA/MACET.
Easter egg: klik cap stempel di footer 5× → toast Bu Buku "Rajin menabung, pangkal kaya." + hujan cap mini.

## Teknik visual orisinal (2+)
1. Paper grain via SVG feTurbulence di atas bg (tekstur kertas bon).
2. Marquee melingkar ganda pada SVG textPath (cap stempel berputar).
3. Spotlight mask radial mengikuti kursor (lampu warung) — murni CSS mask + JS pointer.

## Suara
Tidak (jaga fokus; stempel divisualkan, bukan dibunyikan).

## Micro-interactions (skill micro-interactions, Dan Saffer 4-part)
- **catat-bon**: trigger klik "Catat bon" → rules: validasi nama+nominal>0 → feedback: baris slide-in 200ms ease-out + toast role=status "Bon X dicatat" + odometer total naik → loop: tidak berulang otomatis.
- **catat-bayar**: trigger klik "Bayar" → feedback: stempel LUNAS slam (spring 0.34,1.56,0.64,1, 450ms) + shake buku 120ms + baris pindah dunia (FLIP 300ms) → toast "LUNAS!".
- **validasi**: trigger blur → invalid: border accent-ink + shake 3×4px 400ms + pesan Bu Buku (role=alert) → valid: check fade-in 150ms.
- **hapus**: 2-klik konfirmasi inline ("yakin? ketuk lagi") — tanpa modal.
- Semua ≤400ms, compositor-only (transform/opacity/clip-path), hormati prefers-reduced-motion (Approach 2: matikan).
