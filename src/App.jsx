import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { SquaresFour, Kanban, CalendarBlank, FolderSimple, Megaphone, UsersThree, Target, NotePencil, GearSix, MagnifyingGlass, WifiSlash } from '@phosphor-icons/react'
import { Ctx } from './lib'
import Editor from './Editor'
import Palette from './Palette'
import { Dashboard, Board, Collection, Calendar, Settings } from './views'

const NAV = [['dashboard', 'Dashboard', SquaresFour], ['board', 'Board', Kanban], ['calendar', 'Calendar', CalendarBlank], ['project', 'Projects', FolderSimple], ['content', 'Content', Megaphone], ['client', 'Clients', UsersThree], ['plan', 'Plans', Target], ['note', 'Notes', NotePencil], ['settings', 'Settings', GearSix]]

const Logo = () => (
  <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
    <rect x="2" y="2" width="28" height="28" rx="9" fill="var(--accent)" />
    <path d="M11 8v16M11 16l9-8M13.5 14l7.5 10" stroke="#10131a" strokeWidth="2.6" strokeLinecap="round" fill="none" />
  </svg>
)
const Page = ({ view }) => view === 'dashboard' ? <Dashboard /> : view === 'board' ? <Board /> : view === 'calendar' ? <Calendar /> : view === 'settings' ? <Settings /> : <Collection type={view} />

export default function App() {
  const [view, setView] = useState(() => location.hash.slice(1) || 'dashboard')
  const [edit, setEdit] = useState(null), [pal, setPal] = useState(false), [on, setOn] = useState(navigator.onLine)
  const { needRefresh: [need], updateServiceWorker } = useRegisterSW({ onRegisteredSW: (_, r) => r && setInterval(() => r.update(), 36e5) })
  const go = v => { setView(v); location.hash = v }

  useEffect(() => {
    navigator.storage?.persist?.()
    const k = e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPal(p => !p) } }
    const a = () => setOn(true), b = () => setOn(false)
    addEventListener('keydown', k); addEventListener('online', a); addEventListener('offline', b)
    return () => { removeEventListener('keydown', k); removeEventListener('online', a); removeEventListener('offline', b) }
  }, [])
  useEffect(() => { if (on && localStorage.tk) import('./sync').then(m => m.sync().catch(() => {})) }, [on])

  const h = new Date().getHours(), name = localStorage.name, cur = NAV.find(x => x[0] === view) || NAV[0]
  return (
    <Ctx.Provider value={{ open: setEdit, go }}>
      <div className="app">
        <nav className="side">
          <div className="brand"><Logo /><span>Khay OS</span></div>
          {NAV.map(([k, l, I]) => <button key={k} className={'nav' + (view === k ? ' on' : '')} onClick={() => go(k)}><I weight="duotone" size={21} /><span>{l}</span></button>)}
        </nav>
        <main>
          <header className="head">
            <h1>{view === 'dashboard' ? `Good ${h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'}${name ? ', ' + name : ''}` : cur[1]}</h1>
            <span className="grow" />
            <button className="search" onClick={() => setPal(true)}><MagnifyingGlass /> Search or jump to… <kbd>Ctrl K</kbd></button>
            <span className="pill">{on ? 'Online' : <><WifiSlash /> Offline</>}</span>
          </header>
          <AnimatePresence mode="wait">
            <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .18 }}><Page view={view} /></motion.div>
          </AnimatePresence>
        </main>
        <AnimatePresence>
          {edit && <Editor key={edit.id} item={edit} close={() => setEdit(null)} />}
          {pal && <Palette key="palette" close={() => setPal(false)} go={go} open={setEdit} />}
        </AnimatePresence>
        {need && <div className="toast">A new version is ready <button className="btn primary" onClick={() => updateServiceWorker(true)}>Update now</button></div>}
      </div>
    </Ctx.Provider>
  )
}
