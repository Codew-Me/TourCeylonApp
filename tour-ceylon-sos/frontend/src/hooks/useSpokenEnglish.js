import { useEffect, useRef, useState } from 'react'
import { touristApi } from '../api'

/**
 * After the browser hears speech, write it in English.
 * The incident model is unchanged: it later reads this English like any typed message.
 */
export default function useSpokenEnglish(option, voice) {
  const [busy, setBusy] = useState(false)
  const [heard, setHeard] = useState('')
  const [english, setEnglish] = useState('')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const applied = useRef('')

  useEffect(() => {
    if (voice.recording) return undefined
    const said = (voice.transcript || '').trim()
    if (!said || said === applied.current) return undefined
    applied.current = said
    let cancel = false
    setBusy(true)
    setError('')
    ;(async () => {
      try {
        if (option.english) {
          if (!cancel) {
            setEnglish(said)
            setHeard('')
            setReady(true)
          }
          return
        }
        const { data } = await touristApi.post('/api/speech/to-english', { text: said, language: option.code })
        const englishText = (data.english || '').trim()
        if (!cancel) {
          setEnglish(englishText)
          setHeard(said)
          setReady(Boolean(englishText))
        }
      } catch {
        if (!cancel) {
          setEnglish('')
          setHeard(said)
          setReady(false)
          setError('Could not write that in English. Try again, or type the emergency in English.')
        }
      } finally {
        if (!cancel) setBusy(false)
      }
    })()
    return () => { cancel = true }
  }, [voice.recording, voice.transcript, option.id, option.english, option.code])

  const clear = () => {
    applied.current = ''
    setHeard('')
    setEnglish('')
    setReady(false)
    setError('')
  }

  return { busy, heard, english, ready, error, clear }
}
