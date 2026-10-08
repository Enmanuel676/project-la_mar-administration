import { useEffect, useRef, useState } from 'react'
import {
  CURRENCIES,
  IMAGE_TYPES,
  MAX_IMAGE_MB,
  MAX_IMAGE_SIDE,
} from '../../lib/api'

const MB = 1024 * 1024

const EMPTY = {
  name: '',
  price: '',
  currency: 'USD',
  stock: '',
  category: 'Anillos',
  collection: '',
  materials: '',
  description: '',
  image: '',
  published: false,
}

function toForm(article) {
  if (!article) return EMPTY
  return {
    name: article.name != null ? article.name : '',
    price: article.price != null ? article.price : '',
    currency: CURRENCIES[article.currency] ? article.currency : 'USD',
    stock: article.stock != null ? article.stock : '',
    category: article.category || 'Anillos',
    collection: article.collection != null ? article.collection : '',
    materials: article.materials != null ? article.materials : '',
    description: article.description != null ? article.description : '',
    image: article.image != null ? article.image : '',
    published: !!article.published,
  }
}

// Último recurso, para una foto que el backend no aceptaría tal cual: un formato que el
// navegador sí sabe abrir (HEIC en Safari, por ejemplo) o un archivo de más de MAX_IMAGE_MB.
// Se reduce a MAX_IMAGE_SIDE de lado y sale en WebP, o en PNG en los navegadores que no
// generan WebP; los dos conservan la transparencia. Una animación queda en su primer fotograma.
function shrinkInBrowser(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      const scale = Math.min(
        1,
        MAX_IMAGE_SIDE / Math.max(img.width, img.height),
      )
      const cv = document.createElement('canvas')
      cv.width = Math.round(img.width * scale)
      cv.height = Math.round(img.height * scale)
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height)
      cv.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error('No se pudo leer esa imagen. Prueba con otra foto.'),
            )
          } else if (blob.size > MAX_IMAGE_MB * MB) {
            reject(
              new Error(`La imagen no puede pesar más de ${MAX_IMAGE_MB} MB.`),
            )
          } else {
            const ext = blob.type === 'image/webp' ? 'webp' : 'png'
            resolve(new File([blob], `foto.${ext}`, { type: blob.type }))
          }
        },
        'image/webp',
        0.9,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('No se pudo leer esa imagen. Prueba con otra foto.'))
    }
    img.src = URL.createObjectURL(file)
  })
}

