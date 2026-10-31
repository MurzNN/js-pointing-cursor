import { useCallback, useEffect, useRef, useState } from 'react'
import {
  PointingCursor,
  type MotionStyle,
  type PointingCursorHandle,
  type ShapeName,
} from 'react-pointing-cursor'

const shapeOptions: ShapeName[] = ['arrow', 'pointer', 'hand']
const motionStyleOptions: MotionStyle[] = ['standard', 'dangling']

export default function App() {
  const cursorRef = useRef<PointingCursorHandle>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [followMouse, setFollowMouse] = useState(false)
  const [shape, setShape] = useState<ShapeName>('arrow')
  const [motionStyle, setMotionStyle] = useState<MotionStyle>('dangling')
  const [clickBurst, setClickBurst] = useState(true)
  const [markers, setMarkers] = useState<
    { id: string; x: number; y: number; label: string }[]
  >([])

  const refreshMarkers = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    setMarkers([
      {
        id: 'a',
        x: rect.left + rect.width * 0.18,
        y: rect.top + rect.height * 0.28,
        label: 'A',
      },
      {
        id: 'b',
        x: rect.left + rect.width * 0.82,
        y: rect.top + rect.height * 0.22,
        label: 'B',
      },
      {
        id: 'c',
        x: rect.left + rect.width * 0.75,
        y: rect.top + rect.height * 0.78,
        label: 'C',
      },
    ])
  }, [])

  useEffect(() => {
    refreshMarkers()
    window.addEventListener('resize', refreshMarkers)
    return () => window.removeEventListener('resize', refreshMarkers)
  }, [refreshMarkers])

  const markerStyle = (m: { x: number; y: number }) => {
    const stage = stageRef.current
    if (!stage) return {}
    const rect = stage.getBoundingClientRect()
    return {
      left: m.x - rect.left,
      top: m.y - rect.top,
    }
  }

  return (
    <div className="page">
      <PointingCursor
        ref={cursorRef}
        data-testid="react-cursor"
        visible={visible}
        followMouse={followMouse}
        hideNativeCursor
        shape={shape}
        motionStyle={motionStyle}
        clickBurst={clickBurst}
        x={typeof window !== 'undefined' ? window.innerWidth / 2 : 400}
        y={typeof window !== 'undefined' ? window.innerHeight / 2 : 300}
      />

      <header className="hero">
        <nav className="nav-demos">
          <a href="../vue/">Vue demo</a>
          <strong>React demo</strong>
        </nav>
        <h1>react-pointing-cursor</h1>
        <p>
          Same core controller as the Vue package — curved motion, follow mode,
          dangling aim, and click burst.
        </p>
      </header>

      <section className="panel">
        <div className="row">
          <button
            type="button"
            data-testid="btn-show"
            onClick={() => {
              setVisible(true)
              cursorRef.current?.show()
            }}
          >
            Show
          </button>
          <button
            type="button"
            data-testid="btn-hide"
            onClick={() => {
              setVisible(false)
              cursorRef.current?.hide()
            }}
          >
            Hide
          </button>
          <button
            type="button"
            data-testid="btn-follow"
            onClick={() => setFollowMouse((v) => !v)}
          >
            {followMouse ? 'Stop follow' : 'Follow mouse'}
          </button>
        </div>

        <fieldset className="radio-group" data-testid="shape-select">
          <legend>Shape</legend>
          {shapeOptions.map((option) => (
            <label key={option} className="radio">
              <input
                type="radio"
                name="shape"
                value={option}
                checked={shape === option}
                onChange={() => setShape(option)}
              />
              {option}
            </label>
          ))}
        </fieldset>

        <fieldset className="radio-group" data-testid="motion-style">
          <legend>Motion style</legend>
          {motionStyleOptions.map((option) => (
            <label key={option} className="radio">
              <input
                type="radio"
                name="motion"
                value={option}
                checked={motionStyle === option}
                onChange={() => setMotionStyle(option)}
              />
              {option}
            </label>
          ))}
        </fieldset>

        <div className="row">
          {markers.map((m) => (
            <button
              key={m.id}
              type="button"
              data-testid={`btn-move-${m.id}`}
              onClick={() => void cursorRef.current?.moveTo(m.x, m.y)}
            >
              Move to {m.label}
            </button>
          ))}
          <button
            type="button"
            data-testid="btn-move-zoomed"
            onClick={() => void cursorRef.current?.moveTo('#zoomed-target')}
          >
            Move to zoomed target
          </button>
          <button
            type="button"
            data-testid="btn-move-selector"
            onClick={() =>
              void cursorRef.current?.moveTo('[data-testid="demo-button"]')
            }
          >
            Move to button
          </button>
          <label className="radio">
            <input
              type="checkbox"
              checked={clickBurst}
              onChange={(e) => setClickBurst(e.target.checked)}
              data-testid="click-burst-toggle"
            />
            Click burst
          </label>
          <button
            type="button"
            data-testid="btn-click-visual"
            onClick={() => void cursorRef.current?.leftClick({ real: false })}
          >
            Click
          </button>
        </div>
      </section>

      <div ref={stageRef} className="stage" data-testid="stage">
        {markers.map((m) => (
          <div
            key={m.id}
            className="marker"
            data-marker={m.id}
            style={markerStyle(m)}
          >
            {m.label}
          </div>
        ))}
        <button
          type="button"
          className="demo-button"
          data-testid="demo-button"
          onClick={() => alert('clicked')}
        >
          Target
        </button>
      </div>

      <section className="panel">
        <h2>Target inside CSS zoom</h2>
        <p className="hint">
          The target is inside a 70%-zoomed container. Move the cursor to verify
          that it lands at the target center.
        </p>
        <div className="zoom-stage">
          <div className="zoomed-content">
            <button
              id="zoomed-target"
              type="button"
              data-testid="zoomed-target"
            >
              Zoomed target
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Install</h2>
        <p>
          NPM: <code>pnpm add react-pointing-cursor</code>
        </p>
        <p>
          shadcn (GitHub):{' '}
          <code>
            pnpm dlx shadcn@latest add MurzNN/js-pointing-cursor/react-pointing-cursor
          </code>
        </p>
      </section>
    </div>
  )
}
