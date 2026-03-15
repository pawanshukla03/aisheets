const API = '/api';

export interface SheetMeta {
  id: string;
  name: string;
  updatedAt: string;
}

export interface SheetListResponse {
  sheets: SheetMeta[];
}

export interface SheetDoc {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  data: {
    grid: Record<string, unknown>;
    rowComments: Record<number, unknown[]>;
    rowAttachments: Record<number, unknown[]>;
  };
}

function getAuthHeaders(): HeadersInit {
  const password = typeof import.meta.env !== 'undefined' && (import.meta.env as { VITE_AISHEETS_PASSWORD?: string }).VITE_AISHEETS_PASSWORD;
  const h: HeadersInit = { 'Content-Type': 'application/json' };
  if (password) (h as Record<string, string>)['Authorization'] = `Bearer ${password}`;
  return h;
}

export async function listSheets(): Promise<SheetListResponse> {
  const res = await fetch(`${API}/sheets`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to list sheets');
  return res.json();
}

export async function getSheet(id: string): Promise<SheetDoc> {
  const res = await fetch(`${API}/sheets/${encodeURIComponent(id)}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(res.status === 404 ? 'Not found' : 'Failed to load sheet');
  return res.json();
}

export async function createSheet(name: string, data: SheetDoc['data']): Promise<SheetMeta> {
  const res = await fetch(`${API}/sheets`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, data }),
  });
  if (!res.ok) throw new Error('Failed to create sheet');
  return res.json();
}

export async function updateSheet(id: string, name: string, data: SheetDoc['data']): Promise<SheetMeta> {
  const res = await fetch(`${API}/sheets/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, data }),
  });
  if (!res.ok) throw new Error('Failed to save sheet');
  return res.json();
}

export async function deleteSheet(id: string): Promise<void> {
  const res = await fetch(`${API}/sheets/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete sheet');
}
