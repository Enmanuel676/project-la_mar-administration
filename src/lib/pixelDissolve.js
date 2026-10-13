// Efecto de aparición/desaparición en píxeles de las tarjetas del frontend. Es una copia de
// project-la_mar-frontend/src/lib/pixelDissolve.js sin el bucle ligado al scroll, y con el
// tamaño de celda y el desenfoque máximo como opciones, para elementos bajos como una
// etiqueta. Una máscara CSS generada en canvas oculta el elemento celda a celda, y un canvas
// superpuesto pinta "chispas" de color en el borde de la transición.

export const CELL = 14
const MAX_BLUR = 4
const STEPS = 28
const EDGE = 0.12
const HUES = ['103,253,225', '255,181,157', '246,221,217']
const FULL_MASK = 'linear-gradient(#000, #000)'

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value)

export function createSurface(
  el,
  fx,
  { fromTop = false, cell = CELL, maxBlur = MAX_BLUR } = {},
) {
  return {
    el,
    fx,
    fromTop,
    cell,
    maxBlur,
    grid: null,
    cache: {},
    key: null,
    blur: null,
  }
}

function buildGrid(surface) {
  const { cell } = surface
  const w = surface.el.offsetWidth
  const h = surface.el.offsetHeight
  const cols = Math.max(1, Math.ceil(w / cell))
  const rows = Math.max(1, Math.ceil(h / cell))
  const thresholds = new Float32Array(cols * rows)
  const hue = new Uint8Array(cols * rows)

  for (let row = 0; row < rows; row++) {
    const bias = surface.fromTop
      ? row / Math.max(1, rows - 1)
      : (rows - 1 - row) / Math.max(1, rows - 1)
    for (let col = 0; col < cols; col++) {
      thresholds[row * cols + col] = bias * 0.72 + Math.random() * 0.28
      hue[row * cols + col] = Math.floor(Math.random() * HUES.length)
    }
  }

  surface.grid = { w, h, cols, rows, t: thresholds, hue }
  surface.cache = {}
  surface.key = null
  surface.fx.width = w
  surface.fx.height = h
}

function ensureGrid(surface) {
  const { grid, el, cell } = surface
  if (
    !grid ||
    grid.w !== el.offsetWidth ||
    Math.abs(grid.h - el.offsetHeight) > cell
  ) {
    buildGrid(surface)
  }
}

function cellAlpha(threshold, reveal, conceal) {
  const hi = reveal * 1.12
  const lo = conceal * 1.12 - EDGE
  if (threshold >= hi || threshold < lo) return 0
  const distance = Math.min(hi - threshold, threshold - lo)
  return distance < EDGE ? 0.35 + (distance / EDGE) * 0.5 : 1
}

function maskFor(surface, revealStep, concealStep) {
  const cacheKey = `${revealStep}_${concealStep}`
  if (surface.cache[cacheKey]) return surface.cache[cacheKey]

  const { grid, cell } = surface
  const canvas = document.createElement('canvas')
  canvas.width = grid.w
  canvas.height = grid.h
  const ctx = canvas.getContext('2d')
  const reveal = revealStep / STEPS
  const conceal = concealStep / STEPS

  for (let i = 0; i < grid.t.length; i++) {
    const alpha = cellAlpha(grid.t[i], reveal, conceal)
    if (alpha <= 0) continue
    ctx.fillStyle = `rgba(0,0,0,${alpha.toFixed(2)})`
    ctx.fillRect(
      (i % grid.cols) * cell,
      Math.floor(i / grid.cols) * cell,
      cell,
      cell,
    )
  }

  const mask = `url(${canvas.toDataURL('image/png')})`
  surface.cache[cacheKey] = mask
  return mask
}

function paintSparkles(surface, reveal, conceal) {
  const { grid, cell } = surface
  const ctx = surface.fx.getContext('2d')
  ctx.clearRect(0, 0, grid.w, grid.h)
  if ((reveal >= 1 && conceal <= 0) || reveal <= 0 || conceal >= 1) return

  for (let i = 0; i < grid.t.length; i++) {
    const alpha = cellAlpha(grid.t[i], reveal, conceal)
    if (alpha <= 0 || alpha >= 1) continue
    ctx.fillStyle = `rgba(${HUES[grid.hue[i]]},${(0.9 - alpha * 0.6).toFixed(2)})`
    ctx.fillRect(
      (i % grid.cols) * cell,
      Math.floor(i / grid.cols) * cell,
      cell - 1,
      cell - 1,
    )
  }
}

function setMask(el, mask) {
  el.style.webkitMaskImage = mask
  el.style.maskImage = mask
}

function setBlur(surface, px) {
  const rounded = Math.round(px * 10) / 10
  if (surface.blur === rounded) return
  surface.blur = rounded
  surface.el.style.filter = `blur(${rounded}px)`
}

/**
 * Dibuja el estado del efecto. `reveal` y `conceal` van de 0 a 1.
 * Devuelve 'hidden', 'partial' o 'full'.
 */
export function renderSurface(surface, reveal, conceal = 0, extraBlur = 0) {
  ensureGrid(surface)
  const revealStep = Math.round(clamp01(reveal) * STEPS)
  const concealStep = Math.round(clamp01(conceal) * STEPS)
  const hidden = revealStep === 0 || concealStep === STEPS
  const full = revealStep === STEPS && concealStep === 0
  const state = hidden ? 'hidden' : full ? 'full' : 'partial'

  const { maxBlur } = surface
  setBlur(
    surface,
    hidden
      ? 0
      : Math.min(
          maxBlur,
          (1 - reveal) * maxBlur + conceal * maxBlur + extraBlur,
        ),
  )

  const key = `${revealStep}_${concealStep}`
  if (key === surface.key) return state
  surface.key = key

  if (hidden) {
    setMask(surface.el, maskFor(surface, 0, 0))
    paintSparkles(surface, 0, 0)
  } else {
    setMask(
      surface.el,
      full ? FULL_MASK : maskFor(surface, revealStep, concealStep),
    )
    paintSparkles(surface, revealStep / STEPS, concealStep / STEPS)
  }
  return state
}
