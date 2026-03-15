# AISheets server – secure sharing over the internet

The server runs **only on your machine** (localhost). It does **not** open your computer to the internet. You expose it safely using a **tunnel** so friends can access it via a URL.

---

## Most secure way (no impact on your PC or data)

**Why this is safe:**

- **Your computer is not exposed.** The server listens only on `127.0.0.1`. No one on the internet can connect to your PC directly. You never open your router or firewall.
- **Only the app is shared.** Visitors see only AISheets in the browser. They cannot access your files, documents, browser data, or anything else on your machine.
- **Data stays in one folder.** Saved sheets are stored only in `server/data/sheets/`. The server cannot read or write outside that folder.
- **Tunnel = middleman.** Traffic flows: **Internet → Tunnel (ngrok/Cloudflare) → Your local server**. Your home IP and network stay hidden.

**Steps (most secure setup):**

1. **Use a password** so only people you give it to can open or save sheets (see “Optional: password protection” below). Set `AISHEETS_PASSWORD` and `VITE_AISHEETS_PASSWORD` before starting.
2. **Run the server** with `npm run server` (from the project folder). It only binds to localhost.
3. **Expose with a tunnel** in a second terminal: run `ngrok http 3847` (or Cloudflare Tunnel). Share the **HTTPS** URL with friends.
4. **When you’re done,** stop the tunnel (Ctrl+C) and then stop the server. The app is no longer reachable from the internet.

No port forwarding, no opening your router, no impact on the rest of your computer or data.

---

## Security measures

- **Binds to 127.0.0.1 only** – not reachable from the network until you use a tunnel.
- **No port forwarding** – you don’t open ports on your router; the tunnel handles the internet.
- **Rate limiting** – 60 API requests per minute per IP to reduce abuse.
- **Security headers** – Helmet sets safe HTTP headers.
- **Strict API validation** – sheet IDs are sanitized (no path traversal); body size limited (e.g. 2MB).
- **Optional password** – set `AISHEETS_PASSWORD` so only people with the password can access the API.

## 1. Install and build

From the project root:

```bash
npm install
cd server && npm install && cd ..
npm run build
```

## 2. Run the server (local only)

```bash
npm run server
```

Or run the server and the app in dev with live reload:

```bash
npm run server:dev
```

The app is at **http://127.0.0.1:3847** (only on your machine).

## 3. Expose with a tunnel (so friends can open the URL)

Use a tunnel so the world can reach your local server **without** opening your router or exposing your PC directly.

### Option A: ngrok (simple)

1. Sign up at [ngrok.com](https://ngrok.com) (free tier is enough).
2. Install: `npm install -g ngrok` or download from the site.
3. In **another terminal** (keep the server running):

   ```bash
   ngrok http 3847
   ```

4. Copy the **HTTPS** URL ngrok shows (e.g. `https://abc123.ngrok.io`) and share it with friends.

They open that URL in the browser; traffic goes ngrok → your local server. Your machine is never directly exposed.

### Option B: Cloudflare Tunnel (no account on ngrok)

1. Install [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/).
2. Run:

   ```bash
   cloudflared tunnel --url http://127.0.0.1:3847
   ```

3. Use the generated `*.trycloudflare.com` URL.

## 4. Optional: password protection

To require a shared password for all users (including your friends), put the password **only in a `.env` file** (do not commit `.env`).

**Step 1 — Create or edit `.env` in the project root**

Add (or edit) these lines. Use a strong password of your choice; do not put real passwords in this file or in chat.

```bash
# Server (for API checks)
AISHEETS_PASSWORD=<your chosen password>

# Frontend (so the app can save/load; must match the server value)
VITE_AISHEETS_PASSWORD=<your chosen password>
```

Replace `<your chosen password>` with the same value in both variables.

**Step 2 — Run the server**

The server reads `AISHEETS_PASSWORD` from the environment. If you use `.env`, load it before starting (e.g. with `dotenv` or by running from an environment that loads `.env`). From the project root:

```bash
npm run server
```

If you prefer to set the variable only for the current shell (no `.env` file), set `AISHEETS_PASSWORD` and `VITE_AISHEETS_PASSWORD` to your chosen value in that session only; do not paste real passwords into documentation or code.

Rebuild the app after changing `VITE_AISHEETS_PASSWORD`. Only requests that send this password (in the `Authorization: Bearer ...` header) can list, open, or save sheets.

## 5. What gets stored

- Sheets are stored under **server/data/sheets/** as JSON files.
- The **server/data/** folder is in `.gitignore` so it isn’t committed.
- Back up that folder if you want to keep the sheets.

## Summary

| Step | Action |
|------|--------|
| 1 | `npm install`, `cd server && npm install`, `npm run build` |
| 2 | `npm run server` (listens on http://127.0.0.1:3847) |
| 3 | In another terminal: `ngrok http 3847` (or Cloudflare Tunnel) |
| 4 | Share the tunnel HTTPS URL with friends |
| 5 | (Optional) Set `AISHEETS_PASSWORD` and `VITE_AISHEETS_PASSWORD` for password protection |

Your machine is only reached through the tunnel provider; you don’t open your firewall or router.
