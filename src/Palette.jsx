import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { T, blank } from './lib'
import { useItems } from './db'

const VIEWS = [['dashboard', 'Dashboard'], ['board', 'Board'], ['calendar', 'Calendar'], ['project', 'Projects'], ['content', 'Content'], ['client', 'Clients'], ['plan', 'Plans'], ['note', 'Notes'], ['settings', 'Settings']]

export default function Palette({ close, go, open }) {
  const items = useItems(), [q, setQ] = useState(''), [i, setI] = useState(0)
  const all = useMemo(() => [
    ...VIEWS.map(([k, l]) => ({ l: 'Go to ' + l, run: () => go(k) })),
    ...Object.keys(T).map(k => ({ l: 'New ' + T[k].n.toLowerCase(), run: () => open(blank(k)) })),
    ...items.map(x => ({ l: x.title, s: T[x.type].n, run: () => open(x) }))
  ], [items])
  const L = all.filter(c => c.l.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
  const run = c => { close(); c?.run() }
  const key = e => {
    if (e.key === 'Escape') close()
    else if (e.key === 'ArrowDown') { e.preventDefault(); setI(Math.min(i + 1, L.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setI(Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') run(L[i])
  }
  return (
    <motion.div className="scrim high" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={e => e.target === e.currentTarget && close()}>
      <motion.div className="pal" initial={{ y: -12, opacity: 0, scale: .98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 32 }}>
        <input autoFocus placeholder="Type a command or search…" value={q} onChange={e => { setQ(e.target.value); setI(0) }} onKeyDown={key} />
        {L.map((c, k) => <button key={k} className={'opt' + (k === i ? ' on' : '')} onMouseEnter={() => setI(k)} onClick={() => run(c)}>{c.l}<span className="grow" /><span className="muted">{c.s}</span></button>)}
      </motion.div>
    </motion.div>
  )
}
