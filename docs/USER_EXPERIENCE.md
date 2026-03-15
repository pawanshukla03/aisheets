# Real Time Assistance — User Experience (UX) Overview

## How the user will start the application

1. **Launch**
   - User starts the app by double-clicking the desktop shortcut, from the Start menu, or from the terminal (`python main.py` / run the built executable).
   - Optionally, the app can minimize to the **system tray** so it stays out of the way but is always one click away.

2. **First screen**
   - A single window opens with a clear, minimal layout:
     - A prominent **“What do you want to do?”** (or similar) area.
     - A text box (and optionally a mic button for voice).
   - No login or complex setup the first time—user can start typing immediately.

---

## How they will use it (step-by-step journey)

### Step 1 — Enter the goal
- User types (or speaks) their intent in plain language, e.g.:
  - *“Install Python on my computer”*
  - *“Turn on dark mode in Windows”*
  - *“Share my screen in Zoom”*
- They press **Enter** or click **“Get steps”** (or “Start”).

### Step 2 — Review the plan
- The app calls an AI to break the task into **numbered steps**.
- Steps appear in a list (e.g. in the same window or in a side panel).
- User can:
  - **Start** — begin execution and turn on screen monitoring.
  - **Edit goal** — change the task and regenerate steps.
  - **Expand/collapse** steps if the list is long.

### Step 3 — Start execution and monitoring
- User clicks **“Start”** or **“Begin”**.
- The app may **minimize or collapse** to a compact overlay or a small always-on-top panel so the user can work on the rest of the screen.
- **Screen monitoring starts** (e.g. capture every few seconds). The user sees a small indicator that the app is “watching” (e.g. “Monitoring…” or a subtle icon).

### Step 4 — Work on the task with real-time feedback
- User performs the steps on their laptop (browser, Settings, terminal, etc.).
- The app:
  - Captures the screen periodically.
  - Sends the image + current step + goal to a vision AI.
  - Gets back short, actionable feedback.
- User sees:
  - **Current step** clearly highlighted (e.g. “Step 3: Click the Download button”).
  - **Live feedback** in a dedicated area, e.g.:
    - *“You’re on the right track — the Python download page is open.”*
    - *“Next: click the ‘Download Python 3.x’ button.”*
    - *“It looks like the installer is running. When it finishes, check ‘Add Python to PATH’ and click Install Now.”*
- User can:
  - **Move to next step** manually if they prefer.
  - **Ask a quick question** (e.g. “Where is the PATH option?”) and get an answer based on the current screen.
  - **Pause** monitoring (privacy or to take a break).
  - **End session** when done.

### Step 5 — Finish
- User marks the task **“Done”** or closes the app.
- Optionally: short summary (“You completed 5 steps”) or option to **start a new task** from the same window.

---

## Summary: flow at a glance

```
[Open app] → [Type/say goal] → [See steps] → [Start] → [Do steps on laptop]
                                                              ↓
                                    [App monitors screen and shows live feedback]
                                                              ↓
                                    [User follows feedback, moves to next step, or asks for help]
                                                              ↓
                                    [User marks done or starts a new task]
```

---

## What the experience “feels” like

- **Simple start**: One box, one sentence, then steps.
- **Guided**: User always knows the current step and what to do next.
- **Non-intrusive**: Small overlay or collapsible panel, not a full-screen takeover.
- **Transparent**: Clear when monitoring is on (e.g. “Monitoring…” or icon).
- **In control**: User can pause, skip, or ask for help at any time.

This document is the reference for the UX; the visualization will reflect this flow and these screens.
