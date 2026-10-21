import AuditLogView from './view.vue'
import AuditLogDetailView from './detail.vue'
import { createAuditLogController } from './controller'

const controller = createAuditLogController()

export default {
  routes: [
    { path: '/audit-log', name: 'AuditLog', component: AuditLogView, props: { controller }, meta: { requiresAuditReader: true } },
    { path: '/audit-log/:id', name: 'AuditLogDetail', component: AuditLogDetailView, props: { controller }, meta: { requiresAuditReader: true } }
  ]
}
