import { visit, SKIP } from 'unist-util-visit'
import type { Element, Root } from 'hast'

const DENIED_TAG_NAMES = new Set(['script', 'iframe', 'object', 'embed', 'form', 'base', 'link', 'meta'])

const URL_PROPERTY_NAMES = new Set(['href', 'src', 'action', 'formAction', 'cite', 'xLinkHref'])

const DANGEROUS_PROTOCOLS = ['javascript:', 'vbscript:', 'data:text/html']

function isEventHandlerProperty(name: string): boolean {
  return /^on/i.test(name)
}

function hasDangerousProtocol(value: string): boolean {
  // eslint-disable-next-line no-control-regex
  const normalized = value.replace(/[\u0000- ]/g, '').toLowerCase()
  return DANGEROUS_PROTOCOLS.some((protocol) => normalized.startsWith(protocol))
}

export function rehypeHardenFullMode() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (DENIED_TAG_NAMES.has(node.tagName) && parent && typeof index === 'number') {
        parent.children.splice(index, 1)
        return [SKIP, index] as const
      }

      const properties = node.properties ?? {}
      for (const propertyName of Object.keys(properties)) {
        if (isEventHandlerProperty(propertyName)) {
          delete properties[propertyName]
          continue
        }
        if (URL_PROPERTY_NAMES.has(propertyName)) {
          const value = properties[propertyName]
          if (typeof value === 'string' && hasDangerousProtocol(value)) {
            delete properties[propertyName]
          }
        }
      }
    })
  }
}
