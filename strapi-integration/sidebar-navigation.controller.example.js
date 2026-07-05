'use strict'

/**
 * Copy this controller into your Strapi CMS project, e.g.:
 * src/api/sidebar-navigation/controllers/sidebar-navigation.js
 *
 * The custom /api/sidebar-navigation route must populate and return the `icons`
 * media field, otherwise the frontend cannot render CMS-uploaded sidebar icons.
 */
module.exports = {
  async find(ctx) {
    const entries = await strapi.documents('api::sidebar-item.sidebar-item').findMany({
      populate: {
        parent: {
          fields: ['key', 'label']
        },
        icons: true
      },
      status: 'published'
    })

    const data = entries.map((entry) => ({
      id: entry.id,
      documentId: entry.documentId,
      key: entry.key,
      label: entry.label,
      icon: entry.icon || '',
      icons: entry.icons || null,
      to: entry.to,
      order: entry.order,
      compact: entry.compact,
      defaultExpanded: entry.defaultExpanded,
      badge: entry.badge || '',
      isVisible: entry.isVisible,
      parent: entry.parent
        ? {
            id: entry.parent.id,
            documentId: entry.parent.documentId,
            key: entry.parent.key,
            label: entry.parent.label
          }
        : null
    }))

    ctx.body = {
      code: 0,
      message: 'ok',
      data,
      meta: ''
    }
  }
}
