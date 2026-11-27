import { useState } from 'react'
import { motion } from 'motion/react'
import { X, Trash } from '@phosphor-icons/react'
import { T, PRI } from './lib'
import { save, remove, useItems } from './db'

const SUB = { content: 'Platform', client: 'Contact', project: 'Client', plan: 'Goal', note: 'Tag' }

export default function Editor({ item, close }) {
  const items = useItems(), [f, setF] = useState(item), t = T[f.type]
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const exists = items.some(i => i.id === f.id)
  return (
    <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={e => e.target === e.currentTarget && close()}>
      <motion.form className="sheet" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        onSubmit={async e => { e.preventDefault(); await save({ ...f, title: f.title.trim() }); close() }}>
        <header><h3>{exists ? 'Edit' : 'New'} {t.n.toLowerCase()}</h3><span className="grow" /><button type="button" className="ico" onClick={close} aria-label="Close"><X /></button></header>
        <input autoFocus required placeholder="Title" value={f.title} onChange={set('title')} />
        {f.type === 'task'
          ? <select value={f.project} onChange={set('project')}><option value="">No project</option>{items.filter(i => i.type === 'project').map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
          : <input placeholder={SUB[f.type]} value={f.sub} onChange={set('sub')} />}
        <div className="two">
          <input type="date" value={f.date} onChange={set('date')} />
          <select value={f.status} onChange={set('status')}>{t.st.map(s => <option key={s}>{s}</option>)}</select>
        </div>
        {f.type === 'task' && <select value={f.priority} onChange={set('priority')}>{PRI.map(p => <option key={p}>{p}</option>)}</select>}
        <textarea rows={3} placeholder="Notes" value={f.notes} onChange={set('notes')} />
        <footer>
          <button className="btn primary">Save</button>
          <button type="button" className="btn" onClick={close}>Cancel</button>
          <span className="grow" />
          {exists && <button type="button" className="btn danger" onClick={async () => { if (confirm('Delete this item?')) { await remove(f.id); close() } }}><Trash /> Delete</button>}
        </footer>
      </motion.form>
    </motion.div>
  )
}
