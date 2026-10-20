import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { errorText, policeApi, session } from '../api'

export default function PoliceShell({ station, mustChange, onPasswordChanged, children }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const logout = () => { session.clear('police'); navigate('/police/login') }
  return (
    <div className="police-desk">
      <header className={`console-bar${menu ? ' is-open' : ''}`}>
        <div className="console-inner">
          <Link to="/police" className="console-brand">
            <img className="police-logo" src="/police-logo.png" alt="Sri Lanka Police" />
            <span>
              <small>Station desk</small>
              <strong>{station?.name || 'Police'}</strong>
            </span>
          </Link>
          <button type="button" className="nav-toggle" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
            <span /><span /><span />
          </button>
          <div className="console-actions">
            <NavLink to="/police" end className={({ isActive }) => `btn btn-quiet${isActive ? ' is-on' : ''}`} onClick={() => setMenu(false)}>SOS cases</NavLink>
            <NavLink to="/police/immigration" className={({ isActive }) => `btn btn-quiet${isActive ? ' is-on' : ''}`} onClick={() => setMenu(false)}>Immigration</NavLink>
            <button type="button" className="btn btn-quiet" onClick={() => { setMenu(false); setOpen(true) }}>Change password</button>
            <button type="button" className="btn" onClick={logout}>Log out</button>
          </div>
        </div>
      </header>
      <main className="page-wide">
        {mustChange && (
          <ChangePassword forced onDone={() => { setOpen(false); onPasswordChanged?.() }} />
        )}
        {!mustChange && open && (
          <div className="modal" role="dialog" aria-modal="true">
            <ChangePassword onDone={() => { setOpen(false); onPasswordChanged?.() }} onCancel={() => setOpen(false)} />
          </div>
        )}
        {children}
      </main>
    </div>
  )
}

function ChangePassword({ forced, onDone, onCancel }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault(); setError('')
    try { await policeApi.post('/api/auth/police/change-password', { current_password: current, new_password: next }); onDone() }
    catch (err) { setError(errorText(err)) }
  }
  return (
    <form className="card" onSubmit={submit} style={forced ? { marginBottom: 16 } : undefined}>
      <h2>{forced ? 'Set your password' : 'Change password'}</h2>
      {forced && <p className="muted" style={{ margin: 0 }}>Set a password to work the cases. New SOS cases stay visible below.</p>}
      <label className="label">Current password<input className="field" type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" /></label>
      <label className="label">New password (10+ characters, letters and numbers)<input className="field" type="password" required minLength={10} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" /></label>
      {error && <p className="error">{error}</p>}
      <div className="row">
        <button className="btn btn-primary">Save</button>
        {!forced && <button type="button" className="btn" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  )
}
