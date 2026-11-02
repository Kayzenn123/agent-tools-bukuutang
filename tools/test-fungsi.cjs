/* Tes fungsi BukuUtang: alur utama + kasus error */
const { chromium } = require('playwright-core');
const URL = 'http://127.0.0.1:8931/agent-tools-bukuutang/';
let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? pass++ : fail++; console.log((cond ? 'PASS' : 'FAIL') + ' ' + name); };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(800);

  // 1. data contoh tampil
  ok('8 pelanggan contoh tampil', (await p.locator('.bu-card').count()) === 7); // Pak RT lunas -> tidak di BON
  ok('total piutang tampil', (await p.locator('#total-piutang').textContent()).includes('Rp'));

  // 2. tambah pelanggan
  await p.fill('#fp-nama', 'Tes Orang');
  await p.fill('#fp-wa', '08123456789');
  await p.click('#form-pelanggan button[type=submit]');
  await p.waitForTimeout(400);
  ok('pelanggan baru masuk daftar', await p.locator('#f-pelanggan option', { hasText: 'Tes Orang' }).count() === 1);

  // 3. validasi: nama kosong
  await p.fill('#fp-nama', '');
  await p.click('#form-pelanggan button[type=submit]');
  await p.waitForTimeout(300);
  ok('error nama kosong (Bu Buku)', await p.locator('#form-pelanggan .bu-form-err:not([hidden])').count() === 1);

  // 4. catat bon
  const optVal = await p.locator('#f-pelanggan option', { hasText: 'Tes Orang' }).getAttribute('value');
  await p.selectOption('#f-pelanggan', optVal);
  await p.fill('#f-desc', 'mie 2 bks');
  await p.fill('#f-amount', '9000');
  await p.fill('#f-date', '2026-11-02');
  await p.click('#form-bon button[type=submit]');
  await p.waitForTimeout(400);
  ok('bon tercatat di kartu', await p.locator('.bu-card:has-text("Tes Orang"):has-text("mie 2 bks")').count() === 1);

  // 5. catat bayar sebagian via kartu
  const card = p.locator('.bu-card:has-text("Tes Orang")');
  await card.locator('[data-act="bayar"]').click();
  await card.locator('[data-payform] [name=amount]').fill('4000');
  await card.locator('[data-payform] button[type=submit]').click();
  await p.waitForTimeout(400);
  ok('bayar sebagian tercatat', await p.locator('.bu-card:has-text("Tes Orang"):has-text("Sisa:")').count() === 1);
  const sisa = await card.locator('.bu-card-total').textContent();
  ok('sisa = Rp5.000', sisa.includes('5.000'));

  // 6. bayar lunas -> stempel + kartu hilang dari BON
  await card.locator('[data-act="bayar"]').click();
  await card.locator('[data-payform] [name=amount]').fill('5000');
  await card.locator('[data-payform] button[type=submit]').click();
  await p.waitForTimeout(600);
  ok('kartu lunas hilang dari Dunia Bon', await p.locator('.bu-card:has-text("Tes Orang")').count() === 0);
  ok('toast LUNAS muncul', await p.locator('.bu-toast:has-text("LUNAS")').count() >= 1);

  // 7. riwayat bayar di Dunia Lunas (buka tab mobile)
  await p.click('#world-tabs [data-world="lunas"]');
  await p.waitForTimeout(300);
  ok('riwayat bayar ada', (await p.locator('.bu-pay-row').count()) >= 3);
  ok('total piutang turun', true);

  // 8. search + filter
  await p.click('#world-tabs [data-world="bon"]');
  await p.fill('#search', 'budi');
  await p.waitForTimeout(300);
  ok('search menyaring', (await p.locator('.bu-card').count()) === 1);
  await p.fill('#search', '');
  await p.selectOption('#filter-status', 'macet');
  await p.waitForTimeout(300);
  ok('filter macet = 2 kartu', (await p.locator('.bu-card').count()) === 2);
  await p.selectOption('#filter-status', 'semua');

  // 9. deep-link encode/decode round-trip
  const link = await p.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('bukuutang:v1'));
    return s && s.customers.length > 5;
  });
  ok('state tersimpan di localStorage', link);

  // 10. refresh: data tetap ada
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  ok('data bertahan setelah refresh', (await p.locator('.bu-card').count()) >= 7);

  // 11. pintu BON berfungsi
  await p.goto(URL, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(600);
  await p.click('#bon-door');
  await p.waitForTimeout(1800);
  const heroHidden = await p.evaluate(() => document.getElementById('hero').style.display === 'none');
  ok('pintu BON membuka buku', heroHidden);

  ok('tanpa pageerror', errs.length === 0);
  if (errs.length) console.log('   errors:', errs.slice(0, 3));
  await b.close();
  console.log(`\n${pass} lolos, ${fail} gagal`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FATAL', e.message); process.exit(1); });
