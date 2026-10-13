import { useState } from 'react'
import { api } from '../../lib/api'
import DoneButton from '../DoneButton/DoneButton'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // Sesión ya recibida ({ token, user }): el botón pasa a «Hecho» y, al terminar, se entra.
  const [logged, setLogged] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) {
      setError('Introduce tu correo y contraseña.')
      return
    }
    setError('')
    setBusy(true)
    try {
      setLogged(await api.login(email, password))
    } catch (ex) {
      setError(ex.message)
      setBusy(false)
    }
  }

  return (
    <section className="admin__view login" id="view-login">
      <div className="login__body">
        <div className="login__brand">
          <div className="login__header">
            <img alt="" className="login__logo" src="/logo.webp" />
          </div>
          <div>
            <span className="login__name">La Mar</span>
            <span className="admin__kicker">Administración</span>
          </div>
        </div>
        <h1 className="admin__title admin__title--xl">Iniciar sesión</h1>
        <p className="admin__lead">
          Accede para gestionar el catálogo de la tienda.
        </p>
        <form className="login__form" noValidate onSubmit={handleSubmit}>
          <label>
            <span className="admin__label">Correo electrónico</span>
            <input
              autoComplete="username"
              className="field"
              inputMode="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@lamar.com"
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            <span className="admin__label">Contraseña</span>
            <div className="login__password">
              <input
                autoComplete="current-password"
                className="field"
                minLength={4}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <button
                aria-label="Mostrar contraseña"
                className="login__toggle"
                onClick={() => setShowPassword((v) => !v)}
                type="button"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20 }}
                >
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </label>
          {error && (
            <p className="admin__error" role="alert">
              {error}
            </p>
          )}
          <DoneButton
            className={'btn-primary btn-block' + (busy ? ' is-busy' : '')}
            disabled={busy}
            done={!!logged}
            onDone={() => onLogin(logged.token, logged.user)}
            type="submit"
          >
            {busy ? (
              <span>Cargando…</span>
            ) : (
              <>
                <span>Entrar</span>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18 }}
                >
                  arrow_forward
                </span>
              </>
            )}
          </DoneButton>
        </form>
      </div>
      <p className="login__foot">© La Mar Joyeria</p>
    </section>
  )
}
