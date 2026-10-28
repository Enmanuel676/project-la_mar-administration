import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  act,
} from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import App from '../src/App'
import { api } from '../src/lib/api'
import { setSession, getToken } from '../src/lib/session'

vi.mock('../src/lib/api', () => ({
  api: Object.fromEntries(
    [
      'list',
      'listDeleted',
      'getConfig',
      'getMe',
      'login',
      'register',
      'logout',
      'createUser',
      'listUsers',
      'updateUser',
      'deleteUser',
      'changeUserPassword',
    ].map((key) => [key, vi.fn()]),
  ),
  setSessionExpiredHandler: vi.fn(),
  SESSION_EXPIRED_MESSAGE: 'Tu sesión ha caducado.',
  CURRENCIES: { USD: 'Dólar estadounidense', CUP: 'Peso cubano' },
  DAY_MS: 86400000,
  IMAGE_TYPES: [],
  MAX_IMAGE_MB: 20,
  MAX_IMAGE_SIDE: 1600,
}))
// Se prueba el ciclo de vida real de DoneButton con la variante sin movimiento.
vi.mock('../src/lib/pixelDissolve', () => ({
  CELL: 14,
  createSurface: () => ({}),
  renderSurface: () => 'shown',
  prefersReducedMotion: () => true,
}))

const admin = {
  _id: 'admin-id',
  email: 'admin@example.test',
  name: 'Admin prueba',
  role: 'admin',
  isAdmin: true,
}
const member = {
  _id: 'member-id',
  email: 'member@example.test',
  name: 'Usuario prueba',
  role: 'user',
  isAdmin: false,
}
const article = {
  id: 'article-id',
  name: 'Anillo de prueba',
  price: 10,
  currency: 'USD',
  category: 'Anillos',
  published: true,
}
function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>
}
function mount(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <Location />
    </MemoryRouter>,
  )
}
const change = (label, value) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  api.list.mockResolvedValue([article])
  api.listDeleted.mockResolvedValue([])
  api.getConfig.mockResolvedValue({ trashRetentionDays: 7 })
  api.getMe.mockResolvedValue(admin)
  api.logout.mockResolvedValue(null)
  api.listUsers.mockResolvedValue([admin, member])
})
afterEach(cleanup)

describe('Flujos del panel', () => {
  it('la raíz es pública, no tiene el encabezado eliminado y una ruta privada vuelve a /', async () => {
    mount('/privada')
    expect(
      await screen.findByRole('heading', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/)
    expect(
      screen.queryByRole('button', { name: 'Inicia sesión' }),
    ).not.toBeInTheDocument()
    expect(api.list).not.toHaveBeenCalled()
  })

  it('mantiene Hecho visible antes de guardar la sesión y abrir el catálogo', async () => {
    api.login.mockResolvedValue({ token: 'login-token', user: admin })
    mount()
    change('Correo electrónico', 'admin@example.test')
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Entrar/ }))
    expect(await screen.findByText('Hecho')).toBeInTheDocument()
    expect(getToken()).toBeNull()
    expect(
      await screen.findByText('Anillo de prueba', {}, { timeout: 2000 }),
    ).toBeInTheDocument()
    expect(getToken()).toBe('login-token')
  })

  it('carga artículos y usuarios aunque falle la consulta de configuración', async () => {
    setSession('stored-token', admin)
    api.getConfig.mockRejectedValue(new Error('404'))
    mount()
    expect(await screen.findByText('Anillo de prueba')).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Administrar usuarios' }),
    )
    expect(await screen.findByText('Usuario prueba')).toBeInTheDocument()
    expect(api.listUsers).toHaveBeenCalledOnce()
  })

  it('editar un usuario no cambia los otros registros cuando la API devuelve _id', async () => {
    setSession('stored-token', admin)
    api.listUsers.mockResolvedValue([
      admin,
      member,
      {
        ...member,
        _id: 'other-id',
        name: 'Otro usuario',
        email: 'other@example.test',
      },
    ])
    api.updateUser.mockResolvedValue({ ...member, name: 'Usuario editado' })
    mount()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Administrar usuarios' }),
    )
    await screen.findByText('Usuario prueba')
    fireEvent.click(screen.getAllByTitle('Editar usuario')[0])
    change('Nombre', 'Usuario editado')
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }))
    await waitFor(() =>
      expect(screen.getByText('Usuario editado')).toBeInTheDocument(),
    )
    expect(screen.getByText('Otro usuario')).toBeInTheDocument()
  })

  it('crear usuario desde administración conserva la identidad del administrador', async () => {
    setSession('admin-token', admin)
    api.createUser.mockResolvedValue(member)
    mount()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Registrar usuario' }),
    )
    change('Nombre', 'Usuario')
    change('Apellido', 'prueba')
    change('Correo electrónico', 'member@example.test')
    const passwords = screen.getAllByPlaceholderText('••••••••')
    passwords.forEach((input) =>
      fireEvent.change(input, { target: { value: 'password123' } }),
    )
    fireEvent.click(screen.getByRole('button', { name: /Crear cuenta/ }))
    await waitFor(() => expect(api.createUser).toHaveBeenCalledOnce())
    expect(
      await screen.findByRole(
        'heading',
        { name: 'Catálogo' },
        { timeout: 2000 },
      ),
    ).toBeInTheDocument()
    expect(getToken()).toBe('admin-token')
    expect(api.register).not.toHaveBeenCalled()
    expect(
      screen.getByRole('button', { name: 'Administrar usuarios' }),
    ).toBeInTheDocument()
  })

  it('cerrar sesión vuelve a / y una respuesta pendiente no restaura al usuario', async () => {
    setSession('admin-token', admin)
    let resolveUser
    api.getMe.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUser = resolve
        }),
    )
    mount()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Cerrar sesión' }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument()
    await act(async () => resolveUser(admin))
    expect(getToken()).toBeNull()
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/)
    expect(
      screen.queryByRole('button', { name: 'Administrar usuarios' }),
    ).not.toBeInTheDocument()
  })
})
