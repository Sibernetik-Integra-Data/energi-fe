import { defineComponent, h } from 'vue'
import { RouterLink } from 'vue-router'
import { safeLinkUrl, safeMediaUrl } from '../api'

// Renders Strapi "blocks" rich text as Vue nodes (never v-html): only known
// node types are drawn, text is always escaped, links and images are checked.
const MAX_DEPTH = 8

function renderInline(node, key, depth) {
  if (!node || depth > MAX_DEPTH) return null
  if (node.type === 'text') {
    let vnode = node.text || ''
    if (node.code) vnode = h('code', { class: 'help-rt__code-inline' }, vnode)
    if (node.bold) vnode = h('strong', vnode)
    if (node.italic) vnode = h('em', vnode)
    if (node.underline) vnode = h('u', vnode)
    if (node.strikethrough) vnode = h('s', vnode)
    return typeof vnode === 'string' ? h('span', { key }, vnode) : h('span', { key }, [vnode])
  }
  if (node.type === 'link') {
    const children = renderChildren(node.children, depth + 1, renderInline)
    const url = safeLinkUrl(node.url)
    if (!url) return h('span', { key }, children)
    if (url.startsWith('/')) return h(RouterLink, { key, to: url, class: 'help-rt__link' }, () => children)
    return h('a', { key, href: url, target: '_blank', rel: 'noopener noreferrer', class: 'help-rt__link' }, children)
  }
  if (node.type === 'text-group') return h('span', { key }, renderChildren(node.children, depth + 1, renderInline))
  return null
}

function renderListChild(node, key, depth) {
  if (node?.type === 'list') return renderBlock(node, key, depth)
  if (node?.type === 'list-item') return h('li', { key }, renderChildren(node.children, depth + 1, renderInline))
  return null
}

function renderBlock(node, key, depth) {
  if (!node || depth > MAX_DEPTH) return null
  switch (node.type) {
    case 'paragraph':
      return h('p', { key }, renderChildren(node.children, depth + 1, renderInline))
    case 'heading': {
      // Page title is the h1; content headings start at h2.
      const level = Math.min(Math.max(Number(node.level) || 2, 2), 6)
      return h(`h${level}`, { key }, renderChildren(node.children, depth + 1, renderInline))
    }
    case 'quote':
      return h('blockquote', { key }, renderChildren(node.children, depth + 1, renderInline))
    case 'code':
      return h('pre', { key }, h('code', (node.children || []).map((child) => child?.text || '').join('')))
    case 'list':
      return h(node.format === 'ordered' ? 'ol' : 'ul', { key }, renderChildren(node.children, depth + 1, renderListChild))
    case 'image': {
      const url = safeMediaUrl(node.image?.url)
      if (!url) return null
      return h('img', { key, src: url, alt: node.image?.alternativeText || '', loading: 'lazy', class: 'help-rt__image' })
    }
    default:
      return null
  }
}

function renderChildren(children, depth, renderer) {
  return Array.isArray(children) ? children.map((child, index) => renderer(child, index, depth)).filter(Boolean) : []
}

export default defineComponent({
  name: 'HelpRichText',
  props: { content: { type: Array, default: () => [] } },
  setup(props) {
    return () => h('div', { class: 'help-rt' }, renderChildren(props.content, 0, renderBlock))
  }
})
