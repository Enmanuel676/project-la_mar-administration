import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import DoneButton from '../DoneButton/DoneButton'

export default function UsersView({ onBack, currentUser, isAdmin }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'user' })
  const [saving, setSaving] = useState(false)
  const [editDone, setEditDone] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteDone, setDeleteDone] = useState(false)
  const [changingPassword, setChangingPassword] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordDone, setPasswordDone] = useState(false)

  // Usar isAdmin recibido como prop (ya verificado en Dashboard)
  const isCurrentUserAdmin = isAdmin

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    setError('')
    try {
      const list = await api.listUsers()
      setUsers(list)
    } catch (ex) {
      setError(ex.message)
    } finally {
      setLoading(false)
    }
  }

  function openEdit(user) {
    setEditingUser(user)
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
    })
  }

  function closeEdit() {
    setEditingUser(null)
    setEditForm({ name: '', email: '', role: 'user' })
    // Resetear también el progreso: si se cerró el modal a mitad del guardado, la próxima
    // edición no debe heredar «Guardando…» ni el botón deshabilitado.
    setSaving(false)
    setEditDone(false)
    setError('')
  }

  // Cierra el diálogo de eliminación sea como sea (fondo, Cancelar o tras «Hecho») y
  // libera el botón para la próxima eliminación.
  function closeDelete() {
    setConfirmDelete(null)
    setDeleting(false)
    setDeleteDone(false)
    setError('')
  }

  // Cierra el diálogo de contraseña y libera su botón (comparte `saving` con la edición).
  function closePassword() {
    setChangingPassword(null)
    setNewPassword('')
    setSaving(false)
    setPasswordDone(false)
    setError('')
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!editingUser) return
    setSaving(true)
    setError('')
    try {
      const updated = await api.updateUser(editingUser.id || editingUser._id, editForm)
      setUsers((list) =>
        list.map((u) => (u.id === updated.id || u._id === updated._id ? updated : u)),
      )
      // Recargar la lista para que todos los datos queden sincronizados
      await loadUsers()
      setEditDone(true)
    } catch (ex) {
      setError(ex.message)
    } finally {
      // Siempre se libera el botón, también si se cerró el modal a mitad de la petición:
      // si `saving` quedara en true, la próxima edición nacería con «Guardando…» y
      // deshabilitada.
      setSaving(false)
    }
  }

  function handleEditDone() {
    closeEdit()
  }

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    setError('')
    try {
      await api.deleteUser(confirmDelete.id || confirmDelete._id)
      setUsers((list) =>
        list.filter((u) => (u.id || u._id) !== (confirmDelete.id || confirmDelete._id)),
      )
      setDeleteDone(true)
    } catch (ex) {
      setError(ex.message)
      setDeleting(false)
    }
  }

  function handleDeleteDone() {
    closeDelete()
    setDeleting(false)
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (!changingPassword || !newPassword) return
    setSaving(true)
    setError('')
    try {
      await api.changeUserPassword(changingPassword.id || changingPassword._id, newPassword)
      setPasswordDone(true)
    } catch (ex) {
      setError(ex.message)
    } finally {
      setSaving(false)
    }
  }

  function handlePasswordDone() {
    closePassword()
  }

  function isCurrentUser(user) {
    return currentUser && user.email === currentUser.email
  }

  return (
    <section className="admin__view admin__view--users" id="view-users">
      <header className="topbar topbar--form">
        <button
          aria-label="Volver al catálogo"
          className="icon-btn"
          onClick={onBack}
          type="button"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            arrow_back
          </span>
        </button>
        <div>
          <span className="admin__kicker">La Mar · Admin</span>
          <h1 className="admin__title">Usuarios</h1>
        </div>
      </header>

      {error && (
        <p className="admin__error" role="alert" style={{ margin: '1rem var(--margin-mobile) 0' }}>
          {error}
        </p>
      )}

      <div className="users-list">
        {loading ? (
          <>
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
          </>
        ) : users.length === 0 ? (
          <div className="empty">
            <span className="material-symbols-outlined">group_off</span>
            <p className="empty__title">Sin usuarios</p>
            <p className="empty__text">No hay usuarios registrados.</p>
          </div>
        ) : (
          users.map((user) => {
            const userId = user.id || user._id
            const isCurrent = isCurrentUser(user)
            return (
              <div className="user-card card" key={userId}>
                <div className="card__main">
                  <div className="card__thumb user-card__avatar">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div className="card__info">
                    <span className="card__meta">
                      {user.isAdmin || user.role === 'admin' ? 'Administrador' : 'Usuario'}
                      {isCurrent && ' · Tú'}
                    </span>
                    <span className="card__name">{user.name}</span>
                    <span className="card__price">{user.email}</span>
                  </div>
                </div>
                <div className="card__side">
                  {(!isCurrent && isCurrentUserAdmin) && (
                    <div className="user-card__actions">
                      <button
                        className="icon-btn icon-btn--sm"
                        onClick={() => openEdit(user)}
                        title="Editar usuario"
                        type="button"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                          edit
                        </span>
                      </button>
                      <button
                        className="icon-btn icon-btn--sm"
                        onClick={() => setChangingPassword(user)}
                        title="Cambiar contraseña"
                        type="button"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                          lock_reset
                        </span>
                      </button>
                      <button
                        className="icon-btn icon-btn--sm icon-btn--danger"
                        onClick={() => setConfirmDelete(user)}
                        title="Eliminar usuario"
                        type="button"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                          delete
                        </span>
                      </button>
                    </div>
                  )}
                  {isCurrent && (
                    <span className="badge badge-on">Tu cuenta</span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal de edición */}
      {editingUser && (
        <div className="confirm" onClick={closeEdit}>
          <div className="confirm__sheet" onClick={(e) => e.stopPropagation()}>
            <div className="confirm__grip" />
            <h2 className="admin__title">Editar usuario</h2>
            <form className="form" onSubmit={handleSave}>
              <label>
                <span className="admin__label">Nombre</span>
                <input
                  className="field"
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  type="text"
                  value={editForm.name}
                />
              </label>
              <label>
                <span className="admin__label">Correo electrónico</span>
                <input
                  className="field"
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                  type="email"
                  value={editForm.email}
                />
              </label>
              <label>
                <span className="admin__label">Rol</span>
                <select
                  className="field"
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  value={editForm.role}
                  disabled={!isCurrentUserAdmin}
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </label>
              <div className="confirm__actions">
                <button
                  className="btn-ghost"
                  onClick={closeEdit}
                  type="button"
                >
                  Cancelar
                </button>
                <DoneButton
                  className={'btn-primary' + (saving ? ' is-busy' : '')}
                  disabled={saving}
                  done={editDone}
                  onDone={handleEditDone}
                  type="submit"
                >
                  {saving ? (
                    <span>Guardando…</span>
                  ) : (
                    <>
                      <span>Guardar</span>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 18 }}
                      >
                        arrow_forward
                      </span>
                    </>
                  )}
                </DoneButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {confirmDelete && (
        <div className="confirm" onClick={closeDelete}>
          <div className="confirm__sheet" onClick={(e) => e.stopPropagation()}>
            <div className="confirm__grip" />
            <h2 className="admin__title">Eliminar usuario</h2>
            <p className="confirm__text">
              ¿Seguro que quieres eliminar a <strong>{confirmDelete.name}</strong> ({confirmDelete.email})?
              Esta acción no se puede deshacer.
            </p>
            <div className="confirm__actions">
              <button
                className="btn-ghost"
                onClick={closeDelete}
                type="button"
              >
                Cancelar
              </button>
              <DoneButton
                className={'btn-danger' + (deleting ? ' is-busy' : '')}
                disabled={deleting}
                done={deleteDone}
                onClick={handleDelete}
                onDone={handleDeleteDone}
                type="button"
              >
                {deleting ? (
                  <span>Eliminando…</span>
                ) : (
                  <>
                    <span>Eliminar</span>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 18 }}
                    >
                      delete
                    </span>
                  </>
                )}
              </DoneButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cambio de contraseña */}
      {changingPassword && (
        <div className="confirm" onClick={closePassword}>
          <div className="confirm__sheet" onClick={(e) => e.stopPropagation()}>
            <div className="confirm__grip" />
            <h2 className="admin__title">Cambiar contraseña</h2>
            <p className="confirm__text">
              Cambiar la contraseña de <strong>{changingPassword.name}</strong>
            </p>
            <form className="form" onSubmit={handleChangePassword}>
              <label>
                <span className="admin__label">Nueva contraseña</span>
                <div className="register__password">
                  <input
                    className="field"
                    minLength={8}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                  />
                  <button
                    aria-label="Mostrar contraseña"
                    className="register__toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    type="button"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </label>
              <div className="confirm__actions">
                <button
                  className="btn-ghost"
                  onClick={closePassword}
                  type="button"
                >
                  Cancelar
                </button>
                <DoneButton
                  className={'btn-primary' + (saving ? ' is-busy' : '')}
                  disabled={saving || newPassword.length < 8}
                  done={passwordDone}
                  onDone={handlePasswordDone}
                  type="submit"
                >
                  {saving ? (
                    <span>Guardando…</span>
                  ) : (
                    <>
                      <span>Cambiar</span>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 18 }}
                      >
                        arrow_forward
                      </span>
                    </>
                  )}
                </DoneButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
