// Normaliza encabezados y valores del Excel
export const normalizeHeader = (header) => String(header || '')
.trim()
.toUpperCase()
.normalize('NFD').replace(/[\u0300-\u036f]/g, '');


export const toNull = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : v);


export const toInt = (v) => {
const n = Number(String(v).replace(/[^0-9-]/g, ''));
return Number.isFinite(n) ? n : null;
};


export const toDate = (v) => {
if (!v) return null;
// v puede venir como Excel date serial, Date, o string dd/mm/yyyy
if (v instanceof Date) return new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate()));
if (typeof v === 'number') {
// Excel serial (desde 1900-01-01)
const excelEpoch = new Date(Date.UTC(1899, 11, 30));
const ms = v * 86400000; // días a ms
return new Date(excelEpoch.getTime() + ms);
}
const s = String(v).trim();
const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
if (m) {
const [_, d, mo, y] = m.map(Number);
return new Date(Date.UTC(y, mo - 1, d));
}
// ISO
const d = new Date(s);
return isNaN(d) ? null : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};


export const toTime = (v) => {
  if (v === undefined || v === null || v === '') return null;

  // fracción del día (Excel)
  if (typeof v === 'number' && v > 0 && v < 1.5) {
    const total = Math.round(v * 24 * 60 * 60);
    const hh = String(Math.floor(total / 3600)).padStart(2, '0');
    const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const ss = String(total % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  const s = String(v).trim();

  // formato HHMMSS (p. ej. 202357 -> 20:23:57)
  if (/^\d{6}$/.test(s)) {
    const hh = s.slice(0, 2);
    const mm = s.slice(2, 4);
    const ss = s.slice(4, 6);
    return `${hh}:${mm}:${ss}`;
  }

  // hh:mm o hh:mm:ss
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const hh = String(m[1]).padStart(2, '0');
    const mm = String(m[2]).padStart(2, '0');
    const ss = String(m[3] || '00').padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  return null;
};