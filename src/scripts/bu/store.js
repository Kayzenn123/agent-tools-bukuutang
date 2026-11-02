/* BukuUtang — store.js
 * State + persistence localStorage berversi. 100% client-side, tanpa server.
 * Skema: { version: 1, customers: [...], seq: n }
 * customer: { id, name, wa, createdAt, debts: [{id, desc, amount, date}], payments: [{id, amount, date, note}] }
 */
'use strict';

const KEY = 'bukuutang:v1';

const DAY = 86400000;
const now = () => Date.now();
const uid = (p) => p + '_' + Math.random().toString(36).slice(2, 9);

function daysAgo(n) {
  const d = new Date(now() - n * DAY);
  return d.toISOString().slice(0, 10);
}

/* Data contoh — dilabeli jelas di UI. Umur utang bervariasi untuk demo status. */
function sampleData() {
  const mk = (name, wa, debts, payments = []) => ({
    id: uid('c'),
    name,
    wa,
    createdAt: now(),
    debts: debts.map(([desc, amount, age]) => ({ id: uid('d'), desc, amount, date: daysAgo(age) })),
    payments: payments.map(([amount, age, note]) => ({ id: uid('p'), amount, date: daysAgo(age), note: note || '' })),
  });
  return {
    version: 1,
    seq: 1,
    sample: true,
    customers: [
      mk('Budi', '0812-3456-789', [['Indomie goreng 5 bks', 17500, 2]]),
      mk('Siti', '', [['Beras 5 kg', 68000, 5], ['Minyak goreng 1 L', 23000, 5]]),
      mk('Agus', '0813-9876-543', [['Minyak goreng 2 L', 45000, 9]]),
      mk('Rina', '', [['Telur ayam 1 kg', 28000, 14]], [[10000, 3, 'bayar sebagian']]),
      mk('Dewi', '0857-1111-222', [['Kopi sachet 10 pcs', 15000, 21]]),
      mk('Joko', '', [['Gula pasir 1 kg', 17500, 33]]),
      mk('Ani', '0819-5555-666', [['Sabun + sampo', 23000, 40]]),
      mk('Pak RT', '', [['Pulsa 50rb', 52000, 3]], [[52000, 1, 'lunas']]),
    ],
  };
}

function validState(s) {
  if (!s || typeof s !== 'object') return false;
  if (s.version !== 1) return false;
  if (!Array.isArray(s.customers)) return false;
  return s.customers.every(
    (c) =>
      c && typeof c.id === 'string' && typeof c.name === 'string' &&
      Array.isArray(c.debts) && Array.isArray(c.payments) &&
      c.debts.every((d) => typeof d.amount === 'number' && d.amount > 0 && typeof d.date === 'string') &&
      c.payments.every((p) => typeof p.amount === 'number' && p.amount > 0 && typeof p.date === 'string')
  );
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { state: sampleData(), fresh: true };
    const s = JSON.parse(raw);
    if (!validState(s)) return { state: sampleData(), fresh: true, corrupted: true };
    return { state: s, fresh: false };
  } catch {
    return { state: sampleData(), fresh: true, corrupted: true };
  }
}

export function saveState(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY);
  } catch { /* abaikan */ }
}

/* --- Hitungan --- */
export const sumDebts = (c) => c.debts.reduce((a, d) => a + d.amount, 0);
export const sumPayments = (c) => c.payments.reduce((a, p) => a + p.amount, 0);
export const balance = (c) => Math.max(0, sumDebts(c) - sumPayments(c));

export function oldestDebtAge(c) {
  if (!c.debts.length) return 0;
  const oldest = Math.min(...c.debts.map((d) => new Date(d.date + 'T00:00:00').getTime()));
  return Math.max(0, Math.floor((now() - oldest) / DAY));
}

/* Status dari umur utang tertua yang BELUM lunas. Bukan warna saja: ada label + ikon. */
export function statusOf(c) {
  if (balance(c) <= 0) return 'lunas';
  const age = oldestDebtAge(c);
  if (age > 30) return 'macet';
  if (age >= 7) return 'waspada';
  return 'lancar';
}

export const STATUS_LABEL = { lancar: 'LANCAR', waspada: 'WASPADA', macet: 'MACET', lunas: 'LUNAS' };

export function totals(state) {
  let piutang = 0, pelangganAktif = 0, macet = 0, lunasBulanIni = 0;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  for (const c of state.customers) {
    const b = balance(c);
    if (b > 0) {
      pelangganAktif++;
      piutang += b;
      if (statusOf(c) === 'macet') macet++;
    }
    for (const p of c.payments) {
      if (new Date(p.date + 'T00:00:00') >= monthStart) lunasBulanIni += p.amount;
    }
  }
  return { piutang, pelangganAktif, macet, lunasBulanIni, totalPelanggan: state.customers.length };
}

export function addCustomer(state, name, wa) {
  const c = { id: uid('c'), name: name.trim(), wa: (wa || '').trim(), createdAt: now(), debts: [], payments: [] };
  state.customers.unshift(c);
  state.sample = false;
  return c;
}

export function addDebt(state, customerId, desc, amount, date) {
  const c = state.customers.find((x) => x.id === customerId);
  if (!c) return null;
  const d = { id: uid('d'), desc: desc.trim(), amount, date };
  c.debts.push(d);
  state.sample = false;
  return d;
}

export function addPayment(state, customerId, amount, date, note) {
  const c = state.customers.find((x) => x.id === customerId);
  if (!c) return null;
  const p = { id: uid('p'), amount, date, note: (note || '').trim() };
  c.payments.push(p);
  state.sample = false;
  return p;
}

export function removeCustomer(state, id) {
  state.customers = state.customers.filter((c) => c.id !== id);
}

export { uid, daysAgo, KEY };
