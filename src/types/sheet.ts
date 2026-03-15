export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontFamily?: string;
  fontSize?: number;
  textColor?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  wrap?: boolean;
  numberFormat?: 'number' | 'currency' | 'percent' | 'plain';
}

export interface CellData {
  raw: string;           // what user typed (e.g. "=SUM(A1:A5)" or "42")
  computed?: string | number;  // displayed value after formula eval
  format?: CellFormat;
}

export type GridData = Record<string, CellData>;  // key = "row,col" e.g. "0,0"

/** Persisted sheet payload (grid + row comments + attachments) */
export interface SheetData {
  grid: GridData;
  rowComments: Record<number, RowComment[]>;
  rowAttachments: Record<number, RowAttachment[]>;
}

export interface RowComment {
  id: string;
  text: string;
  createdAt: number;
}

export interface RowAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // base64 for in-memory storage
}

export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function colToLetter(col: number): string {
  let s = '';
  let c = col;
  while (c >= 0) {
    s = String.fromCharCode((c % 26) + 65) + s;
    c = Math.floor(c / 26) - 1;
  }
  return s;
}

export function letterToCol(letters: string): number {
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return col - 1;
}
