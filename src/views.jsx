import { useState } from 'react'
import { motion } from 'motion/react'
import { DndContext, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core'
import { Plus, CaretLeft, CaretRight, DownloadSimple, UploadSimple, CloudArrowUp } from '@phosphor-icons/react'
import { T, VERSION, tone, isDone, progress, blank, useCtx } from './lib'
import { useItems, save, putRaw, refresh } from './db'
import { sync } from './sync'

/* ---------- Dashboard ---------- */
export function Dashboard() {
  const items = useItems(), { open } = useCtx()
  const ps = items.filter(i => i.type === 'project')
  const done = items.filter(isDone).length, pct = items.length ? Math.round(done / items.length * 100) : 0
  const soon = items.filter(i => i.type === 'task' && !isDone(i) && i.date).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6)
  return (
    <>
      <section className="shelf">
        {ps.length ? ps.map((p, k) => (
          <motion.button key={p.id} className="spine" style={{ '--c': tone(p.id), height: 250 + (k * 37) % 90 }}
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * .05, type: 'spring', stiffness: 240, damping: 22 }}
            whileHover={{ y: -12, rotate: -1.5 }} onClick={() => open(p)}>
            <b>{p.title}</b><em>{p.sub}</em><span className="gl">{progress(p, items)}%</span>
          </motion.button>
        )) : <p className="muted pad">No projects yet. Add one to start your shelf.</p>}
      </section>
      <div className="row">
        <div className="panel center"><span className="muted">Completion</span><div className="ring" style={{ '--p': pct }}><span>{pct}%</span></div><span className="muted">{done} of {items.length} finished</span></div>
        <div className="panel">
          <h3>Due soon</h3>
          {soon.length ? soon.map(t => <button key={t.id} className="line" onClick={() => open(t)}><i className={'dot ' + t.priority} />{t.title}<span className="grow" /><span className="muted">{t.date}</span></button>)
            : <p className="muted">Nothing scheduled. Give tasks a due date and they show up here.</p>}
        </div>
      </div>
    </>
  )
}

