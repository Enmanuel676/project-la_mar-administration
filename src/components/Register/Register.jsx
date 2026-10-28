import { useState } from 'react'
import { api } from '../../lib/api'
import DoneButton from '../DoneButton/DoneButton'

export default function Register({ onRegister, onBackToLogin }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [registered, setRegistered] = useState(null)
  const [touched, setTouched] = useState({})

  function touch(field) {
    setTouched((t) => ({ ...t, [field]: true }))
  }

  function validate() {
    const errors = {}
    if (!firstName.trim()) errors.firstName = 'El nombre es obligatorio.'
    else if (firstName.trim().length > 50) errors.firstName = 'El nombre no puede superar los 50 caracteres.'
    if (!lastName.trim()) errors.lastName = 'El apellido es obligatorio.'
    else if (lastName.trim().length > 50) errors.lastName = 'El apellido no puede superar los 50 caracteres.'
    if (!email.trim()) {
      errors.email = 'El correo electrónico es obligatorio.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'El correo electrónico no es válido.'
    }
    if (!password) errors.password = 'La contraseña es obligatoria.'
    else if (password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres.'
    else if (password.length > 128) errors.password = 'La contraseña no puede superar los 128 caracteres.'
    if (!confirmPassword) {
      errors.confirmPassword = 'Confirma tu contraseña.'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden.'
    }
    return errors
  }

  const errors = validate()
  const invalid = Object.keys(errors).length > 0
  const firstNameError = touched.firstName && errors.firstName
  const lastNameError = touched.lastName && errors.lastName
  const emailError = touched.email && errors.email
  const passwordError = touched.password && errors.password
  const confirmPasswordError = touched.confirmPassword && errors.confirmPassword

  async function handleSubmit(e) {
    e.preventDefault()
    if (invalid) {
      setTouched({
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        confirmPassword: true,
      })
      return
    }
    setError('')
    setBusy(true)
    try {
      // Llamada real al backend: POST /auth/signup
      const result = await api.register(firstName, lastName, email, password)
      setRegistered(result)
    } catch (ex) {
      setError(ex.message || 'Error al registrarse')
      setBusy(false)
    }
  }

  return (
    <section className="admin__view register" id="view-register">
      <div className="register__body">
        <div className="register__brand">
          <div className="register__header">
            <img alt="" className="register__logo" src="/logo.webp" />
          </div>
          <div>
            <span className="register__name">La Mar</span>
            <span className="admin__kicker">Administración</span>
          </div>
        </div>
        <h1 className="admin__title admin__title--xl">Crear cuenta</h1>
        <p className="admin__lead">
          Regístrate para acceder al panel de administración.
        </p>
        {error && (
          <p className="admin__error" role="alert">
            {error}
          </p>
        )}
        <form
          className="register__form"
          noValidate
          onSubmit={handleSubmit}
        >
          <div className="form__row">
            <label>
              <span className="admin__label">Nombre</span>
              <input
                aria-describedby={firstNameError ? 'register-firstName-error' : undefined}
                aria-invalid={firstNameError ? true : undefined}
                autoComplete="given-name"
                className={'field' + (firstNameError ? ' field--invalid' : '')}
                onBlur={() => touch('firstName')}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Tu nombre"
                required
                type="text"
                value={firstName}
              />
              {firstNameError && (
                <span className="admin__field-error" id="register-firstName-error">
                  {firstNameError}
                </span>
              )}
            </label>
            <label>
              <span className="admin__label">Apellido</span>
              <input
                aria-describedby={lastNameError ? 'register-lastName-error' : undefined}
                aria-invalid={lastNameError ? true : undefined}
                autoComplete="family-name"
                className={'field' + (lastNameError ? ' field--invalid' : '')}
                onBlur={() => touch('lastName')}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Tu apellido"
                required
                type="text"
                value={lastName}
              />
              {lastNameError && (
                <span className="admin__field-error" id="register-lastName-error">
                  {lastNameError}
                </span>
              )}
            </label>
          </div>
          <label>
            <span className="admin__label">Correo electrónico</span>
            <input
              aria-describedby={emailError ? 'register-email-error' : undefined}
              aria-invalid={emailError ? true : undefined}
              autoComplete="username"
              className={'field' + (emailError ? ' field--invalid' : '')}
              inputMode="email"
              onBlur={() => touch('email')}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              type="email"
              value={email}
            />
            {emailError && (
              <span className="admin__field-error" id="register-email-error">
                {emailError}
              </span>
            )}
          </label>
          <label>
            <span className="admin__label">Contraseña</span>
            <div className="register__password">
              <input
                aria-describedby={passwordError ? 'register-password-error' : undefined}
                aria-invalid={passwordError ? true : undefined}
                autoComplete="new-password"
                className={'field' + (passwordError ? ' field--invalid' : '')}
                onBlur={() => touch('password')}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <button
                aria-label="Mostrar contraseña"
                className="register__toggle"
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
              <span className="admin__field-error" id="register-password-error">
                {passwordError}
              </span>
            )}
          </label>
          <label>
            <span className="admin__label">Confirmar contraseña</span>
            <div className="register__password">
              <input
                aria-describedby={
                  confirmPasswordError ? 'register-confirmPassword-error' : undefined
                }
                aria-invalid={confirmPasswordError ? true : undefined}
                autoComplete="new-password"
                className={'field' + (confirmPasswordError ? ' field--invalid' : '')}
                onBlur={() => touch('confirmPassword')}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
              />
              <button
                aria-label="Mostrar contraseña"
                className="register__toggle"
                onClick={() => setShowConfirmPassword((v) => !v)}
                type="button"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20 }}
                >
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {confirmPasswordError && (
              <span
                className="admin__field-error"
                id="register-confirmPassword-error"
              >
                {confirmPasswordError}
              </span>
            )}
          </label>
          <div className="register__actions">
            <button
              className="btn-ghost"
              onClick={onBackToLogin}
              type="button"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </div>
          <DoneButton
            className={'btn-primary btn-block' + (busy ? ' is-busy' : '')}
            disabled={busy || invalid}
            done={!!registered}
            onDone={() => {
              if (onRegister) {
                onRegister(registered)
              }
            }}
            type="submit"
          >
            {busy ? (
              <span>Registrando…</span>
            ) : (
              <>
                <span>Crear cuenta</span>
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
      <p className="register__foot">© La Mar Joyeria</p>
    </section>
  )
}
