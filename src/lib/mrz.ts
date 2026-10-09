export type PassportMrz = {
  passportNumber: string
  personalNumber: string | null
  birthDate: string
  firstNames: string
  lastNames: string
}

const weights = [7, 3, 1]
const valueOf = (character: string) => {
  if (character === '<') return 0
  if (/\d/.test(character)) return Number(character)
  return character.charCodeAt(0) - 55
}

export function hasValidCheckDigit(value: string, checkDigit: string): boolean {
  if (!/^[0-9]$/.test(checkDigit) || !/^[A-Z0-9<]*$/.test(value)) return false
  return value.split('').reduce((sum, character, index) => sum + valueOf(character) * weights[index % 3], 0) % 10 === Number(checkDigit)
}

const displayPart = (value: string) => value.replace(/</g, ' ').replace(/\s+/g, ' ').trim()
const isoDate = (value: string) => {
  const year = Number(value.slice(0, 2))
  const currentYear = new Date().getUTCFullYear() % 100
  return `${year > currentYear ? 1900 + year : 2000 + year}-${value.slice(2, 4)}-${value.slice(4, 6)}`
}

/** Parses only ICAO TD3 passport text. Raw MRZ is never stored by this module. */
export function parsePassportMrz(rawText: string): PassportMrz | null {
  const lines = rawText.toUpperCase().replace(/[^A-Z0-9<\n]/g, '').split('\n').filter(Boolean)
  if (lines.length < 2) return null
  const [line1, line2] = lines.slice(-2)
  if (line1.length !== 44 || line2.length !== 44 || !line1.startsWith('P<')) return null
  if (!hasValidCheckDigit(line2.slice(0, 9), line2[9])) return null
  if (!hasValidCheckDigit(line2.slice(13, 19), line2[19])) return null
  if (!hasValidCheckDigit(line2.slice(21, 27), line2[27])) return null
  if (!hasValidCheckDigit(line2.slice(28, 42), line2[42])) return null
  if (!hasValidCheckDigit(line2.slice(0, 10) + line2.slice(13, 20) + line2.slice(21, 43), line2[43])) return null
  const [lastNames, firstNames = ''] = line1.slice(5).split('<<', 2)
  const personalNumber = displayPart(line2.slice(28, 42))
  return {
    passportNumber: displayPart(line2.slice(0, 9)),
    personalNumber: personalNumber || null,
    birthDate: isoDate(line2.slice(13, 19)),
    firstNames: displayPart(firstNames),
    lastNames: displayPart(lastNames)
  }
}