/* ---------- Board (kanban) ---------- */
function TaskCard({ t, open }) {
  const items = useItems(), p = items.find(i => i.id === t.project)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: t.id })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={'task' + (isDragging ? ' drag' : '')}
      style={transform ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` } : undefined} onClick={() => open(t)}>
      <div className="tt">{t.title}</div>
      <div className="meta"><i className={'dot ' + t.priority} />{t.priority}{p && <span className="tag" style={{ '--c': tone(p.id) }}>{p.title}</span>}{t.date && <span className="muted">{t.date}</span>}</div>
    </div>
  )
}
function Col({ st, tasks, add, open }) {
  const { setNodeRef, isOver } = useDroppable({ id: st })
  return (
    <div ref={setNodeRef} className={'col' + (isOver ? ' over' : '')}>
      <header><h4>{st}</h4><span className="muted">{tasks.length}</span><span className="grow" /><button className="ico" onClick={add} aria-label={'Add task to ' + st}><Plus /></button></header>
      {tasks.map(t => <TaskCard key={t.id} t={t} open={open} />)}
    </div>
  )
}
export function Board() {
  const items = useItems(), { open } = useCtx(), [pf, setPf] = useState('')
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const tasks = items.filter(i => i.type === 'task' && (!pf || i.project === pf))
  const end = e => { const t = items.find(i => i.id === e.active.id); if (t && e.over && t.status !== e.over.id) save({ ...t, status: e.over.id }) }
  return (
    <>
      <div className="bar">
        <select value={pf} onChange={e => setPf(e.target.value)}><option value="">All projects</option>{items.filter(i => i.type === 'project').map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
        <span className="grow" /><button className="btn primary" onClick={() => open(blank('task', { project: pf }))}><Plus /> New task</button>
      </div>
      <DndContext sensors={sensors} onDragEnd={end}>
        <div className="board">{T.task.st.map(s => <Col key={s} st={s} tasks={tasks.filter(t => t.status === s)} open={open} add={() => open(blank('task', { status: s, project: pf }))} />)}</div>
      </DndContext>
    </>
  )
}

/* ---------- Collections (projects, content, clients, plans, notes) ---------- */
export function Collection({ type }) {
  const items = useItems(), { open } = useCtx(), t = T[type]
  const L = items.filter(i => i.type === type).sort((a, b) => b.updated - a.updated)
  const cycle = i => save({ ...i, status: t.st[(t.st.indexOf(i.status) + 1) % t.st.length] })
  return (
    <>
      <div className="bar"><span className="muted">{L.length} total</span><span className="grow" /><button className="btn primary" onClick={() => open(blank(type))}><Plus /> New {t.n.toLowerCase()}</button></div>
      <div className="grid">
        {L.map((i, k) => (
          <motion.article key={i.id} className="card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(k, 8) * .03 }}>
            {i.date && <div className="muted">{i.date}</div>}
            <h3>{i.title}</h3>
            {i.sub && <div className="muted">{i.sub}</div>}
            {type === 'project' && <div className="meter"><i style={{ width: progress(i, items) + '%' }} /></div>}
            <div className="foot"><button className="chip" onClick={() => cycle(i)} title="Click to change status">{i.status}</button><span className="grow" /><button className="btn" onClick={() => open(i)}>Edit</button></div>
          </motion.article>
        ))}
        {!L.length && <p className="muted">Nothing here yet.</p>}
      </div>
    </>
  )
}

/* ---------- Calendar ---------- */
export function Calendar() {
  const items = useItems(), { open } = useCtx(), [m, setM] = useState(0)
  const b = new Date(); b.setDate(1); b.setMonth(b.getMonth() + m)
  const Y = b.getFullYear(), M = b.getMonth(), n = new Date(Y, M + 1, 0).getDate(), s = (b.getDay() + 6) % 7
  const key = d => `${Y}-${String(M + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const cells = [...Array(s).fill(0), ...Array.from({ length: n }, (_, k) => k + 1)]
  return (
    <>
      <div className="bar">
        <button className="btn" onClick={() => setM(m - 1)} aria-label="Previous month"><CaretLeft /></button>
        <h3 className="mo">{b.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</h3>
        <button className="btn" onClick={() => setM(m + 1)} aria-label="Next month"><CaretRight /></button>
        <span className="muted">Click a day to schedule content</span>
      </div>
      <div className="cal">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} className="muted">{d}</div>)}
        {cells.map((d, k) => {
          if (!d) return <div key={'e' + k} />
          const L = items.filter(i => i.date === key(d))
          return (
            <div key={d} className="day" onClick={() => open(blank('content', { date: key(d) }))}>
              <b>{d}</b>
              {L.slice(0, 3).map(i => <span key={i.id} className={'ev ' + i.type + (isDone(i) ? ' dn' : '')} onClick={e => { e.stopPropagation(); open(i) }}>{i.title}</span>)}
              {L.length > 3 && <span className="muted">+{L.length - 3} more</span>}
            </div>
          )
        })}
      </div>
    </>
  )
}

/* ---------- Settings ---------- */
export function Settings() {
  const items = useItems()
  const [msg, setMsg] = useState(localStorage.last ? 'Last sync ' + new Date(+localStorage.last).toLocaleString() : 'Not synced yet')
  const [busy, setBusy] = useState(false)
  const ls = k => ({ defaultValue: localStorage[k] || '', onChange: e => { localStorage[k] = e.target.value } })
  const exp = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ app: 'khay-os', version: VERSION, items }, null, 1)], { type: 'application/json' }))
    a.download = `khay-os-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click()
  }
  const imp = async e => {
    try {
      const d = JSON.parse(await e.target.files[0].text())
      if (!Array.isArray(d.items)) throw 0
      for (const i of d.items) if (i.id && T[i.type]) await putRaw(i)
      refresh()
    } catch { alert('That file is not a Khay OS backup.') }
  }
  const go = async () => { setBusy(true); try { setMsg(await sync()) } catch { setMsg('Sync failed. It retries when you are online.') } setBusy(false) }
  return (
    <div className="grid">
      <div className="panel"><h3>App</h3><p className="muted">Version {VERSION}</p><input placeholder="Your name (for the greeting)" {...ls('name')} /></div>
      <div className="panel"><h3>Your data</h3><p className="muted">Stored on this device. Works offline.</p>
        <div className="foot"><button className="btn" onClick={exp}><DownloadSimple /> Export</button><label className="btn"><UploadSimple /> Import<input type="file" accept=".json" hidden onChange={imp} /></label></div></div>
      <div className="panel"><h3>Cloud sync</h3><p className="muted">Private GitHub Gist. Use a token with only the gist permission. It stays on this device.</p>
        <input type="password" placeholder="GitHub token" {...ls('tk')} /><input key={msg} placeholder="Gist ID (fills in after first sync)" {...ls('gid')} />
        <p className="muted">{msg}</p><button className="btn primary" disabled={busy} onClick={go}><CloudArrowUp /> Sync now</button></div>
    </div>
  )
}
