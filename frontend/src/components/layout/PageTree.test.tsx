import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { PageTreeContext } from '#hooks/usePageTree'
import type { PageTreeNode } from '#api/pages'
import { PageTree } from './PageTree'

const tree: PageTreeNode[] = [
  {
    id: 'doc',
    slug: 'documentation',
    title: 'Documentation',
    children: [
      {
        id: 'guide',
        slug: 'guide',
        title: 'Guide',
        children: [
          { id: 'install', slug: 'installation', title: 'Installation', children: [] },
        ],
      },
    ],
  },
  { id: 'faq', slug: 'faq', title: 'FAQ', children: [] },
]

function renderTree(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <PageTreeContext.Provider value={{ tree, status: 'success', refresh: async () => {} }}>
        <Routes>
          <Route path="/pages/*" element={<PageTree />} />
        </Routes>
      </PageTreeContext.Provider>
    </MemoryRouter>,
  )
}

describe('PageTree', () => {
  it('renders every level of a multi-level tree', () => {
    renderTree('/pages/documentation/guide/installation')

    expect(screen.getByText('Documentation')).toBeInTheDocument()
    expect(screen.getByText('Guide')).toBeInTheDocument()
    expect(screen.getByText('Installation')).toBeInTheDocument()
    expect(screen.getByText('FAQ')).toBeInTheDocument()
  })

  it('highlights the active node matching the current path', () => {
    renderTree('/pages/documentation/guide/installation')

    const activeLink = screen.getByText('Installation').closest('a')
    const inactiveLink = screen.getByText('Guide').closest('a')

    expect(activeLink).toHaveClass('bg-sidebar-accent')
    expect(inactiveLink).not.toHaveClass('bg-sidebar-accent')
  })

  it('auto-expands the ancestors of the active node so it is visible', () => {
    renderTree('/pages/documentation/guide/installation')

    // Nested descendants are only in the DOM when their ancestor
    // Collapsible is open — this only passes if 'documentation' and
    // 'guide' both auto-expanded because they are ancestors of the
    // active 'installation' node.
    expect(screen.getByText('Installation')).toBeVisible()
  })
})
