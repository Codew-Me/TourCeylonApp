import { useState } from 'react'
import { errorText, policeApi } from '../api'

const cache = new Map()

/** Officers read the English case text in Sinhala or Tamil. The stored message stays English. */
export default function OfficerRead({ text }) {
  const source = (text || '').trim()
  const [target, setTarget] = useState('')
  const [out, setOut] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  if (!source) return null

  const show = async (code, event) => {
    event?.preventDefault()
    event?.stopPropagation()
    if (target === code) {
      setTarget('')
      setOut('')
      setError('')
      return
    }
    const key = `${code}\n${source}`
    if (cache.has(key)) {
      setTarget(code)
      setOut(cache.get(key))
      setError('')
      return
    }
    setBusy(code)
    setError('')
    try {
      const { data } = await policeApi.post('/api/police/translate', { text: source, target: code })
      cache.set(key, data.translation)
      setOut(data.translation)
      setTarget(code)
    } catch (err) {
      setError(errorText(err, 'Translation is unavailable right now.'))
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="officer-read" onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
      <span className="muted">Read in</span>
      <button type="button" className={target === 'si' ? 'on' : ''} disabled={busy === 'si'} onClick={(e) => show('si', e)}>සිංහල</button>
      <button type="button" className={target === 'ta' ? 'on' : ''} disabled={busy === 'ta'} onClick={(e) => show('ta', e)}>தமிழ்</button>
      {busy && <span className="muted">{busy === 'si' ? 'සිංහල…' : 'தமிழ்…'}</span>}
      {out && <p className="officer-read-out" lang={target}>{out}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  )
}
