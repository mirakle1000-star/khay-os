import { allRaw, putRaw, refresh } from './db'

const API = 'https://api.github.com/gists/', F = 'khay-os.json'

export async function sync() {
  const tk = localStorage.tk
  if (!tk) return 'Add a GitHub token first.'
  if (!navigator.onLine) return 'You are offline. Sync runs when you reconnect.'
  const H = { Authorization: 'Bearer ' + tk, Accept: 'application/vnd.github+json' }
  let gid = (localStorage.gid || '').trim()
  if (!gid) {
    const r = await fetch('https://api.github.com/gists', { method: 'POST', headers: H, body: JSON.stringify({ description: 'Khay OS data', public: false, files: { [F]: { content: '{"items":[]}' } } }) })
    if (!r.ok) return 'GitHub rejected the token. It needs the gist permission.'
    gid = localStorage.gid = (await r.json()).id
  }
  const r = await fetch(API + gid, { headers: H })
  if (!r.ok) return 'Could not open that Gist. Check the ID and token.'
  const f = (await r.json()).files[F], txt = f.truncated ? await (await fetch(f.raw_url)).text() : f.content
  const ts = i => i.updated || i.created || 0, m = new Map()
  for (const i of [...(JSON.parse(txt).items || []), ...await allRaw()]) { const o = m.get(i.id); if (!o || ts(i) > ts(o)) m.set(i.id, i) }
  const merged = [...m.values()]
  for (const i of merged) await putRaw(i)
  const w = await fetch(API + gid, { method: 'PATCH', headers: H, body: JSON.stringify({ files: { [F]: { content: JSON.stringify({ items: merged }) } } }) })
  if (!w.ok) return 'Could not save to the Gist.'
  localStorage.last = Date.now(); await refresh()
  return 'Synced ' + new Date().toLocaleTimeString()
}
