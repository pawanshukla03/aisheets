import type { GridData } from '../types/sheet';
import { cellKey, letterToCol, colToLetter } from '../types/sheet';
import { ALL_FUNCTION_NAMES } from '../data/functionsList';

const CELL_REF = /^([A-Z]+)([1-9][0-9]*)$/i;
const RANGE_REF = /^([A-Z]+)([1-9][0-9]*):([A-Z]+)([1-9][0-9]*)$/i;
const FUNC_NAMES = ALL_FUNCTION_NAMES.join('|');
const FUNC_REGEX = new RegExp(`\\b(${FUNC_NAMES})\\s*\\(`, 'gi');

function parseCellRef(ref: string): { row: number; col: number } | null {
  const m = ref.trim().match(CELL_REF);
  if (!m) return null;
  const col = letterToCol(m[1].toUpperCase());
  const row = parseInt(m[2], 10) - 1;
  return { row, col };
}

export function getCellValue(grid: GridData, row: number, col: number): number | null {
  const key = cellKey(row, col);
  const cell = grid[key];
  if (!cell) return null;
  const v = cell.computed ?? cell.raw;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/,/g, ''));
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

function getCellValueAny(grid: GridData, row: number, col: number): string | number | null {
  const key = cellKey(row, col);
  const cell = grid[key];
  if (!cell) return null;
  const v = cell.computed ?? cell.raw;
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'number') return v;
  return String(v);
}

function resolveRangeNumbers(grid: GridData, rangeStr: string): number[] {
  const m = rangeStr.trim().match(RANGE_REF);
  if (m) {
    const r0 = parseInt(m[2], 10) - 1;
    const c0 = letterToCol(m[1].toUpperCase());
    const r1 = parseInt(m[4], 10) - 1;
    const c1 = letterToCol(m[3].toUpperCase());
    const values: number[] = [];
    for (let r = Math.min(r0, r1); r <= Math.max(r0, r1); r++) {
      for (let c = Math.min(c0, c1); c <= Math.max(c0, c1); c++) {
        const v = getCellValue(grid, r, c);
        if (v !== null) values.push(v);
      }
    }
    return values;
  }
  const single = parseCellRef(rangeStr);
  if (single) {
    const v = getCellValue(grid, single.row, single.col);
    return v !== null ? [v] : [];
  }
  return [];
}

function resolveRangeMixed(grid: GridData, rangeStr: string): (string | number)[] {
  const m = rangeStr.trim().match(RANGE_REF);
  if (m) {
    const r0 = parseInt(m[2], 10) - 1;
    const c0 = letterToCol(m[1].toUpperCase());
    const r1 = parseInt(m[4], 10) - 1;
    const c1 = letterToCol(m[3].toUpperCase());
    const values: (string | number)[] = [];
    for (let r = Math.min(r0, r1); r <= Math.max(r0, r1); r++) {
      for (let c = Math.min(c0, c1); c <= Math.max(c0, c1); c++) {
        const v = getCellValueAny(grid, r, c);
        if (v !== null) values.push(v);
      }
    }
    return values;
  }
  const single = parseCellRef(rangeStr);
  if (single) {
    const v = getCellValueAny(grid, single.row, single.col);
    return v !== null ? [v] : [];
  }
  return [];
}

function parseArgToNumber(p: string, grid: GridData): number | null {
  const t = p.trim();
  if (RANGE_REF.test(t)) {
    const nums = resolveRangeNumbers(grid, t);
    return nums.length === 1 ? nums[0] : null;
  }
  if (CELL_REF.test(t)) {
    const parsed = parseCellRef(t);
    return parsed ? getCellValue(grid, parsed.row, parsed.col) : null;
  }
  const n = parseFloat(t);
  return !Number.isNaN(n) ? n : null;
}

