import { createContext, useContext } from 'react'

export const VERSION = __APP_VERSION__
export const T = {
  task: { n: 'Task', st: ['Todo', 'Doing', 'Review', 'Done'] },
  project: { n: 'Project', st: ['Planning', 'Active', 'Paused', 'Done'] },
  content: { n: 'Content', st: ['Idea', 'Planned', 'Posted'] },
  client: { n: 'Client', st: ['Lead', 'Active', 'Done'] },
  plan: { n: 'Plan', st: ['Planned', 'Doing', 'Done'] },
  note: { n: 'Note', st: ['Open', 'Archived'] }
}
export const PRI = ['Low', 'Medium', 'High', 'Urgent']
const TONES = ['#d95d39', '#e8b04b', '#4fb99f', '#6c8ebf', '#b5698f', '#8a9a5b', '#c28e5c', '#7b6fd0']
export const tone = id => TONES[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length]
export const isDone = i => i.status === T[i.type]?.st.at(-1)
export const progress = (p, items) => {
  const t = items.filter(i => i.type === 'task' && i.project === p.id)
  return t.length ? Math.round(t.filter(isDone).length / t.length * 100) : isDone(p) ? 100 : 0
}
export const blank = (type, extra = {}) => ({
  id: crypto.randomUUID(), type, title: '', sub: '', date: '', status: T[type].st[0],
  notes: '', priority: 'Medium', project: '', created: Date.now(), ...extra
})
export const Ctx = createContext(null)
export const useCtx = () => useContext(Ctx)
