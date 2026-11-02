/* BukuUtang — share.js
 * Deep-link ?buku= (snapshot terkompresi base64), ekspor CSV/JSON, impor JSON,
 * salin tagihan WA, cetak. Semua validasi input dianggap tidak tepercaya.
 */
'use strict';

import { balance, sumDebts, sumPayments, statusOf, STATUS_LABEL } from './store.js';

export const rp = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export const tgl = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
};

/* --- Deep link --- */
export function encodeState(state) {
  const slim = {
    v: 1,
    c: state.customers.map((c) => ({
      n: c.name,
      w: c.wa || '',
      d: c.debts.map((x) => [x.desc, x.amount, x.date]),
      p: c.payments.map((x) => [x.amount, x.date, x.note || '']),
    })),
  };
  const json = JSON.stringify(slim);
  return btoa(unescape(encodeURIComponent(json))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export function decodeState(str) {
  const b64 = str.replaceAll('-', '+').replaceAll('_', '/');
  const json = decodeURIComponent(escape(atob(b64)));
  const slim = JSON.parse(json);
  if (!slim || slim.v !== 1 || !Array.isArray(slim.c)) throw new Error('format tautan tidak dikenal');
  const uid = (p) => p + '_' + Math.random().toString(36).slice(2, 9);
  const now = Date.now();
  const state = {
    version: 1,
    seq: 1,
    sample: false,
    customers: slim.c.map((c) => {
      if (typeof c.n !== 'string' || c.n.length > 80) throw new Error('nama pelanggan tidak valid');
      return {
        id: uid('c'),
        name: c.n,
        wa: typeof c.w === 'string' ? c.w.slice(0, 30) : '',
        createdAt: now,
        debts: (c.d || []).map(([desc, amount, date]) => {
          if (typeof amount !== 'number' || amount <= 0 || amount > 1e12) throw new Error('nominal tidak valid');
          return { id: uid('d'), desc: String(desc).slice(0, 120), amount, date: String(date).slice(0, 10) };
        }),
        payments: (c.p || []).map(([amount, date, note]) => {
          if (typeof amount !== 'number' || amount <= 0 || amount > 1e12) throw new Error('nominal tidak valid');
          return { id: uid('p'), amount, date: String(date).slice(0, 10), note: String(note || '').slice(0, 120) };
        }),
      };
    }),
  };
  return state;
}

export function readDeepLink() {
  const q = new URLSearchParams(location.search).get('buku');
  if (!q || q.length > 20000) return null;
  try {
    return decodeState(q);
  } catch {
    return 'rusak';
  }
}

/* --- Ekspor / impor --- */
function download(name, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}

export function exportJSON(state) {
  download('bukuutang-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(state, null, 2), 'application/json');
}

export function exportCSV(state) {
  const rows = [['pelanggan', 'wa', 'jenis', 'keterangan', 'nominal', 'tanggal']];
  for (const c of state.customers) {
    for (const d of c.debts) rows.push([c.name, c.wa, 'bon', d.desc, d.amount, d.date]);
    for (const p of c.payments) rows.push([c.name, c.wa, 'bayar', p.note || 'pembayaran', p.amount, p.date]);
  }
  const csv = rows.map((r) => r.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(',')).join('\n');
  download('bukuutang-' + new Date().toISOString().slice(0, 10) + '.csv', '﻿' + csv, 'text/csv');
}

/* --- Tagihan WA per pelanggan (suara Bu Buku) --- */
export function waMessage(c) {
  const b = balance(c);
  const lines = [
    `Halo ${c.name}, ini Bu Buku dari warung.`,
    `Catatan bon ${tgl(new Date().toISOString().slice(0, 10))}:`,
    ...c.debts.map((d) => `• ${d.desc} — ${rp(d.amount)} (${tgl(d.date)})`),
  ];
  if (c.payments.length) lines.push(`Sudah dibayar: ${rp(sumPayments(c))}`);
  lines.push(`Sisa yang belum dibayar: ${rp(b)}.`);
  lines.push(`Ditunggu ya, Dek. Terima kasih.`);
  return lines.join('\n');
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch { /* abaikan */ }
    ta.remove();
    return ok;
  }
}
