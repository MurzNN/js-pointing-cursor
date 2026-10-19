const NS = 'http://www.w3.org/2000/svg'
const STYLE_ID = 'pointing-cursor-burst-style'
const RAY_COUNT = 8
const VIEW = 32
const CX = VIEW / 2
const INNER = 5
const OUTER = 13

export interface ClickBurstRay {
  x1: number
  y1: number
  x2: number
  y2: number
}

export function computeBurstRays(): ClickBurstRay[] {
  return Array.from({ length: RAY_COUNT }, (_, i) => {
    const rad = (i * Math.PI) / 4
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    return {
      x1: CX + cos * INNER,
      y1: CX + sin * INNER,
      x2: CX + cos * OUTER,
      y2: CX + sin * OUTER,
    }
  })
}

function ensureBurstStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return
  const style = doc.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
@keyframes pointing-cursor-burst-expand {
  0% { opacity: 1; transform: scale(0.35); }
  70% { opacity: 1; }
  100% { opacity: 0; transform: scale(1.35); }
}
.pointing-cursor-burst__svg {
  display: block;
  overflow: visible;
  transform-origin: 50% 50%;
  animation: pointing-cursor-burst-expand var(--pointing-cursor-burst-ms, 420ms) ease-out forwards;
}
`
  doc.head.appendChild(style)
}

export interface MountClickBurstOptions {
  x: number
  y: number
  color: string
  strokeWidth?: number | string
  size?: string
  durationMs?: number
  zIndex?: number
  onDone?: () => void
}

/**
 * Imperatively mount a radiating click-burst SVG under `parent` (usually document.body).
 */
export function mountClickBurst(
  parent: HTMLElement,
  options: MountClickBurstOptions,
): { destroy(): void } {
  const doc = parent.ownerDocument ?? document
  ensureBurstStyles(doc)

  const durationMs = options.durationMs ?? 420
  const size = options.size ?? '2.25em'
  const strokeWidth = options.strokeWidth ?? 2
  const zIndex = options.zIndex ?? 9998

  const wrap = doc.createElement('div')
  wrap.className = 'pointing-cursor-burst'
  wrap.setAttribute('aria-hidden', 'true')
  Object.assign(wrap.style, {
    position: 'fixed',
    left: `${options.x}px`,
    top: `${options.y}px`,
    zIndex: String(zIndex),
    pointerEvents: 'none',
    transform: 'translate(-50%, -50%)',
  })

  const svg = doc.createElementNS(NS, 'svg')
  svg.setAttribute('class', 'pointing-cursor-burst__svg')
  svg.setAttribute('viewBox', `0 0 ${VIEW} ${VIEW}`)
  svg.setAttribute('xmlns', NS)
  svg.setAttribute('aria-hidden', 'true')
  svg.style.width = size
  svg.style.height = size
  svg.style.setProperty('--pointing-cursor-burst-ms', `${durationMs}ms`)

  for (const ray of computeBurstRays()) {
    const line = doc.createElementNS(NS, 'line')
    line.setAttribute('x1', String(ray.x1))
    line.setAttribute('y1', String(ray.y1))
    line.setAttribute('x2', String(ray.x2))
    line.setAttribute('y2', String(ray.y2))
    line.setAttribute('stroke', options.color)
    line.setAttribute('stroke-width', String(strokeWidth))
    line.setAttribute('stroke-linecap', 'round')
    svg.appendChild(line)
  }

  wrap.appendChild(svg)
  parent.appendChild(wrap)

  let doneTimer = 0
  let destroyed = false

  function destroy(): void {
    if (destroyed) return
    destroyed = true
    if (doneTimer) window.clearTimeout(doneTimer)
    wrap.remove()
    options.onDone?.()
  }

  doneTimer = window.setTimeout(destroy, durationMs)

  return { destroy }
}
