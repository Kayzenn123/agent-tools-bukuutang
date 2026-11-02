/* BukuUtang — ui.js
 * Render dua dunia, form, validasi (suara Bu Buku), toast, odometer, tab mobile.
 */
'use strict';

import { gsap } from 'gsap';
import {
  loadState, saveState, clearState, addCustomer, addDebt, addPayment, removeCustomer,
  balance, sumDebts, sumPayments, oldestDebtAge, statusOf, STATUS_LABEL, totals,
} from './store.js';
import { rp, tgl, encodeState, decodeState, readDeepLink, exportJSON, exportCSV, waMessage, copyText } from './share.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

let S; // state
let filterStatus = 'semua';
let query = '';

/* ---------- Toast (Bu Buku) ---------- */
export function toast(msg, kind = 'ok') {
  const region = $('#toast-region');
  const el = document.createElement('div');
  el.className = 'bu-toast bu-toast-' + kind;
  el.setAttribute('role', 'status');
  el.innerHTML = `<span aria-hidden="true">${kind === 'ok' ? '✓' : '!'}</span><span>${esc(msg)}</span>`;
  region.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => {
    el.classList.remove('in');
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

/* ---------- Odometer total ---------- */
let shownTotal = 0;
function renderTotal(target) {
  const el = $('#total-piutang');
  if (!el) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || Math.abs(target - shownTotal) < 1) {
    shownTotal = target;
    el.textContent = rp(target);
    return;
  }
  const from = shownTotal;
  const t0 = performance.now();
  const dur = 600;
  const step = (t) => {
    const p = Math.min((t - t0) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    shownTotal = from + (target - from) * e;
    el.textContent = rp(Math.round(shownTotal));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- Status badge (label + bentuk, bukan warna saja) ---------- */
function badge(st) {
  const shape = { lancar: '●', waspada: '▲', macet: '■', lunas: '✓' }[st];
  return `<span class="bu-badge bu-badge-${st}"><span aria-hidden="true">${shape}</span> ${STATUS_LABEL[st]}</span>`;
}

/* ---------- Render DUNIA BON ---------- */
function customerCard(c) {
  const b = balance(c);
  const st = statusOf(c);
  const age = oldestDebtAge(c);
  const debList = c.debts
    .map((d) => `<li><span>${esc(d.desc)}</span><span>${rp(d.amount)} <em>· ${tgl(d.date)}</em></span></li>`)
    .join('');
  const payList = c.payments.length
    ? `<p class="bu-card-pay">Sudah dibayar ${rp(sumPayments(c))} (${c.payments.length}×)</p>`
    : '';
  return `
  <article class="bu-card" data-customer="${c.id}" data-status="${st}">
    <header class="bu-card-head">
      <h3>${esc(c.name)}</h3>
      ${badge(st)}
    </header>
    <ul class="bu-card-debts">${debList}</ul>
    ${payList}
    <p class="bu-card-total">Sisa: <strong>${rp(b)}</strong> · bon tertua ${age} hari</p>
    <div class="bu-card-actions">
      <button class="bu-btn bu-btn-pay" data-act="bayar" data-id="${c.id}">Catat bayar</button>
      <button class="bu-btn" data-act="bon" data-id="${c.id}">Bon lagi</button>
      <button class="bu-btn bu-btn-ghost" data-act="wa" data-id="${c.id}">Tagih WA</button>
      <button class="bu-btn bu-btn-ghost bu-btn-danger" data-act="hapus" data-id="${c.id}" aria-label="Hapus ${esc(c.name)}">Hapus</button>
    </div>
    <form class="bu-inline-form" data-payform="${c.id}" hidden>
      <label>Nominal bayar (Rp) <input type="number" name="amount" min="1" max="1000000000" inputmode="numeric" required aria-label="Nominal bayar ${esc(c.name)}"></label>
      <label>Tanggal <input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}" required></label>
      <div class="bu-inline-actions">
        <button type="submit" class="bu-btn bu-btn-pay">Simpan bayar</button>
        <button type="button" class="bu-btn bu-btn-ghost" data-act="batal">Batal</button>
      </div>
      <p class="bu-form-err" role="alert" hidden></p>
    </form>
    <form class="bu-inline-form" data-bonform="${c.id}" hidden>
      <label>Barang <input type="text" name="desc" maxlength="120" required placeholder="mis. indomie 3 bks" aria-label="Barang ${esc(c.name)}"></label>
      <label>Nominal (Rp) <input type="number" name="amount" min="1" max="1000000000" inputmode="numeric" required></label>
      <label>Tanggal <input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}" required></label>
      <div class="bu-inline-actions">
        <button type="submit" class="bu-btn bu-btn-pay">Catat bon</button>
        <button type="button" class="bu-btn bu-btn-ghost" data-act="batal">Batal</button>
      </div>
      <p class="bu-form-err" role="alert" hidden></p>
    </form>
  </article>`;
}

function renderBon() {
  const list = $('#dunia-bon-list');
  let arr = S.customers.filter((c) => balance(c) > 0);
  if (filterStatus !== 'semua') arr = arr.filter((c) => statusOf(c) === filterStatus);
  if (query) arr = arr.filter((c) => c.name.toLowerCase().includes(query));
  if (!arr.length) {
    list.innerHTML = `<div class="bu-empty">
      <p class="bu-empty-big">Bukunya masih bersih.</p>
      <p>${query || filterStatus !== 'semua' ? 'Tidak ada yang cocok dengan saringan. Coba ubah kata kunci.' : 'Catat bon pertama di bawah, biar warungnya jalan.'}</p>
    </div>`;
    return;
  }
  list.innerHTML = arr.map(customerCard).join('');
}

/* ---------- Render DUNIA LUNAS ---------- */
function renderLunas() {
  const t = totals(S);
  renderTotal(t.piutang);
  $('#stat-pelanggan').textContent = t.pelangganAktif;
  $('#stat-macet').textContent = t.macet;
  $('#stat-bayar').textContent = rp(t.lunasBulanIni);

  const hist = [];
  for (const c of S.customers) for (const p of c.payments) hist.push({ c, p });
  hist.sort((a, b) => (a.p.date < b.p.date ? 1 : -1));
  const box = $('#dunia-lunas-list');
  box.innerHTML = hist.length
    ? hist.slice(0, 30).map(({ c, p }) => `
      <li class="bu-pay-row">
        <span class="bu-stamp-mini" aria-hidden="true">LUNAS</span>
        <span><strong>${esc(c.name)}</strong> — ${esc(p.note || 'pembayaran')}</span>
        <span>${rp(p.amount)} <em>· ${tgl(p.date)}</em></span>
      </li>`).join('')
    : `<div class="bu-empty"><p class="bu-empty-big">Belum ada yang bayar.</p><p>Kalau ada yang lunasi, catat di sini biar ketahuan.</p></div>`;

  const sample = $('#sample-note');
  if (sample) sample.hidden = !S.sample;
}

/* ---------- Select pelanggan di form ---------- */
function renderCustomerOptions() {
  const sel = $('#f-pelanggan');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = `<option value="">— pilih pelanggan —</option>` +
    S.customers.map((c) => `<option value="${c.id}">${esc(c.name)}${balance(c) > 0 ? ' (' + rp(balance(c)) + ')' : ''}</option>`).join('');
  if ([...sel.options].some((o) => o.value === cur)) sel.value = cur;
}

function renderAll() {
  renderBon();
  renderLunas();
  renderCustomerOptions();
}

/* ---------- Validasi (suara Bu Buku) ---------- */
function fieldError(input, msg) {
  const form = input.closest('form');
  const err = form.querySelector('.bu-form-err');
  err.textContent = msg;
  err.hidden = false;
  input.classList.add('bu-invalid');
  input.setAttribute('aria-invalid', 'true');
  input.focus();
}
function clearFieldError(input) {
  const form = input.closest('form');
  const err = form.querySelector('.bu-form-err');
  if (err) err.hidden = true;
  input.classList.remove('bu-invalid');
  input.removeAttribute('aria-invalid');
}

/* ---------- Stempel LUNAS (signature moment) ---------- */
function slamStamp(card) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stamp = document.createElement('div');
  stamp.className = 'bu-stamp-slam';
  stamp.setAttribute('aria-hidden', 'true');
  stamp.textContent = 'LUNAS';
  card.appendChild(stamp);
  if (gsap && !reduce) {
    gsap.fromTo(stamp, { scale: 3, opacity: 0, rotate: -18 }, { scale: 1, opacity: 1, rotate: -12, duration: 0.45, ease: 'power4.in',
      onComplete: () => {
        gsap.fromTo(card, { x: 0 }, { x: 6, duration: 0.05, repeat: 3, yoyo: true, clearProps: 'x' });
        setTimeout(() => stamp.remove(), 900);
      } });
  } else {
    setTimeout(() => stamp.remove(), 900);
  }
}

/* ---------- Aksi ---------- */
function persist() {
  if (!saveState(S)) toast('Gagal menyimpan. Memori browser penuh?', 'err');
}

function onCardClick(e) {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const id = btn.dataset.id;
  const c = S.customers.find((x) => x.id === id);
  const card = btn.closest('.bu-card');
  const act = btn.dataset.act;

  if (act === 'bayar' || act === 'bon') {
    const f = card.querySelector(act === 'bayar' ? `[data-payform="${id}"]` : `[data-bonform="${id}"]`);
    const other = card.querySelector(act === 'bayar' ? `[data-bonform="${id}"]` : `[data-payform="${id}"]`);
    other.hidden = true;
    f.hidden = !f.hidden;
    if (!f.hidden) f.querySelector('input').focus();
  } else if (act === 'batal') {
    btn.closest('form').hidden = true;
  } else if (act === 'wa') {
    copyText(waMessage(c)).then((ok) => toast(ok ? `Tagihan ${c.name} disalin. Tempel di WA.` : 'Gagal menyalin. Coba lagi.', ok ? 'ok' : 'err'));
  } else if (act === 'hapus') {
    if (btn.dataset.confirm === '1') {
      removeCustomer(S, id);
      persist();
      renderAll();
      toast(`${c.name} dihapus dari buku.`);
    } else {
      btn.dataset.confirm = '1';
      btn.textContent = 'Yakin? Ketuk lagi';
      setTimeout(() => {
        if (btn.isConnected) {
          delete btn.dataset.confirm;
          btn.textContent = 'Hapus';
        }
      }, 3000);
    }
  }
}

function onCardSubmit(e) {
  const form = e.target;
  if (!form.matches('[data-payform], [data-bonform]')) return;
  e.preventDefault();
  const id = (form.dataset.payform || form.dataset.bonform);
  const c = S.customers.find((x) => x.id === id);
  if (!c) return;
  const fd = new FormData(form);
  const amount = Math.floor(Number(fd.get('amount')));
  const date = String(fd.get('date') || '');
  const amountInput = form.querySelector('[name=amount]');

  if (!Number.isFinite(amount) || amount < 1) {
    fieldError(amountInput, 'Nominalnya belum bener, Mas. Isi angka lebih dari 0.');
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    fieldError(form.querySelector('[name=date]'), 'Tanggalnya pilih dulu, Dek.');
    return;
  }
  clearFieldError(amountInput);

  if (form.hasAttribute('data-payform')) {
    const b = balance(c);
    if (amount > b) {
      fieldError(amountInput, `Kebanyakan, Mas. Sisanya tinggal ${rp(b)}.`);
      return;
    }
    addPayment(S, id, amount, date, amount >= b ? 'lunas' : 'bayar sebagian');
    persist();
    renderAll();
    const card = document.querySelector(`[data-customer="${id}"]`);
    if (card && amount >= b) slamStamp(card);
    toast(amount >= b ? `LUNAS! ${c.name} sudah bayar semua. Alhamdulillah.` : `Bayar ${rp(amount)} dari ${c.name} dicatat. Sisa ${rp(b - amount)}.`);
  } else {
    const desc = String(fd.get('desc') || '').trim();
    const descInput = form.querySelector('[name=desc]');
    if (!desc) {
      fieldError(descInput, 'Barangnya apa, Dek? Tulis dulu biar jelas.');
      return;
    }
    clearFieldError(descInput);
    addDebt(S, id, desc, amount, date);
    persist();
    renderAll();
    toast(`Bon ${c.name} ${rp(amount)} dicatat.`);
  }
}

/* ---------- Form utama ---------- */
function onMainForms(e) {
  const form = e.target;
  if (form.id === 'form-pelanggan') {
    e.preventDefault();
    const nameEl = $('#fp-nama');
    const waEl = $('#fp-wa');
    const name = nameEl.value.trim();
    if (!name) {
      fieldError(nameEl, 'Namanya siapa, Dek? Nggak bisa catat bon tanpa nama.');
      return;
    }
    if (S.customers.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      fieldError(nameEl, 'Namanya sudah ada di buku. Pilih yang itu saja.');
      return;
    }
    clearFieldError(nameEl);
    const c = addCustomer(S, name, waEl.value);
    persist();
    renderAll();
    form.reset();
    toast(`${c.name} masuk buku.`);
  }
  if (form.id === 'form-bon') {
    e.preventDefault();
    const sel = $('#f-pelanggan');
    const descEl = $('#f-desc');
    const amtEl = $('#f-amount');
    const dateEl = $('#f-date');
    if (!sel.value) {
      fieldError(sel, 'Pilih dulu pelanggannya, Mas.');
      return;
    }
    clearFieldError(sel);
    const desc = descEl.value.trim();
    if (!desc) {
      fieldError(descEl, 'Barangnya apa, Dek? Tulis dulu biar jelas.');
      return;
    }
    clearFieldError(descEl);
    const amount = Math.floor(Number(amtEl.value));
    if (!Number.isFinite(amount) || amount < 1) {
      fieldError(amtEl, 'Nominalnya belum bener, Mas. Isi angka lebih dari 0.');
      return;
    }
    clearFieldError(amtEl);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateEl.value)) {
      fieldError(dateEl, 'Tanggalnya pilih dulu, Dek.');
      return;
    }
    clearFieldError(dateEl);
    const c = S.customers.find((x) => x.id === sel.value);
    addDebt(S, sel.value, desc, amount, dateEl.value);
    persist();
    renderAll();
    form.reset();
    dateEl.value = new Date().toISOString().slice(0, 10);
    toast(`Bon ${c.name} ${rp(amount)} dicatat.`);
  }
}

/* ---------- Tab mobile BON|LUNAS ---------- */
function onTabs(e) {
  const btn = e.target.closest('[data-world]');
  if (!btn) return;
  $$('#world-tabs [data-world]').forEach((b) => {
    const on = b === btn;
    b.setAttribute('aria-selected', String(on));
    b.classList.toggle('on', on);
  });
  $('#dunia-bon').hidden = btn.dataset.world !== 'bon';
  $('#dunia-lunas').hidden = btn.dataset.world !== 'lunas';
}

/* ---------- Deep-link banner ---------- */
function handleDeepLink() {
  const res = readDeepLink();
  const banner = $('#deeplink-banner');
  if (res === null || !banner) return;
  if (res === 'rusak') {
    banner.hidden = false;
    banner.querySelector('p').textContent = 'Tautan bukunya rusak, Dek. Pakai data yang ada saja.';
    banner.querySelector('[data-dl=load]').hidden = true;
    history.replaceState(null, '', location.pathname);
    return;
  }
  const { fresh } = loadStateRaw();
  if (fresh) {
    S = res;
    persist();
    history.replaceState(null, '', location.pathname);
    toast('Buku dari tautan dimuat.');
    return;
  }
  banner.hidden = false;
  banner.querySelector('[data-dl=load]').onclick = () => {
    S = res;
    persist();
    banner.hidden = true;
    history.replaceState(null, '', location.pathname);
    renderAll();
    toast('Buku dari tautan dimuat. Data lama terganti.');
  };
  banner.querySelector('[data-dl=skip]').onclick = () => {
    banner.hidden = true;
    history.replaceState(null, '', location.pathname);
  };
}
function loadStateRaw() {
  try {
    const raw = localStorage.getItem('bukuutang:v1');
    return { fresh: !raw };
  } catch {
    return { fresh: true };
  }
}

/* ---------- Util buttons ---------- */
function onUtils(e) {
  const btn = e.target.closest('[data-util]');
  if (!btn) return;
  const u = btn.dataset.util;
  if (u === 'csv') {
    exportCSV(S);
    toast('CSV diunduh.');
  } else if (u === 'json') {
    exportJSON(S);
    toast('JSON diunduh.');
  } else if (u === 'print') {
    window.print();
  } else if (u === 'link') {
    const url = location.origin + location.pathname + '?buku=' + encodeState(S);
    copyText(url).then((ok) => toast(ok ? 'Tautan buku disalin. Kirim ke siapa saja.' : 'Gagal menyalin tautan.', ok ? 'ok' : 'err'));
  } else if (u === 'import') {
    $('#import-file').click();
  } else if (u === 'clear-sample') {
    clearState();
    const { state } = loadState();
    S = { ...state, customers: [], sample: false };
    persist();
    renderAll();
    toast('Data contoh dibersihkan. Buku kosong, siap dipakai.');
  }
}

function onImportFile(e) {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const parsed = JSON.parse(r.result);
      const slim = { v: 1, c: parsed.customers.map((c) => ({ n: c.name, w: c.wa, d: c.debts.map((d) => [d.desc, d.amount, d.date]), p: c.payments.map((p) => [p.amount, p.date, p.note]) })) };
      S = decodeState(btoa(unescape(encodeURIComponent(JSON.stringify(slim)))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', ''));
      persist();
      renderAll();
      toast('Data JSON dimuat.');
    } catch {
      toast('File-nya nggak kebaca, Mas. Pastikan JSON dari BukuUtang.', 'err');
    }
    e.target.value = '';
  };
  r.readAsText(f);
}

/* ---------- Easter egg: cap 5x ---------- */
function easterEgg() {
  const stamp = $('#stamp-easter');
  if (!stamp) return;
  let n = 0;
  stamp.addEventListener('click', () => {
    n++;
    if (n >= 5) {
      n = 0;
      toast('Rajin menabung, pangkal kaya.');
      if (gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        for (let i = 0; i < 12; i++) {
          const s = document.createElement('div');
          s.className = 'bu-stamp-mini bu-rain';
          s.textContent = 'LUNAS';
          s.style.left = Math.random() * 100 + 'vw';
          document.body.appendChild(s);
          gsap.fromTo(s, { y: -40, rotate: Math.random() * 40 - 20 }, { y: innerHeight + 60, duration: 1.6 + Math.random(), ease: 'power1.in', onComplete: () => s.remove() });
        }
      }
    }
  });
}

/* ---------- Init ---------- */
export function initUI() {
  const { state, corrupted } = loadState();
  S = state;
  if (corrupted) setTimeout(() => toast('Data lama rusak, Dek. Mulai dari contoh dulu ya.', 'err'), 600);

  handleDeepLink();

  document.addEventListener('click', (e) => {
    onCardClick(e);
    onTabs(e);
    onUtils(e);
  });
  document.addEventListener('submit', (e) => {
    onCardSubmit(e);
    onMainForms(e);
  });
  document.addEventListener('input', (e) => {
    if (e.target.classList && e.target.classList.contains('bu-invalid')) clearFieldError(e.target);
  });
  $('#search').addEventListener('input', (e) => {
    query = e.target.value.trim().toLowerCase();
    renderBon();
  });
  $('#filter-status').addEventListener('change', (e) => {
    filterStatus = e.target.value;
    renderBon();
  });
  $('#import-file').addEventListener('change', onImportFile);

  renderAll();
  easterEgg();
}
