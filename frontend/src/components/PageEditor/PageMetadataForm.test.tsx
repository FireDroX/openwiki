import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { PageTreeContext } from '#hooks/usePageTree'
import type { PageMetadataFormValues } from '#schemas/page-metadata.schema'
import { PageMetadataForm } from './PageMetadataForm'

function Harness({ mode = 'create' as const }: { mode?: 'create' | 'edit' }) {
  const { control, setValue, watch } = useForm<PageMetadataFormValues>({
    defaultValues: { title: '', slug: '', visibility: 'public', parentId: null },
  })

  return (
    <PageTreeContext.Provider value={{ tree: [], status: 'success', refresh: async () => {} }}>
      <PageMetadataForm mode={mode} control={control} setValue={setValue} watch={watch} />
    </PageTreeContext.Provider>
  )
}

describe('PageMetadataForm', () => {
  it('auto-generates the slug from the title while creating a page', async () => {
    const user = userEvent.setup()
    render(<Harness mode="create" />)

    await user.type(screen.getByLabelText('Titre'), 'Guide de Démarrage !')

    expect(screen.getByLabelText('Chemin')).toHaveValue('guide-de-demarrage')
  })

  it('stops auto-generating the slug once the user edits it directly', async () => {
    const user = userEvent.setup()
    render(<Harness mode="create" />)

    await user.type(screen.getByLabelText('Titre'), 'First title')
    await user.clear(screen.getByLabelText('Chemin'))
    await user.type(screen.getByLabelText('Chemin'), 'custom-slug')
    await user.type(screen.getByLabelText('Titre'), ' updated')

    expect(screen.getByLabelText('Chemin')).toHaveValue('custom-slug')
  })
})
