import { useState } from 'react'
import { hasErrors, LIMITS, validateLogin } from '../../lib/validation'
import DoneButton from '../DoneButton/DoneButton'

// `notice`: aviso que llega de fuera, por ejemplo que la sesión anterior caducó.
export default function Login({
  notice,
  onShowRegister,
  onLogin,
  onLoginDone,
}) {
  const [loading, setLoading] = useState(false)
  const [loginResult, setLoginResult] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  // Un campo muestra su error cuando ya se ha salido de él una vez: así no aparece
  // «correo no válido» con la primera letra. El botón, en cambio, se bloquea desde el principio.
  const [touched, setTouched] = useState({})

  const errors = validateLogin({ email, password })
  const invalid = hasErrors(errors)
  const emailError = touched.email && errors.email
  const passwordError = touched.password && errors.password

  function touch(field) {
    setTouched((t) => ({ ...t, [field]: true }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return
    if (invalid) {
      setTouched({ email: true, password: true })
      return
    }
    setError('')
    setLoading(true)
    try {
      const result = await onLogin(email, password)
      setLoginResult(result)
    } catch (ex) {
      setError(ex.message)
      setLoading(false)
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
        {notice && (
          <p className="login__notice" role="status">
            {notice}
          </p>
        )}
        <form className="login__form" noValidate onSubmit={handleSubmit}>
          <label>
            <span className="admin__label">Correo electrónico</span>
            <input
              aria-describedby={emailError ? 'login-email-error' : undefined}
              aria-invalid={emailError ? true : undefined}
              autoComplete="username"
              className={'field' + (emailError ? ' field--invalid' : '')}
              inputMode="email"
              onBlur={() => touch('email')}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@lamar.com"
              required
              type="email"
              value={email}
            />
            {emailError && (
              <span className="admin__field-error" id="login-email-error">
                {emailError}
              </span>
            )}
          </label>
          <label>
            <span className="admin__label">Contraseña</span>
            <div className="login__password">
              <input
                aria-describedby={
                  passwordError ? 'login-password-error' : undefined
                }
                aria-invalid={passwordError ? true : undefined}
                autoComplete="current-password"
                className={'field' + (passwordError ? ' field--invalid' : '')}
                maxLength={LIMITS.password}
                onBlur={() => touch('password')}
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
            {passwordError && (
              <span className="admin__field-error" id="login-password-error">
                {passwordError}
              </span>
            )}
          </label>
          {error && (
            <p className="admin__error" role="alert">
              {error}
            </p>
          )}
          <div className="login__actions">
            <button
              className="btn-ghost"
              onClick={onShowRegister}
              type="button"
            >
              ¿No tienes cuenta? Regístrate
            </button>
          </div>
          <DoneButton
            className={'btn-primary btn-block' + (loading ? ' is-busy' : '')}
            disabled={loading || invalid}
            done={!!loginResult}
            onDone={() => onLoginDone(loginResult)}
            type="submit"
          >
            {loading ? (
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
