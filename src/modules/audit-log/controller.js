import { getAuditEvent, getAuditEvents } from './model'

export function createAuditLogController() {
  return {
    fetchEvents: getAuditEvents,
    fetchEvent: getAuditEvent
  }
}