function parseArgToString(p: string, grid: GridData): string {
  const t = p.trim();
  if (RANGE_REF.test(t)) {
    const mixed = resolveRangeMixed(grid, t);
    return mixed.length ? String(mixed[0]) : '';
  }
  if (CELL_REF.test(t)) {
    const parsed = parseCellRef(t);
    const v = parsed ? getCellValueAny(grid, parsed.row, parsed.col) : null;
    return v != null ? String(v) : '';
  }
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))
    return t.slice(1, -1).replace(/""/g, '"');
  return t;
}

function collectNumbers(parts: string[], grid: GridData): number[] {
  const numbers: number[] = [];
  for (const p of parts) {
    if (RANGE_REF.test(p.trim())) {
      numbers.push(...resolveRangeNumbers(grid, p));
    } else if (CELL_REF.test(p.trim())) {
      const v = parseArgToNumber(p, grid);
      if (v !== null) numbers.push(v);
    } else {
      const n = parseFloat(p.trim());
      if (!Number.isNaN(n)) numbers.push(n);
    }
  }
  return numbers.filter((n) => !Number.isNaN(n));
}

function findMatchingParen(expr: string, openIndex: number): number {
  let depth = 1;
  for (let i = openIndex + 1; i < expr.length; i++) {
    if (expr[i] === '(') depth++;
    else if (expr[i] === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function splitArgs(argsStr: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < argsStr.length; i++) {
    const c = argsStr[i];
    if (c === '(') { depth++; current += c; }
    else if (c === ')') { depth--; current += c; }
    else if (c === ',' && depth === 0) { parts.push(current.trim()); current = ''; }
    else current += c;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function evalFunc(
  name: string,
  argsStr: string,
  grid: GridData,
  currentRow: number,
  currentCol: number
): string | number | null {
  const upper = name.toUpperCase();
  const parts = splitArgs(argsStr);

  const toNum = (p: string) => parseArgToNumber(p, grid);
  const nums = () => collectNumbers(parts, grid);

  switch (upper) {
    // Math
    case 'SUM': {
      const n = nums();
      return n.length ? n.reduce((a, b) => a + b, 0) : 0;
    }
    case 'AVERAGE': {
      const n = nums();
      return n.length ? n.reduce((a, b) => a + b, 0) / n.length : null;
    }
    case 'COUNT':
      return nums().length;
    case 'MIN': {
      const n = nums();
      return n.length ? Math.min(...n) : null;
    }
    case 'MAX': {
      const n = nums();
      return n.length ? Math.max(...n) : null;
    }
    case 'ABS': {
      const v = toNum(parts[0]);
      return v !== null ? Math.abs(v) : null;
    }
    case 'ROUND': {
      const v = toNum(parts[0]);
      const places = parts[1] !== undefined ? Math.floor(Number(parts[1]) || 0) : 0;
      return v !== null ? Number((Math.round(v * Math.pow(10, places)) / Math.pow(10, places)).toFixed(places)) : null;
    }
    case 'ROUNDUP': {
      const v = toNum(parts[0]);
      const p = parts[1] !== undefined ? Math.floor(Number(parts[1]) || 0) : 0;
      return v !== null ? Math.ceil(v * Math.pow(10, p)) / Math.pow(10, p) : null;
    }
    case 'ROUNDDOWN': {
      const v = toNum(parts[0]);
      const p = parts[1] !== undefined ? Math.floor(Number(parts[1]) || 0) : 0;
      return v !== null ? Math.floor(v * Math.pow(10, p)) / Math.pow(10, p) : null;
    }
    case 'FLOOR': {
      const v = toNum(parts[0]);
      const fact = parts[1] !== undefined ? (toNum(parts[1]) ?? 1) : 1;
      return v !== null ? Math.floor(v / fact) * fact : null;
    }
    case 'CEILING': {
      const v = toNum(parts[0]);
      const fact = parts[1] !== undefined ? (toNum(parts[1]) ?? 1) : 1;
      return v !== null ? Math.ceil(v / fact) * fact : null;
    }
    case 'INT': {
      const v = toNum(parts[0]);
      return v !== null ? Math.trunc(v) : null;
    }
    case 'MOD': {
      const a = toNum(parts[0]);
      const b = toNum(parts[1]);
      return a !== null && b !== null && b !== 0 ? a % b : null;
    }
    case 'POWER': {
      const base = toNum(parts[0]);
      const exp = toNum(parts[1]);
      return base !== null && exp !== null ? Math.pow(base, exp) : null;
    }
    case 'SQRT': {
      const v = toNum(parts[0]);
      return v !== null && v >= 0 ? Math.sqrt(v) : null;
    }
    case 'PI':
      return Math.PI;
    case 'RAND':
      return Math.random();
    case 'RANDBETWEEN': {
      const low = toNum(parts[0]);
      const high = toNum(parts[1]);
      return low !== null && high !== null ? Math.floor(Math.random() * (high - low + 1)) + low : null;
    }
    case 'SIGN': {
      const v = toNum(parts[0]);
      return v !== null ? Math.sign(v) : null;
    }
    case 'TRUNC': {
      const v = toNum(parts[0]);
      const p = parts[1] !== undefined ? Math.floor(Number(parts[1]) || 0) : 0;
      return v !== null ? Math.trunc(v * Math.pow(10, p)) / Math.pow(10, p) : null;
    }
    case 'PRODUCT': {
      const n = nums();
      return n.length ? n.reduce((a, b) => a * b, 1) : 0;
    }
    case 'QUOTIENT': {
      const a = toNum(parts[0]);
      const b = toNum(parts[1]);
      return a !== null && b !== null && b !== 0 ? Math.trunc(a / b) : null;
    }
    case 'SUMSQ': {
      const n = nums();
      return n.reduce((a, b) => a + b * b, 0);
    }

    // Statistical
    case 'MEDIAN': {
      const n = nums().sort((a, b) => a - b);
      if (n.length === 0) return null;
      const mid = Math.floor(n.length / 2);
      return n.length % 2 ? n[mid] : (n[mid - 1] + n[mid]) / 2;
    }
    case 'COUNTBLANK': {
      const r = parts[0]?.trim();
      if (!r || !RANGE_REF.test(r)) return null;
      const [_, c1, r1, c2, r2] = r.match(RANGE_REF)!;
      const r0 = parseInt(r1, 10) - 1, c0 = letterToCol(c1.toUpperCase());
      const r1e = parseInt(r2, 10) - 1, c1e = letterToCol(c2.toUpperCase());
      let count = 0;
      for (let row = Math.min(r0, r1e); row <= Math.max(r0, r1e); row++) {
        for (let col = Math.min(c0, c1e); col <= Math.max(c0, c1e); col++) {
          const v = getCellValueAny(grid, row, col);
          if (v === null || v === '') count++;
        }
      }
      return count;
    }
    case 'COUNTA': {
      const mixed = parts.flatMap((p) => {
        const t = p.trim();
        if (RANGE_REF.test(t)) return resolveRangeMixed(grid, t);
        const v = parseCellRef(t) ? getCellValueAny(grid, parseCellRef(t)!.row, parseCellRef(t)!.col) : null;
        return v != null ? [v] : [];
      });
      return mixed.length;
    }
    case 'STDEV': {
      const n = nums();
      if (n.length < 2) return null;
      const avg = n.reduce((a, b) => a + b, 0) / n.length;
      const variance = n.reduce((a, b) => a + (b - avg) ** 2, 0) / (n.length - 1);
      return Math.sqrt(variance);
    }
    case 'VAR': {
      const n = nums();
      if (n.length < 2) return null;
      const avg = n.reduce((a, b) => a + b, 0) / n.length;
      return n.reduce((a, b) => a + (b - avg) ** 2, 0) / (n.length - 1);
    }
    case 'LARGE': {
      const dataParts = parts.length >= 2 ? parts.slice(0, -1) : parts;
      const n = collectNumbers(dataParts, grid);
      const k = parts.length >= 2 ? Math.floor(Number(parts[parts.length - 1]) || 1) : 1;
      if (n.length === 0 || k < 1 || k > n.length) return null;
      return [...n].sort((a, b) => b - a)[k - 1];
    }
    case 'SMALL': {
      const dataParts = parts.length >= 2 ? parts.slice(0, -1) : parts;
      const n = collectNumbers(dataParts, grid);
      const k = parts.length >= 2 ? Math.floor(Number(parts[parts.length - 1]) || 1) : 1;
      if (n.length === 0 || k < 1 || k > n.length) return null;
      return [...n].sort((a, b) => a - b)[k - 1];
    }

    // Logical
    case 'IF': {
      const cond = parts[0]?.trim();
      const vTrue = parts[1];
      const vFalse = parts[2];
      const condVal = parseArgToNumber(cond, grid) ?? parseArgToString(cond, grid);
      const isTrue = condVal === 'TRUE' || condVal === 1 || (typeof condVal === 'number' && condVal !== 0) || (typeof condVal === 'string' && condVal.toUpperCase() === 'TRUE');
      const res = isTrue ? (vTrue != null ? (parseArgToNumber(vTrue, grid) ?? parseArgToString(vTrue, grid)) : '') : (vFalse != null ? (parseArgToNumber(vFalse, grid) ?? parseArgToString(vFalse, grid)) : '');
      return res as string | number;
    }
    case 'AND': {
      for (const p of parts) {
        const v = parseArgToNumber(p, grid) ?? parseArgToString(p, grid);
        const truthy = v === 'TRUE' || v === 1 || (typeof v === 'number' && v !== 0) || (typeof v === 'string' && v.toUpperCase() === 'TRUE');
        if (!truthy) return 0;
      }
      return 1;
    }
    case 'OR': {
      for (const p of parts) {
        const v = parseArgToNumber(p, grid) ?? parseArgToString(p, grid);
        const truthy = v === 'TRUE' || v === 1 || (typeof v === 'number' && v !== 0) || (typeof v === 'string' && v.toUpperCase() === 'TRUE');
        if (truthy) return 1;
      }
      return 0;
    }
    case 'NOT': {
      const v = parseArgToNumber(parts[0], grid) ?? parseArgToString(parts[0], grid);
      const truthy = v === 'TRUE' || v === 1 || (typeof v === 'number' && v !== 0) || (typeof v === 'string' && v.toUpperCase() === 'TRUE');
      return truthy ? 0 : 1;
    }
    case 'TRUE':
      return 1;
    case 'FALSE':
      return 0;
    case 'IFERROR': {
      const val = parts[0];
      const fallback = parts[1] ?? '';
      try {
        const ev = parseArgToNumber(val, grid) ?? parseArgToString(val, grid);
        if (typeof ev === 'string' && (ev.startsWith('#') || ev === 'NaN')) return parseArgToString(fallback, grid) || parseArgToNumber(fallback, grid);
        return ev;
      } catch {
        return parseArgToString(fallback, grid) || parseArgToNumber(fallback, grid);
      }
    }

    // Text
    case 'CONCATENATE':
      return parts.map((p) => parseArgToString(p, grid)).join('');
    case 'LEFT': {
      const s = parseArgToString(parts[0], grid);
      const num = parts[1] !== undefined ? Math.floor(Number(parts[1]) || 1) : 1;
      return s.slice(0, Math.max(0, num));
    }
    case 'RIGHT': {
      const s = parseArgToString(parts[0], grid);
      const num = parts[1] !== undefined ? Math.floor(Number(parts[1]) || 1) : 1;
      return num <= 0 ? '' : s.slice(-num);
    }
    case 'MID': {
      const s = parseArgToString(parts[0], grid);
      const start = Math.max(1, Math.floor(Number(parts[1]) || 1));
      const len = Math.max(0, Math.floor(Number(parts[2]) || 0));
      return s.slice(start - 1, start - 1 + len);
    }
    case 'LEN':
      return parseArgToString(parts[0], grid).length;
    case 'UPPER':
      return parseArgToString(parts[0], grid).toUpperCase();
    case 'LOWER':
      return parseArgToString(parts[0], grid).toLowerCase();
    case 'TRIM':
      return parseArgToString(parts[0], grid).trim().replace(/\s+/g, ' ');
    case 'TEXT': {
      const num = toNum(parts[0]);
      const fmt = (parts[1] || '').trim().replace(/^"|"$/g, '');
      if (num === null) return null;
      if (fmt === '0.00' || fmt === '0.00') return num.toFixed(2);
      if (fmt.includes('%')) return (num * 100).toFixed(0) + '%';
      if (fmt.includes('$') || fmt.toLowerCase().includes('currency')) return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(num);
      return String(num);
    }
    case 'VALUE': {
      const s = parseArgToString(parts[0], grid).replace(/,/g, '');
      const n = parseFloat(s);
      return Number.isNaN(n) ? null : n;
    }
    case 'CHAR':
      return String.fromCharCode(Math.floor(Number(parts[0]) || 0));
    case 'CODE':
      return parseArgToString(parts[0], grid).charCodeAt(0) || 0;
    case 'REPT': {
      const s = parseArgToString(parts[0], grid);
      const c = Math.max(0, Math.floor(Number(parts[1]) || 0));
      return s.repeat(c);
    }

    // Date
    case 'TODAY':
      return Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000) + 25569; // serial
    case 'NOW':
      return new Date().getTime() / 86400000 + 25569;
    case 'DATE': {
      const y = Math.floor(Number(parts[0]) || 0);
      const m = Math.floor(Number(parts[1]) || 1);
      const d = Math.floor(Number(parts[2]) || 1);
      const date = new Date(y, m - 1, d);
      return date.getTime() / 86400000 + 25569 - new Date().getTimezoneOffset() / 1440;
    }
    case 'DAY':
    case 'MONTH':
    case 'YEAR': {
      const serial = toNum(parts[0]);
      if (serial === null) return null;
      const d = new Date((serial - 25569) * 86400000);
      if (upper === 'DAY') return d.getDate();
      if (upper === 'MONTH') return d.getMonth() + 1;
      return d.getFullYear();
    }
    case 'DAYS': {
      const end = toNum(parts[0]);
      const start = toNum(parts[1]);
      if (end === null || start === null) return null;
      return Math.round((end - start));
    }
    case 'WEEKDAY': {
      const serial = toNum(parts[0]);
      if (serial === null) return null;
      const type = parts[1] !== undefined ? Math.floor(Number(parts[1]) || 1) : 1;
      const d = new Date((serial - 25569) * 86400000);
      let day = d.getDay(); // 0 Sun .. 6 Sat
      if (type === 1) return day === 0 ? 7 : day; // Mon=1 .. Sun=7
      if (type === 2) return day + 1; // Sun=1 .. Sat=7
      return day;
    }

    // Info
    case 'ISBLANK': {
      const ref = parts[0]?.trim();
      if (CELL_REF.test(ref)) {
        const parsed = parseCellRef(ref);
        if (!parsed) return 0;
        const v = getCellValueAny(grid, parsed.row, parsed.col);
        return (v === null || v === '') ? 1 : 0;
      }
      return 0;
    }
    case 'ISNUMBER': {
      const v = parseArgToNumber(parts[0], grid);
      return v !== null ? 1 : 0;
    }
    case 'ISTEXT': {
      const ref = parts[0]?.trim();
      if (CELL_REF.test(ref)) {
        const parsed = parseCellRef(ref);
        if (!parsed) return 0;
        const cell = grid[cellKey(parsed.row, parsed.col)];
        const raw = cell?.raw ?? '';
        const comp = cell?.computed;
        if (comp !== undefined && comp !== null && typeof comp === 'string' && comp !== '' && !/^-?\d+(\.\d+)?$/.test(String(comp))) return 1;
        if (typeof raw === 'string' && !raw.startsWith('=') && isNaN(parseFloat(raw))) return 1;
      }
      return 0;
    }
    case 'ISERROR': {
      const v = parseArgToString(parts[0], grid);
      return (typeof v === 'string' && v.startsWith('#')) ? 1 : 0;
    }
    case 'ISEVEN': {
      const v = toNum(parts[0]);
      return v !== null ? (Math.floor(v) % 2 === 0 ? 1 : 0) : null;
    }
    case 'ISODD': {
      const v = toNum(parts[0]);
      return v !== null ? (Math.floor(v) % 2 === 1 ? 1 : 0) : null;
    }

    // Lookup
    case 'ROW':
      if (parts[0]) {
        const ref = parts[0].trim();
        const parsed = parseCellRef(ref);
        return parsed ? parsed.row + 1 : currentRow + 1;
      }
      return currentRow + 1;
    case 'COLUMN':
      if (parts[0]) {
        const ref = parts[0].trim();
        const parsed = parseCellRef(ref);
        return parsed ? parsed.col + 1 : currentCol + 1;
      }
      return currentCol + 1;
    case 'CHOOSE': {
      const idx = Math.floor(Number(parts[0]) || 1);
      if (idx < 1 || idx >= parts.length) return null;
      const choice = parts[idx];
      return parseArgToNumber(choice, grid) ?? parseArgToString(choice, grid);
    }

    default:
      return null;
  }
}

export function isFormula(raw: string): boolean {
  return typeof raw === 'string' && raw.trim().startsWith('=');
}

function replaceCellRefs(expr: string, grid: GridData): string {
  return expr.replace(/\b([A-Z]+)([1-9][0-9]*)\b/gi, (match) => {
    const parsed = parseCellRef(match);
    if (!parsed) return match;
    const v = getCellValueAny(grid, parsed.row, parsed.col);
    if (v === null) return '0';
    if (typeof v === 'string') return JSON.stringify(v);
    return String(v);
  });
}

export function evaluateFormula(
  formula: string,
  grid: GridData,
  currentRow: number,
  currentCol: number
): string | number | null {
  let expr = formula.trim().slice(1).trim();
  if (!expr) return null;

  const currentRef = `${colToLetter(currentCol)}${currentRow + 1}`;
  const selfRefRegex = new RegExp(currentRef, 'gi');
  if (selfRefRegex.test(expr)) return '#CIRCULAR!';

  let prev = '';
  while (prev !== expr) {
    prev = expr;
    const match = FUNC_REGEX.exec(expr);
    FUNC_REGEX.lastIndex = 0;
    if (!match) break;
    const start = match.index;
    const openParen = start + match[0].length - 1;
    const closeParen = findMatchingParen(expr, openParen);
    if (closeParen === -1) break;
    const funcName = match[1];
    const argsStr = expr.slice(openParen + 1, closeParen);
    const result = evalFunc(funcName, argsStr, grid, currentRow, currentCol);
    const resultStr = result === null ? '#VALUE!' : (typeof result === 'string' ? JSON.stringify(result) : String(result));
    expr = expr.slice(0, start) + resultStr + expr.slice(closeParen + 1);
  }

  expr = replaceCellRefs(expr, grid);

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${expr})`);
    const result = fn();
    if (typeof result === 'number' && !Number.isNaN(result)) return result;
    if (typeof result === 'string') return result.startsWith('"') ? JSON.parse(result) : result;
    if (typeof result === 'boolean') return result ? 1 : 0;
    return null;
  } catch {
    return '#ERROR!';
  }
}
