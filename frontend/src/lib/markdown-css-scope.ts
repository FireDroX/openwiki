import { visit } from 'unist-util-visit'
import type { Element, Root } from 'hast'

function scrubDangerousCss(css: string): string {
  return css
    .replace(/@import\s+[^;]*;?/gi, '')
    .replace(/url\(\s*['"]?\s*javascript:[^)]*\)/gi, 'url()')
}

export function rehypeScopeStyles(scopeId: string) {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'style') {
        return
      }
      for (const child of node.children) {
        if (child.type === 'text') {
          const scrubbed = scrubDangerousCss(child.value)
          child.value = `@scope ([id="${scopeId}"]) {\n${scrubbed}\n}`
        }
      }
    })
  }
}
