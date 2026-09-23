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
  })
})
