import { visit } from 'unist-util-visit'
import type { Element, Root } from 'hast'

function scrubDangerousCss(css: string): string {
  return css
    .replace(/@import\s+[^;]*;?/gi, '')
    .replace(/url\(\s*['"]?\s*javascript:[^)]*\)/gi, 'url()')
}

function hasBalancedBraces(css: string): boolean {
  let depth = 0
  let i = 0
  const length = css.length

  while (i < length) {
    const char = css[i]

    if (char === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2)
      i = end === -1 ? length : end + 2
      continue
    }

    if (char === '"' || char === "'") {
      const quote = char
      i += 1
      while (i < length && css[i] !== quote) {
        if (css[i] === '\\') {
          i += 1
        }
        i += 1
      }
      i += 1
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

    i += 1
  }

  return depth === 0
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