export default function ArticleFormView({ article, onBack, onSave, onDelete }) {
  const [form, setForm] = useState(() => toForm(article))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  // Porcentaje subido de la foto nueva mientras se guarda; null si no se está subiendo ninguna.
  const [progress, setProgress] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)
  const fileInputRef = useRef(null)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  // La vista previa de una foto nueva es una URL temporal (blob:) que ocupa memoria hasta que
  // se libera: se libera al cambiar de foto o al salir del formulario.
  useEffect(() => {
    const preview = form.image
    return () => {
      if (preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    }
  }, [form.image])

  function pickImage(file) {
    setImageFile(file)
    setRemoveImage(false)
    setError('')
    update('image', URL.createObjectURL(file))
  }

  // Foto elegida desde el explorador de archivos (móvil o escritorio). Se envía tal cual y el
  // backend hace el resto: la pasa a WebP, la endereza, la reduce y la comprime. Así se
  // conservan la calidad, la transparencia de los PNG y las animaciones de los GIF.
  // `form.image` solo guarda la vista previa; lo que se sube es `imageFile`.
  function handleFile(e) {
    const file = e.target.files && e.target.files[0]
    e.target.value = '' // permite volver a elegir el mismo archivo
    if (!file) return
    if (IMAGE_TYPES.includes(file.type) && file.size <= MAX_IMAGE_MB * MB) {
      pickImage(file)
      return
    }
    shrinkInBrowser(file)
      .then(pickImage)
      .catch((ex) => setError(ex.message))
  }

  // Si el navegador no puede mostrar la foto elegida, tampoco se envía.
  function handlePreviewError() {
    if (imageFile) {
      setImageFile(null)
      setError('No se pudo leer esa imagen. Prueba con otra foto.')
    }
    update('image', '')
  }

  function handleRemoveImage() {
    setImageFile(null)
    // Solo hace falta avisar al backend si el artículo ya tenía una foto guardada.
    setRemoveImage(!!(article && article.image))
    update('image', '')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const data = {
      name: form.name.trim(),
      price: parseFloat(form.price),
      currency: form.currency,
      stock: form.stock === '' ? null : parseInt(form.stock, 10),
      category: form.category,
      collection: form.collection.trim(),
      materials: form.materials.trim(),
      description: form.description.trim(),
      image: form.image,
      imageFile: imageFile,
      removeImage: removeImage && !imageFile,
      published: form.published,
    }
    if (!data.name || !(data.price >= 0)) {
      setError('El nombre y un precio válido son obligatorios.')
      return
    }
    setError('')
    setSaving(true)
    setProgress(imageFile ? 0 : null)
    try {
      await onSave(data, imageFile ? setProgress : undefined)
    } catch (ex) {
      setError(ex.message)
    } finally {
      setSaving(false)
      setProgress(null)
    }
  }

  // Al llegar al 100 % la foto ya está en el servidor, que aún tiene que optimizarla.
  const progressLabel =
    progress === null
      ? ''
      : progress < 100
        ? `Subiendo ${progress} %`
        : 'Procesando foto…'

  return (
    <section className="admin__view admin__view--form" id="view-form">
      <header className="topbar topbar--form">
        <button
          aria-label="Volver"
          className="icon-btn"
          onClick={onBack}
          type="button"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            arrow_back
          </span>
        </button>
        <h1 className="admin__title">
          {article ? 'Editar artículo' : 'Nuevo artículo'}
        </h1>
      </header>
      <form
        className="form"
        id="article-form"
        noValidate
        onSubmit={handleSubmit}
      >
        <div>
          <span className="admin__label">Imagen</span>
          <div className="form__image" id="image-preview">
            {form.image ? (
              <img
                alt="Vista previa"
                onError={handlePreviewError}
                src={form.image}
              />
            ) : (
              <span
                className="material-symbols-outlined"
                id="image-placeholder"
              >
                add_photo_alternate
              </span>
            )}
          </div>
          <div className="form__image-input">
            <label className="icon-btn form__upload" title="Elegir una foto">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20 }}
              >
                photo_camera
              </span>
              <input
                accept="image/*"
                className="sr-only"
                onChange={handleFile}
                ref={fileInputRef}
                type="file"
              />
            </label>
            {form.image && (
              <button
                aria-label="Quitar imagen"
                className="icon-btn"
                onClick={handleRemoveImage}
                title="Quitar imagen"
                type="button"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20 }}
                >
                  delete
                </span>
              </button>
            )}
          </div>
          <p className="admin__hint">
            JPG, PNG, WebP o GIF, hasta {MAX_IMAGE_MB} MB. Se sube al guardar.
          </p>
        </div>
        <label>
          <span className="admin__label">Nombre *</span>
          <input
            className="field"
            maxLength={80}
            onChange={(e) => update('name', e.target.value)}
            placeholder="L'Abysse Vert"
            required
            type="text"
            value={form.name}
          />
        </label>
        <div>
          <label className="admin__label" htmlFor="f-price">
            Precio *
          </label>
          <div className="price-group">
            <span aria-hidden="true" className="price-sign">
              $
            </span>
            <input
              aria-label="Precio"
              className="price-input"
              id="f-price"
              inputMode="decimal"
              min="0"
              onChange={(e) => update('price', e.target.value)}
              placeholder="48000"
              required
              step="0.01"
              type="number"
              value={form.price}
            />
            <select
              aria-label="Moneda"
              className="price-currency"
              onChange={(e) => update('currency', e.target.value)}
              value={form.currency}
            >
              <option value="USD">USD</option>
              <option value="CUP">CUP</option>
            </select>
          </div>
          <p className="admin__hint">{CURRENCIES[form.currency]}</p>
        </div>
        <div className="form__row">
          <label>
            <span className="admin__label">Stock</span>
            <input
              className="field"
              inputMode="numeric"
              min="0"
              onChange={(e) => update('stock', e.target.value)}
              placeholder="1"
              step="1"
              type="number"
              value={form.stock}
            />
          </label>
          <label>
            <span className="admin__label">Categoría</span>
            <select
              className="field"
              onChange={(e) => update('category', e.target.value)}
              value={form.category}
            >
              <option>Anillos</option>
              <option>Collares</option>
              <option>Pendientes</option>
              <option>Pulseras</option>
              <option>Relojes</option>
            </select>
          </label>
        </div>
        <label>
          <span className="admin__label">Colección</span>
          <input
            className="field"
            onChange={(e) => update('collection', e.target.value)}
            placeholder="Collection Océano"
            type="text"
            value={form.collection}
          />
        </label>
        <label>
          <span className="admin__label">Materiales</span>
          <input
            className="field"
            onChange={(e) => update('materials', e.target.value)}
            placeholder="Émeraude 4.2 ct · Or rose 18k"
            type="text"
            value={form.materials}
          />
        </label>
        <label>
          <span className="admin__label">Descripción</span>
          <textarea
            className="field"
            maxLength={600}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Describe la pieza…"
            value={form.description}
          />
        </label>
        <label className="form__publish">
          <span>
            <span className="form__publish-title">Publicado</span>
            <span className="form__publish-text">
              Visible en el catálogo de la web
            </span>
          </span>
          <input
            checked={form.published}
            className="switch"
            onChange={(e) => update('published', e.target.checked)}
            type="checkbox"
          />
        </label>
        {error && (
          <p className="admin__error" role="alert">
            {error}
          </p>
        )}
      </form>
      <div className="actionbar">
        {onDelete && (
          <button className="btn-danger" onClick={onDelete} type="button">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20 }}
            >
              delete
            </span>
          </button>
        )}
        <button
          className={
            'btn-primary' +
            (saving ? ' is-busy' : '') +
            (progress !== null ? ' btn-progress' : '')
          }
          disabled={saving}
          form="article-form"
          type="submit"
        >
          {progress !== null ? (
            <>
              <span
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={progress}
                role="progressbar"
              >
                {progressLabel}
              </span>
              {/* Copia del texto sobre el relleno, recortada al porcentaje subido: la barra
                  crece de izquierda a derecha y el texto se lee bien en ambas partes. */}
              <span
                aria-hidden="true"
                className="btn-progress__fill"
                style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}
              >
                {progressLabel}
              </span>
            </>
          ) : saving ? (
            <span>Cargando…</span>
          ) : (
            <>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18 }}
              >
                save
              </span>
              <span>Guardar</span>
            </>
          )}
        </button>
      </div>
    </section>
  )
}
