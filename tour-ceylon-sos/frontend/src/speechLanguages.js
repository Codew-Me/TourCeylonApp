/** Languages a visitor can speak. Speech is written in English before the incident model sees it. */
export const SPEAK_OPTIONS = [
  { id: 'hi-IN', code: 'hi', recognition: 'hi-IN', label: 'India — Hindi', english: false },
  { id: 'ta-IN', code: 'ta', recognition: 'ta-IN', label: 'India — Tamil', english: false },
  { id: 'en-GB', code: 'en', recognition: 'en-GB', label: 'England — English', english: true },
  { id: 'zh-CN', code: 'zh', recognition: 'zh-CN', label: 'China — Mandarin', english: false },
  { id: 'ru-RU', code: 'ru', recognition: 'ru-RU', label: 'Russia — Russian', english: false },
  { id: 'de-DE', code: 'de', recognition: 'de-DE', label: 'Germany — German', english: false },
  { id: 'en-AU', code: 'en', recognition: 'en-AU', label: 'Australia — English', english: true },
  { id: 'fr-FR', code: 'fr', recognition: 'fr-FR', label: 'France — French', english: false },
  { id: 'dv-MV', code: 'dv', recognition: 'dv-MV', label: 'Maldives — Dhivehi', english: false },
  { id: 'en-US', code: 'en', recognition: 'en-US', label: 'America — English', english: true },
  { id: 'nl-NL', code: 'nl', recognition: 'nl-NL', label: 'Netherlands — Dutch', english: false },
]

export function speakOption(id) {
  return SPEAK_OPTIONS.find((item) => item.id === id) || SPEAK_OPTIONS[2]
}
