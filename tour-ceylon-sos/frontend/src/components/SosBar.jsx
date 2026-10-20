import { useEffect, useState } from 'react'
import { Mic, Siren, Square, X } from 'lucide-react'
import useSpokenEnglish from '../hooks/useSpokenEnglish'
import useVoiceRecorder from '../hooks/useVoiceRecorder'
import { SPEAK_OPTIONS, speakOption } from '../speechLanguages'

/**
 * Type or speak what is happening, then press SOS.
 * Speech is written in English first. That English is classified like any typed English message.
 */
export default function SosBar({ sending, hasOpenCase, onSend }) {
  const [text, setText] = useState('')
  const [speakId, setSpeakId] = useState('en-GB')
  const speak = speakOption(speakId)
  const voice = useVoiceRecorder(speak.recognition)
  const spoken = useSpokenEnglish(speak, voice)

  useEffect(() => {
    if (spoken.english) setText(spoken.english)
  }, [spoken.english])

  const press = async () => {
    if (sending || voice.recording || spoken.busy) return
    const message = text.trim()
    const ok = await onSend({
      message,
      voice: voice.blob,
      transcript: spoken.heard || voice.transcript || message,
      speechOriginal: spoken.heard,
      speechLanguage: speak.code,
      englishReady: Boolean(message) && spoken.ready,
      extension: voice.extension,
    })
    if (ok) {
      setText('')
      voice.reset()
      spoken.clear()
    }
  }

  return (
    <section className="sos-panel" aria-label="Emergency SOS">
      <label className="speak-lang">
        <span>Speak in</span>
        <select className="field" value={speakId} disabled={voice.recording || sending}
          onChange={(e) => setSpeakId(e.target.value)} aria-label="Language you will speak">
          {SPEAK_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <div className="sos-row">
        <div className={`sos-field${voice.recording ? ' recording' : ''}`}>
          <input
            value={voice.recording ? '' : text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); press() } }}
            placeholder={voice.recording ? `Listening… ${voice.seconds}s` : spoken.busy ? 'Writing that in English…' : hasOpenCase ? 'Add what is happening' : 'What is happening?'}
            aria-label="Describe your emergency"
            disabled={voice.recording || sending || spoken.busy}
          />
          <button type="button" className={`mic${voice.recording ? ' on' : ''}`} disabled={sending || spoken.busy}
            onClick={voice.recording ? voice.stop : voice.start}
            aria-label={voice.recording ? 'Stop recording' : 'Record a voice message'}>
            {voice.recording ? <Square size={16} fill="currentColor" /> : <Mic size={19} />}
          </button>
        </div>
        <button type="button" className="sos-btn" onClick={press} disabled={sending || voice.recording || spoken.busy} aria-label="Send SOS">
          <Siren size={18} /> {sending ? 'Sending' : 'Send SOS'}
        </button>
      </div>

      {voice.recording && voice.transcript && <p className="sos-note">Heard: “{voice.transcript}”</p>}
      {spoken.busy && <p className="sos-note">Writing that in English…</p>}
      {spoken.heard && spoken.english && !voice.recording && (
        <p className="sos-note">Heard in {speak.label}. English for the incident check: “{spoken.english}”</p>
      )}
      {voice.blob && !voice.recording && (
        <div className="voice-ready">
          <Mic size={16} />
          <span className="grow"><b>Voice note ready.</b>{' '}
            <span className="muted">{text ? 'The English above is what sets the incident type.' : 'It will be added to your message after you send.'}</span>
          </span>
          <button type="button" className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => { voice.reset(); spoken.clear() }} aria-label="Delete voice message"><X size={15} /></button>
        </div>
      )}
      {(voice.error || spoken.error) && <p className="error" role="alert">{spoken.error || voice.error}</p>}
      <p className="sos-note">
        {hasOpenCase
          ? 'This case is open. A new English message updates the incident type, the numbers, and the station.'
          : 'Speak in the language above. It is written in English, and that English sets the incident type, the tips, and the nearest station.'}
      </p>
    </section>
  )
}
