# Khay OS v2 (React + Vite PWA)

    npm install
    npm run dev          # develop (service worker is off in dev)
    npm run build && npm run preview   # test offline + install + updates

Release: bump "version" in package.json, commit, push to main. Installed apps show "A new version is ready".
Deploy: repo Settings > Pages > Source: GitHub Actions.
Icon: replace public/icons/icon-192.png and icon-512.png (same names and sizes).
Sync: Settings > Cloud sync (GitHub token with only the gist scope).
