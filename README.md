# AISheets

A spreadsheet app with a Google Sheets–like grid and common operations.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (e.g. http://localhost:5173).

## Features

- **Grid**: Rows and columns with cell selection; click to select, double-click or press Enter to edit.
- **Formulas**: Start with `=` or use the **Functions** menu (Google Sheets–style categories):
  - **Math**: SUM, AVERAGE, COUNT, MIN, MAX, ABS, ROUND, ROUNDUP, ROUNDDOWN, FLOOR, CEILING, INT, MOD, POWER, SQRT, PI, RAND, RANDBETWEEN, SIGN, TRUNC, PRODUCT, QUOTIENT, SUMSQ
  - **Statistical**: MEDIAN, COUNTBLANK, COUNTA, STDEV, VAR, LARGE, SMALL
  - **Logical**: IF, AND, OR, NOT, TRUE, FALSE, IFERROR
  - **Text**: CONCATENATE, LEFT, RIGHT, MID, LEN, UPPER, LOWER, TRIM, TEXT, VALUE, CHAR, CODE, REPT
  - **Date**: TODAY, NOW, DATE, DAY, MONTH, YEAR, DAYS, WEEKDAY
  - **Info**: ISBLANK, ISNUMBER, ISTEXT, ISERROR, ISEVEN, ISODD
  - **Lookup**: ROW, COLUMN, CHOOSE
  - Plus cell references and arithmetic (e.g. `=A1+B1`, `=SUM(A1:A5)*2`)
- **Formatting**: Toolbar – **B**old, *I*talic, number format (Plain, Number, Currency, Percent).
- **Structure**: Insert/delete row or column (relative to selected cell).
- **Copy/Paste**: Copy (Ctrl/Cmd+C) and Paste (Ctrl/Cmd+V) for the selected cell.
- **Formula bar**: Shows selected cell reference and value; edit in the bar or in the cell. Commit with Enter, cancel with Escape.

## Build

```bash
npm run build
```

Output is in the `dist/` folder.

## Sharing over the internet (secure server)

A separate server lets you run AISheets so friends can open it via a URL. Sheets can be saved and reopened by name. The server runs only on your machine; you expose it with a **tunnel** (e.g. ngrok) so your PC is not directly on the internet.

See **[SERVER.md](./SERVER.md)** for:

- Installing and running the server
- Using a tunnel (ngrok or Cloudflare) to get a shareable URL
- Optional password protection
- Security measures (rate limiting, binding to localhost, no port forwarding)
