import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { MarkdownRenderer } from './MarkdownRenderer'

describe('MarkdownRenderer', () => {
  describe('restricted mode (default)', () => {
    it('strips an unknown custom tag', () => {
      const { container } = render(<MarkdownRenderer content="<mon-widget>hi</mon-widget>" />)
      expect(container.querySelector('mon-widget')).toBeNull()
      expect(container).toHaveTextContent('hi')
    })
  })

  describe('full mode', () => {
    it('keeps an unknown custom tag', () => {
      const { container } = render(
        <MarkdownRenderer content="<mon-widget>hi</mon-widget>" mode="full" />,
      )
      expect(container.querySelector('mon-widget')).not.toBeNull()
    })

    it('strips script, iframe, object, embed, form, and base tags, including nested ones', () => {
      const content = [
        '<script>window.x = 1</script>',
        '',
        '<iframe src="//x"></iframe>',
        '',
        '<object data="//x"></object>',
        '',
        '<embed src="//x" />',
        '',
        '<form></form>',
        '',
        '<base href="//evil.example/" />',
        '',
        '<div><iframe src="//nested"></iframe></div>',
      ].join('\n')
      const { container } = render(<MarkdownRenderer content={content} mode="full" />)
      expect(container.querySelector('script')).toBeNull()
      expect(container.querySelector('iframe')).toBeNull()
      expect(container.querySelector('object')).toBeNull()
      expect(container.querySelector('embed')).toBeNull()
      expect(container.querySelector('form')).toBeNull()
      expect(container.querySelector('base')).toBeNull()
    })

    it('strips on* attributes but keeps the element', () => {
      const { container } = render(
        <MarkdownRenderer content='<div onclick="evil()">hi</div>' mode="full" />,
      )
      const div = container.querySelector('div')
      expect(div).not.toBeNull()
      expect(div?.getAttribute('onclick')).toBeNull()
    })

    it('neutralizes a javascript: href', () => {
      const { container } = render(
        <MarkdownRenderer content='<a href="javascript:alert(1)">click</a>' mode="full" />,
      )
      expect(container.querySelector('a')?.getAttribute('href')).toBeNull()
    })

    it('keeps the style attribute and custom data attributes untouched', () => {
      const { container } = render(
        <MarkdownRenderer content='<div style="color:red" data-x="1">hi</div>' mode="full" />,
      )
      const div = container.querySelector('div[data-x="1"]')
      expect(div).not.toBeNull()
      expect(div?.getAttribute('style')).toBe('color: red;')
    })

    it('scopes a <style> block to the rendered content root', () => {
      const { container } = render(
        <MarkdownRenderer content={'<style>p { color: red }</style>\n\nhello'} mode="full" />,
      )
      const style = container.querySelector('style')
      const rootId = container.firstElementChild?.getAttribute('id')
      expect(rootId).toBeTruthy()
      expect(style?.textContent).toContain(`@scope ([id="${rootId}"])`)
      expect(style?.textContent).toContain('p { color: red }')
    })

    it('strips @import rules from a <style> block', () => {
      const { container } = render(
        <MarkdownRenderer
          content={'<style>@import url(http://evil.example/x.css);\np { color: red }</style>'}
          mode="full"
        />,
      )
      expect(container.querySelector('style')?.textContent).not.toContain('@import')
    })

    it('strips a javascript: url() from a <style> block', () => {
      const { container } = render(
        <MarkdownRenderer
          content={'<style>p { background: url(javascript:alert(1)) }</style>'}
          mode="full"
        />,
      )
      expect(container.querySelector('style')?.textContent).not.toContain('javascript:')
    })

    it('does not crash on an empty style block', () => {
      const { container } = render(
        <MarkdownRenderer content={'<style></style>\n\nhello'} mode="full" />,
      )
      expect(container.querySelector('style')).not.toBeNull()
    })

    it('scopes multiple style blocks to the same root id', () => {
      const { container } = render(
        <MarkdownRenderer
          content={'<style>p { color: red }</style>\n\n<style>a { color: blue }</style>'}
          mode="full"
        />,
      )
      const styles = container.querySelectorAll('style')
      const rootId = container.firstElementChild?.getAttribute('id')
      expect(styles).toHaveLength(2)
      styles.forEach((style) => {
        expect(style.textContent).toContain(`[id="${rootId}"]`)
      })
    })
  })

  describe('LaTeX (full mode only)', () => {
    it('renders inline math with $...$', () => {
      const { container } = render(<MarkdownRenderer content="Euler: $x^2$" mode="full" />)
      expect(container.querySelector('.katex')).not.toBeNull()
    })

    it('renders block math with $$...$$', () => {
      const { container } = render(
        <MarkdownRenderer content={'$$\\int_0^1 f(x)dx$$'} mode="full" />,
      )
      expect(container.querySelector('.katex')).not.toBeNull()
    })

    it('does not render math in restricted mode', () => {
      const { container } = render(<MarkdownRenderer content="Euler: $x^2$" />)
      expect(container.querySelector('.katex')).toBeNull()
      expect(container).toHaveTextContent('$x^2$')
    })

    it('does not treat a price mention as math', () => {
      const { container } = render(
        <MarkdownRenderer content="Ça coûte 5 $ par mois." mode="full" />,
      )
      expect(container.querySelector('.katex')).toBeNull()
      expect(container).toHaveTextContent('Ça coûte 5 $ par mois.')
    })

    it('does not render math inside a code block', () => {
      const { container } = render(<MarkdownRenderer content={'```\n$x^2$\n```'} mode="full" />)
      expect(container.querySelector('.katex')).toBeNull()
    })
  })
})
