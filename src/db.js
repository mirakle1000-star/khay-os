import { useSyncExternalStore } from 'react'

const open = new Promise((res, rej) => {
  const r = indexedDB.open('khayos', 1)
  r.onupgradeneeded = () => r.result.createObjectStore('items', { keyPath: 'id' })
  r.onsuccess = () => res(r.result)
  r.onerror = () => rej(r.error)
})
const tx = async (mode, fn) => {
  const d = await open
  return new Promise((res, rej) => {
    const t = d.transaction('items', mode), q = fn(t.objectStore('items'))
    t.oncomplete = () => res(q?.result)
    t.onerror = () => rej(t.error)
  })
}

let items = []
const subs = new Set()
export const allRaw = () => tx('readonly', s => s.getAll())
export const putRaw = o => tx('readwrite', s => s.put(o))
export const refresh = async () => { items = (await allRaw()).filter(i => !i.deleted); subs.forEach(f => f()) }
export const save = async o => { await putRaw({ ...o, updated: Date.now() }); refresh() }
export const remove = async id => {
  const i = items.find(x => x.id === id)
  await putRaw({ id, type: i?.type, deleted: true, updated: Date.now() }); refresh()
}
export const useItems = () => useSyncExternalStore(f => (subs.add(f), () => subs.delete(f)), () => items)
refresh()
