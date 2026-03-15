/**
 * AISheets secure server – serves the app and persists sheets.
 * Run behind a tunnel (e.g. ngrok) for internet access. No port forwarding on your router.
 */
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { readFile, writeFile, readdir, mkdir, stat } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3847;
const DATA_DIR = resolve(__dirname, 'data');
const SHEETS_DIR = join(DATA_DIR, 'sheets');
const MANIFEST_PATH = join(DATA_DIR, 'manifest.json');
const DIST_PATH = resolve(__dirname, '..', 'dist');
const MAX_BODY_KB = 1024 * 2; // 2MB max per sheet (attachments can be large)
const SAFE_ID = /^[a-zA-Z0-9_-]{1,64}$/;

const app = express();

// --- Security ---
app.use(helmet({
  contentSecurityPolicy: false, // SPA may need inline scripts; tighten if you add CSP
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json({ limit: `${MAX_BODY_KB}kb` }));

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Optional password (set AISHEETS_PASSWORD in env to require it)
const PASSWORD = process.env.AISHEETS_PASSWORD || '';
function requireAuth(req, res, next) {
  if (!PASSWORD) return next();
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
app.use('/api/', requireAuth);

// --- Helpers ---
function sanitizeId(id) {
  if (typeof id !== 'string' || !SAFE_ID.test(id)) return null;
  return id;
}

async function ensureDirs() {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(SHEETS_DIR, { recursive: true });
}

async function readManifest() {
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data.sheets) ? data : { sheets: [] };
  } catch {
    return { sheets: [] };
  }
}

async function writeManifest(manifest) {
  await ensureDirs();
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
}

// --- API ---
app.get('/api/sheets', async (req, res) => {
  try {
    const manifest = await readManifest();
    res.json(manifest);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list sheets' });
  }
});

app.get('/api/sheets/:id', async (req, res) => {
  const id = sanitizeId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  try {
    const path = join(SHEETS_DIR, `${id}.json`);
    const raw = await readFile(path, 'utf8');
    const data = JSON.parse(raw);
    res.json(data);
  } catch (e) {
    if (e.code === 'ENOENT') return res.status(404).json({ error: 'Not found' });
    console.error(e);
    res.status(500).json({ error: 'Failed to load sheet' });
  }
});

app.post('/api/sheets', async (req, res) => {
  const { name, data } = req.body || {};
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid name' });
  }
  const safeName = name.slice(0, 200).trim() || 'Untitled';
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  try {
    await ensureDirs();
    const payload = {
      id,
      name: safeName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: data && typeof data === 'object' ? data : { grid: {}, rowComments: {}, rowAttachments: {} },
    };
    await writeFile(join(SHEETS_DIR, `${id}.json`), JSON.stringify(payload), 'utf8');
    const manifest = await readManifest();
    manifest.sheets.push({ id: payload.id, name: payload.name, updatedAt: payload.updatedAt });
    await writeManifest(manifest);
    res.status(201).json({ id: payload.id, name: payload.name, updatedAt: payload.updatedAt });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create sheet' });
  }
});

app.put('/api/sheets/:id', async (req, res) => {
  const id = sanitizeId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const { name, data } = req.body || {};
  try {
    const path = join(SHEETS_DIR, `${id}.json`);
    await stat(path);
  } catch (e) {
    if (e.code === 'ENOENT') return res.status(404).json({ error: 'Not found' });
    throw e;
  }
  try {
    const raw = await readFile(join(SHEETS_DIR, `${id}.json`), 'utf8');
    const existing = JSON.parse(raw);
    const safeName = (name != null && typeof name === 'string') ? name.slice(0, 200).trim() || existing.name : existing.name;
    const payload = {
      ...existing,
      name: safeName,
      updatedAt: new Date().toISOString(),
      data: data && typeof data === 'object' ? data : existing.data,
    };
    await writeFile(join(SHEETS_DIR, `${id}.json`), JSON.stringify(payload), 'utf8');
    const manifest = await readManifest();
    const idx = manifest.sheets.findIndex((s) => s.id === id);
    if (idx !== -1) {
      manifest.sheets[idx] = { id, name: payload.name, updatedAt: payload.updatedAt };
      await writeManifest(manifest);
    }
    res.json({ id, name: payload.name, updatedAt: payload.updatedAt });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update sheet' });
  }
});

app.delete('/api/sheets/:id', async (req, res) => {
  const id = sanitizeId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const path = join(SHEETS_DIR, `${id}.json`);
  try {
    const { unlink } = await import('fs/promises');
    await unlink(path);
  } catch (e) {
    if (e.code === 'ENOENT') return res.status(404).json({ error: 'Not found' });
    console.error(e);
    return res.status(500).json({ error: 'Failed to delete' });
  }
  try {
    const manifest = await readManifest();
    manifest.sheets = manifest.sheets.filter((s) => s.id !== id);
    await writeManifest(manifest);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update manifest' });
  }
});

// --- Static (SPA) ---
app.use(express.static(DIST_PATH, { index: false }));
app.get('*', (req, res) => {
  res.sendFile(join(DIST_PATH, 'index.html'));
});

// --- Start ---
ensureDirs().then(() => {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`AISheets server: http://127.0.0.1:${PORT}`);
    console.log('To expose over internet, use a tunnel (e.g. npx ngrok http ' + PORT + ')');
    if (PASSWORD) console.log('Password protection is ON (set AISHEETS_PASSWORD)');
  });
}).catch((err) => {
  console.error('Failed to create data dir:', err);
  process.exit(1);
});
