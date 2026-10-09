import { describe, expect, it } from 'vitest'
import { hasValidCheckDigit, parsePassportMrz } from './mrz'
import { RepeatGate } from './mrzScanner'

const fixture = 'P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<\nL898902C36UTO7408122F1204159ZE184226B<<<<<10'
describe('MRZ TD3', () => {
  it('validates ICAO check digits and extracts only functional fields', () => {
    expect(hasValidCheckDigit('L898902C3', '6')).toBe(true)
    expect(parsePassportMrz(fixture)).toMatchObject({ passportNumber: 'L898902C3', birthDate: '1974-08-12', firstNames: 'ANNA MARIA', lastNames: 'ERIKSSON', personalNumber: 'ZE184226B' })
  })
  it('rejects a damaged check digit', () => expect(parsePassportMrz(fixture.replace('L898902C36', 'L898902C37'))).toBeNull())
  it('does not accept the same passport again until it is rearmed', () => {
    const parsed = parsePassportMrz(fixture)!
    const gate = new RepeatGate()
    expect(gate.accept(parsed)).not.toBeNull(); expect(gate.accept(parsed)).toBeNull()
    gate.rearmWhenDocumentRemoved(); expect(gate.accept(parsed)).not.toBeNull()
  })
})
