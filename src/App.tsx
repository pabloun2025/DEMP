import { useEffect, useRef, useState } from 'react'
import { parsePassportMrz, type PassportMrz } from './lib/mrz'
import { recognizePassportFrame, RepeatGate } from './lib/mrzScanner'
import { createMockSyncServer, db, enqueueDemoAction, syncOutbox, type DemoAction } from './lib/offline'

const syntheticMrz = 'P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<\nL898902C36UTO7408122F1204159ZE184226B<<<<<10'

function ResultCard({ result }: { result: PassportMrz }) {
  return <output className="result" aria-live="polite"><strong>Lectura válida</strong><span>{result.firstNames} {result.lastNames}</span><span>Pasaporte: {result.passportNumber}</span><span>Número personal: {result.personalNumber ?? 'no presente'}</span><span>Nacimiento: {result.birthDate}</span></output>
}

export default function App() {
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const active = useRef(false)
  const gate = useRef(new RepeatGate())
  const server = useRef(createMockSyncServer())
  const [scan, setScan] = useState<PassportMrz | null>(null)
  const [message, setMessage] = useState('Cámara detenida')
  const [manualMrz, setManualMrz] = useState('')
  const [actions, setActions] = useState<DemoAction[]>([])
  const [online, setOnline] = useState(navigator.onLine)

  const refreshActions = async () => setActions(await db.outbox.orderBy('createdAt').toArray())
  const synchronize = async () => {
    if (!navigator.onLine) return
    setMessage('Sincronizando cola local…')
    await syncOutbox(server.current.send)
    await refreshActions()
    setMessage('Cola sincronizada')
  }

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void refreshActions(), 0)
    const onOnline = () => { setOnline(true); void synchronize() }
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { window.clearTimeout(initialLoad); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); void stopCamera() }
    // Event subscriptions intentionally use the initial handlers; they read current browser/DB state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const receive = (candidate: PassportMrz | null) => {
    if (!candidate) { gate.current.rearmWhenDocumentRemoved(); return }
    const accepted = gate.current.accept(candidate)
    if (!accepted) return
    setScan(candidate)
    setMessage('Lectura válida. Lista para el siguiente pasaporte.')
    navigator.vibrate?.(80)
  }

  const scanFrame = async () => {
    if (!active.current || !video.current) return
    const element = video.current
    if (element.videoWidth > 0) {
      const canvas = document.createElement('canvas')
      canvas.width = element.videoWidth
      canvas.height = Math.floor(element.videoHeight * 0.36)
      const context = canvas.getContext('2d')
      context?.drawImage(element, 0, Math.floor(element.videoHeight * 0.64), element.videoWidth, canvas.height, 0, 0, canvas.width, canvas.height)
      try { receive(await recognizePassportFrame(canvas)) } catch { setMessage('No se pudo procesar este cuadro; la cámara continúa activa.') }
    }
    if (active.current) window.setTimeout(() => void scanFrame(), 1800)
  }

  async function startCamera() {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      if (video.current) { video.current.srcObject = stream.current; await video.current.play() }
      active.current = true
      setMessage('Cámara trasera preferida; lectura continua activa.')
      void scanFrame()
    } catch { setMessage('No fue posible abrir la cámara. Compruebe permiso, HTTPS o use la prueba sintética.') }
  }
  function stopCamera() {
    active.current = false
    stream.current?.getTracks().forEach((track) => track.stop())
    stream.current = null
    setMessage('Cámara detenida')
  }
  const testMrz = (value: string) => { receive(parsePassportMrz(value)); setManualMrz('') }
  const addOfflineAction = async () => { await enqueueDemoAction(`Demostración ${new Date().toLocaleTimeString()}`); await refreshActions(); setMessage('Operación guardada en IndexedDB; se sincronizará al recuperar conexión.') }

  return <main>
    <header><p className="eyebrow">DEMP · Fase 0</p><h1>Validación MRZ y offline</h1><p className={online ? 'online' : 'offline'}>{online ? 'Con conexión' : 'Sin conexión — trabajo local activo'}</p></header>
    <section><h2>Lectura continua de pasaportes</h2><p>La imagen y el texto MRZ se procesan solo en memoria. Se conservan únicamente los campos extraídos mostrados abajo.</p><video ref={video} muted playsInline aria-label="Vista previa de cámara" />
      <div className="actions"><button onClick={() => void startCamera()}>Abrir cámara</button><button className="secondary" onClick={stopCamera}>Detener</button><button className="secondary" onClick={() => testMrz(syntheticMrz)}>Probar MRZ sintética</button></div>
      <label>Entrada de prueba MRZ (no se guarda)<textarea value={manualMrz} onChange={(event) => setManualMrz(event.target.value)} rows={3} /></label><button className="secondary" onClick={() => testMrz(manualMrz)}>Validar entrada</button>
      {scan && <ResultCard result={scan} />}
    </section>
    <section><h2>Cola offline</h2><p>Las operaciones tienen UUID idempotente y versión conocida. El servidor simulado rechaza conflictos sin sobrescribir.</p><div className="actions"><button onClick={() => void addOfflineAction()}>Registrar operación demo</button><button className="secondary" onClick={() => void synchronize()} disabled={!online}>Sincronizar ahora</button></div>
      <p>{actions.length === 0 ? 'No hay operaciones pendientes.' : `${actions.length} operación(es): ${actions.map((action) => action.status).join(', ')}`}</p></section>
    <p className="status" aria-live="polite">{message}</p>
  </main>
}
