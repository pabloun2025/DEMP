import Dexie, { type EntityTable } from 'dexie'

export type DemoAction = {
  actionId: string
  type: 'CREATE_DEMO_CASE'
  entityId: string
  knownVersion: number
  payload: { label: string }
  status: 'pending' | 'syncing' | 'conflict'
  createdAt: number
}
export type SyncResponse = 'APPLIED' | 'ALREADY_APPLIED' | 'CONFLICT' | 'REJECTED'
export type ActionSender = (action: DemoAction) => Promise<SyncResponse>

class DempDatabase extends Dexie {
  outbox!: EntityTable<DemoAction, 'actionId'>
  constructor() {
    super('demp-phase-0')
    this.version(1).stores({ outbox: '&actionId, status, createdAt' })
  }
}
export const db = new DempDatabase()

export async function enqueueDemoAction(label: string): Promise<DemoAction> {
  const action: DemoAction = {
    actionId: crypto.randomUUID(), type: 'CREATE_DEMO_CASE', entityId: crypto.randomUUID(), knownVersion: 1,
    payload: { label }, status: 'pending', createdAt: Date.now()
  }
  await db.outbox.add(action)
  return action
}

export async function syncOutbox(sender: ActionSender): Promise<void> {
  const actions = await db.outbox.orderBy('createdAt').toArray()
  for (const action of actions) {
    if (action.status === 'conflict') continue
    await db.outbox.update(action.actionId, { status: 'syncing' })
    const response = await sender(action)
    if (response === 'APPLIED' || response === 'ALREADY_APPLIED') await db.outbox.delete(action.actionId)
    else await db.outbox.update(action.actionId, { status: response === 'CONFLICT' ? 'conflict' : 'pending' })
  }
}

/** Local stand-in for the future idempotent Supabase RPC; no data leaves this browser. */
export function createMockSyncServer() {
  const processed = new Set<string>()
  const versions = new Map<string, number>()
  return {
    async send(action: DemoAction): Promise<SyncResponse> {
      if (processed.has(action.actionId)) return 'ALREADY_APPLIED'
      const remoteVersion = versions.get(action.entityId) ?? action.knownVersion
      if (remoteVersion !== action.knownVersion) return 'CONFLICT'
      processed.add(action.actionId)
      versions.set(action.entityId, remoteVersion + 1)
      return 'APPLIED'
    },
    changeRemotely(entityId: string, version: number) { versions.set(entityId, version) }
  }
}
