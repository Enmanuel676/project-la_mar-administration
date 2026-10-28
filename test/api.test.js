import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, setSessionExpiredHandler } from '../src/lib/api'
import { getToken, setSession } from '../src/lib/session'
const user = { email: 'test@example.test' }
const response = (status, body) => ({
  status,
  ok: status < 400,
  json: async () => body,
})
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  localStorage.clear()
})
afterEach(() => {
  vi.unstubAllGlobals()
  setSessionExpiredHandler(null)
})

describe('Contrato de API y caducidad de sesión', () => {
  it('login, registro y creación administrativa usan los endpoints correctos', async () => {
    fetch.mockResolvedValue(response(200, {}))
    await api.login(user.email, 'password')
    expect(fetch.mock.calls[0][0]).toMatch(/\/api\/signin$/)
    await api.register('Test', 'User', user.email, 'password')
    expect(fetch.mock.calls[1][0]).toMatch(/\/api\/signup$/)
    await api.createUser('Test', 'User', user.email, 'password')
    expect(fetch.mock.calls[2][0]).toMatch(/\/api\/users$/)
    expect(fetch.mock.calls[2][1].method).toBe('POST')
  })
  it('varios 401 simultáneos invalidan la sesión una sola vez', async () => {
    setSession('old-token', user)
    const expired = vi.fn()
    setSessionExpiredHandler(expired)
    fetch.mockResolvedValue(response(401, { message: 'Caducada' }))
    await Promise.allSettled([api.list(), api.listDeleted(), api.getMe()])
    expect(expired).toHaveBeenCalledOnce()
    expect(getToken()).toBeNull()
  })
  it('un 401 de una sesión anterior no borra la cuenta que acaba de entrar', async () => {
    setSession('old-token', user)
    let resolve
    fetch.mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r
        }),
    )
    const request = api.list()
    setSession('new-token', user)
    resolve(response(401, { message: 'Caducada' }))
    await expect(request).rejects.toThrow()
    expect(getToken()).toBe('new-token')
  })
})
