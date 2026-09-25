import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from './App'

const snapshot = { period: { start: '2026-01-01', end: '2026-01-02', label: 'TEST' }, agents: [{ id: 'agent-test', active: true, tasks: 4, earned: '12.5' }] }

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => snapshot }))
})

afterEach(() => vi.unstubAllGlobals())

it('loads agent data and exposes cell details by keyboard interaction', async () => {
  const user = userEvent.setup()
  render(<App />)
  const cell = await screen.findByRole('button', { name: /agent-test/ })
  await user.tab()
  while (document.activeElement !== cell) await user.tab()
  await user.keyboard('{Enter}')
  expect(screen.getByText(/agent-test · 4 TASKS · 12.5 UP/)).toBeInTheDocument()
  expect(screen.getByRole('cell', { name: /agent-test/ })).toBeInTheDocument()
})

it('reports missing deployment config and keeps refresh available', async () => {
  render(<App />)
  await waitFor(() => expect(screen.getByText(/Add the deployed token address/)).toBeInTheDocument())
  expect(screen.getByRole('button', { name: 'Refresh Chain' })).toBeEnabled()
})
