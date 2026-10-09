import { createWorker } from 'tesseract.js'
import { parsePassportMrz, type PassportMrz } from './mrz'

export type ScanResult = PassportMrz & { fingerprint: string }

/** Keeps raw OCR text only inside the current call; it is neither logged nor persisted. */
export async function recognizePassportFrame(image: HTMLCanvasElement): Promise<PassportMrz | null> {
  const worker = await createWorker('eng')
  try {
    const { data } = await worker.recognize(image)
    return parsePassportMrz(data.text)
  } finally {
    await worker.terminate()
  }
}

export class RepeatGate {
  private lastFingerprint: string | null = null

  accept(scan: PassportMrz): ScanResult | null {
    const fingerprint = `${scan.passportNumber}:${scan.birthDate}`
    if (fingerprint === this.lastFingerprint) return null
    this.lastFingerprint = fingerprint
    return { ...scan, fingerprint }
  }

  rearmWhenDocumentRemoved(): void { this.lastFingerprint = null }
}
