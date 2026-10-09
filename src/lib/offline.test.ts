import { beforeEach, describe, expect, it } from 'vitest'
import { createMockSyncServer, db, enqueueDemoAction, syncOutbox } from './offline'

describe('outbox offline', () => {
  beforeEach(async () => { await db.outbox.clear() })
  it('syncs an action once and removes it after acknowledgement', async () => {
    await enqueueDemoAction('synthetic case')
    const server = createMockSyncServer(); await syncOutbox(server.send)
    expect(await db.outbox.count()).toBe(0)
  })
  it('keeps a version conflict visible instead of overwriting it', async () => {
    const action = await enqueueDemoAction('conflicting case')
    const server = createMockSyncServer(); server.changeRemotely(action.entityId, 2)
    await syncOutbox(server.send)
    expect((await db.outbox.get(action.actionId))?.status).toBe('conflict')
  })
})
