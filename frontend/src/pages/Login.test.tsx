import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { AuthContext, type AuthContextValue } from '#hooks/useAuth'
import { Login } from './Login'

// The real widget loads Cloudflare's script and never resolves in
// jsdom, leaving the submit button permanently disabled — verify
// immediately instead, same as it behaves with no site key configured.
vi.mock('#components/Turnstile', () => ({
  TurnstileWidget: ({ onVerify }: { onVerify: (token: string) => void }) => {
    onVerify('test-token')
    return null
  },
}))

function renderLogin(overrides: Partial<AuthContextValue> = {}) {
  const auth: AuthContextValue = {
    user: null,
    status: 'unauthenticated',
    login: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }

  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthContext.Provider value={auth}>
        <Login />
      </AuthContext.Provider>
    </MemoryRouter>,
  )

  return auth
}

describe('Login', () => {
  it('calls login() with the entered credentials on a valid submission', async () => {
    const user = userEvent.setup()
    const auth = renderLogin()

    await user.type(screen.getByLabelText('Adresse e-mail'), 'alice@example.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'whatever-it-takes')
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    await waitFor(() => {
      expect(auth.login).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'alice@example.com',
          password: 'whatever-it-takes',
        }),
      )
    })
  })

  it('displays the server error message inline when login() rejects', async () => {
    const user = userEvent.setup()
    const auth = renderLogin({
      login: vi.fn().mockRejectedValue({
        isAxiosError: true,
        response: { status: 401, data: { error: 'Email ou mot de passe incorrect' } },
      }),
    })

    await user.type(screen.getByLabelText('Adresse e-mail'), 'alice@example.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByText('Email ou mot de passe incorrect')).toBeInTheDocument()
    expect(auth.login).toHaveBeenCalledTimes(1)
  })
})
