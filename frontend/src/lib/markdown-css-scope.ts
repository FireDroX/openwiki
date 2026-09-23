import { visit } from 'unist-util-visit'
import type { Element, Root } from 'hast'

function scrubDangerousCss(css: string): string {
  return css
    .replace(/@import\s+[^;]*;?/gi, '')
    .replace(/url\(\s*['"]?\s*javascript:[^)]*\)/gi, 'url()')
}

function hasBalancedBraces(css: string): boolean {
  let depth = 0
  let quote: '"' | "'" | null = null
  let index = 0

  while (index < css.length) {
    const char = css[index]

    if (quote) {
      if (char === '\\' && index + 1 < css.length) {
        index += 2
        continue
      }
      if (char === '\n' || char === '\r' || char === '\f') {
        quote = null
        index += 1
        continue
      }
      if (char === quote) {
        quote = null
      }
      index += 1
      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      index += 1
      continue
    }

    if (char === '/' && css[index + 1] === '*') {
      const end = css.indexOf('*/', index + 2)
      index = end === -1 ? css.length : end + 2
      continue
    }

    if (char === '{') {
      depth += 1
    } else if (char === '}') {
      depth -= 1
      if (depth < 0) {
        return false
      }
    }

    index += 1
  }

  return depth === 0 && quote === null
}

export function rehypeScopeStyles(scopeId: string) {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'style') {
        return
      }
      for (const child of node.children) {
        if (child.type === 'text') {
          if (!hasBalancedBraces(child.value)) {
            child.value = `@scope ([id="${scopeId}"]) {\n}\n`
            continue
          }
          const scrubbed = scrubDangerousCss(child.value)
          child.value = `@scope ([id="${scopeId}"]) {\n${scrubbed}\n}`
        }
      }
    })
  }
}
