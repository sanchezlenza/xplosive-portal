# Xplosive Dance Company — Parent Portal

Node.js/Express app, same architecture as the La Roca Portal: static HTML/CSS/JS frontend, JSON file storage, PIN-based login with roles.

## Local structure
```
xplosive-portal/
  server.js
  package.json
  data/
    users.json         (PIN + role per user)
    schedule.json       (weekly class schedule — the "Calendar" page)
    events.json          (Events page)
    competitions.json    (Competition schedule page)
    supplies.json        (Supplies page)
  public/
    login.html
    dashboard.html
    calendario.html
    eventos.html
    competencias.html
    supplies.html
    admin.html            (admin-only — edits everything above)
    css/style.css
    js/common.js
```

## Default PINs (change these before going live)
- Admin: `1234`
- Parent: `0000`

To add more parent PINs, edit `data/users.json` — either directly (before deploy) or we can add an admin screen for it later.

## Deploy to Railway (same steps as La Roca)
1. Create a new **private GitHub repo** (suggested name: `xplosive-portal`) and upload this whole folder via the GitHub web interface (Add file → Upload files).
2. In Railway: New Project → Deploy from GitHub repo → select `xplosive-portal`.
3. Add a **persistent volume** mounted at `/data`, and set the environment variable `DATA_DIR=/data` so edits made in the Admin panel survive redeploys. (Without this, the JSON files reset to their original values every time you push new code — same issue we solved on La Roca.)
4. Set environment variable `SESSION_SECRET` to a random string (for login security).
5. Railway will detect `package.json` and run `npm install && npm start` automatically.
6. Once deployed, point a custom domain or subdomain (e.g. `portal.xplosivedanceco.com`) at the Railway service via DNS, same as `portal.larocamiamicc.com`.

## Still pending / to confirm
- Real Google-account-free schedule data is already in `schedule.json` (studio-wide weekly classes) — confirm this is accurate for the *whole studio*, not just one dancer.
- Real supply shop links (currently blank placeholders in `supplies.json` / editable from Admin → Supplies).
- Real event dates (Spring Showcase, Parent Info Night, Fundraiser — currently "TBD").
- Real competition dates for the season (currently "TBD").
- Parent PIN list — one shared PIN, or one per family?
